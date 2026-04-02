"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Loader2, Info, ChevronDown, ChevronUp, Server, Search, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const BACKEND = process.env.NEXT_PUBLIC_VEHICLE_BACKEND_URL || 'http://localhost:8001';
type AppMode = "single" | "batch";
type CpStatus = "pending" | "processing" | "pass" | "fail";
type VerdictStatus = "valid" | "review" | "irrelevant" | "error" | "invalid" | null;

interface Checkpoint { id: string; label: string; status: CpStatus; }
interface DetectionData { value: string | null; source: string; confidence: number; manufacturer?: string; checksum?: boolean; state?: string; is_valid?: boolean; rejection_reason?: string | null; }
interface SingleResult { verdict: VerdictStatus; status: string; statusMessage: string; chassis: DetectionData; registration: DetectionData; pagesScanned: number; ocrItemsFound: number; error?: string; }
interface BatchRow {
    index: number; fileName: string; fileSize: number; status: string; statusMessage: string; chassis: string | null; chassisSource?: string; chassisConfidence: number; chassisManufacturer?: string; chassisChecksum?: boolean; chassisIsValid?: boolean; chassisRejectionReason?: string | null; registration: string | null; regState?: string; regSource?: string; regConfidence: number; pagesScanned: number; isVehicle: boolean;
    qrResult?: {
        found: boolean;
        data: string | null;
        isValid: boolean;
        summary: string | null;
        link: string | null;
    };
}

const INIT_CP: Checkpoint[] = [
    { id: "document_loading", label: "DOCUMENT LOADING", status: "pending" },
    { id: "ocr_analysis", label: "OCR ANALYSIS", status: "pending" },
    { id: "chassis_detection", label: "CHASSIS DETECTION", status: "pending" },
    { id: "registration_detection", label: "REGISTRATION DETECTION", status: "pending" },
    { id: "verdict", label: "VERDICT", status: "pending" },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function detectQRCode(file: File): Promise<{
    found: boolean;
    data: string | null;
    isValid: boolean;
    summary: string | null;
    link: string | null;
}> {
    try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const jsQR = (await import('jsqr')).default;
        const result = jsQR(imageData.data, imageData.width, imageData.height);

        if (!result || !result.data || result.data.trim().length === 0) {
            return {
                found: false,
                data: null,
                isValid: false,
                summary: null,
                link: null
            };
        }

        const raw = result.data.trim();
        let isUrl = false;
        let link: string | null = null;
        let summary = '';

        try {
            const url = new URL(raw);
            isUrl = true;
            link = raw;

            if (raw.includes('parivahan.gov.in')) {
                summary = 'Government vehicle registration record — Parivahan (MoRTH)';
            } else if (raw.includes('vahan.nic.in')) {
                summary = 'VAHAN — National Vehicle Registry, Ministry of Road Transport';
            } else if (raw.includes('digilocker.gov.in')) {
                summary = 'DigiLocker — Digitally signed government document';
            } else if (raw.includes('morth.nic.in')) {
                summary = 'Ministry of Road Transport & Highways official record';
            } else if (raw.includes('sarathi.parivahan.gov.in')) {
                summary = 'Sarathi — Driving licence and vehicle portal';
            } else {
                summary = `URL: ${url.hostname}`;
            }
        } catch {
            isUrl = false;
            link = null;

            if (/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}/.test(raw.toUpperCase())) {
                summary = `QR contains vehicle data: ${raw.substring(0, 80)}`;
            } else if (raw.length > 5) {
                summary = `QR text: ${raw.substring(0, 80)}${raw.length > 80 ? '...' : ''}`;
            } else {
                summary = 'QR contains minimal or unrecognizable data';
            }
        }

        return {
            found: true,
            data: raw,
            isValid: true,
            summary,
            link
        };
    } catch (err) {
        return {
            found: false,
            data: null,
            isValid: false,
            summary: null,
            link: null
        };
    }
}

function saveAnalyticsResult(mode: 'single' | 'batch', files: any[]) {
    try {
        const storeStr = localStorage.getItem('verentis_analytics');
        const store = storeStr ? JSON.parse(storeStr) : { sessions: [], totalProcessed: 0, lastUpdated: 0 };

        let valid = 0, invalid = 0, partial = 0, skipped = 0;
        files.forEach(f => {
            if (f.status === 'valid') valid++;
            else if (f.status === 'invalid' || f.status === 'error') invalid++;
            else if (f.status === 'partial') partial++;
            else if (f.status === 'skipped') skipped++;
        });

        store.sessions.unshift({
            id: 'ses_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            timestamp: Date.now(),
            mode,
            files,
            totalFiles: files.length,
            validCount: valid,
            invalidCount: invalid,
            partialCount: partial,
            skippedCount: skipped
        });

        if (store.sessions.length > 200) store.sessions = store.sessions.slice(0, 200);

        store.totalProcessed += files.length;
        store.lastUpdated = Date.now();
        localStorage.setItem('verentis_analytics', JSON.stringify(store));
    } catch (e) {
        console.error("Failed to save analytics", e);
    }
}

function ConfidenceRing({ value, label, color }: { value: number, label: string, color: string }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const filled = (value / 100) * circumference;
    const empty = circumference - filled;
    return (
        <div className="conf-ring-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r={radius} fill="none" stroke="#1e2535" strokeWidth="5" />
                <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${filled} ${empty}`} strokeDashoffset={circumference * 0.25} strokeLinecap="round" transform="rotate(-90 35 35)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                <text x="35" y="40" textAnchor="middle" fill="#e8ecf4" fontSize="13" fontWeight="800">
                    {Math.round(value)}%
                </text>
            </svg>
            <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
        </div>
    );
}

function renderChassisValue(chassis: string | null) {
    if (!chassis) return 'Not Detected';
    if (chassis.length < 5) return <span style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: '#e8ecf4' }}>{chassis}</span>;
    const prefix = chassis.substring(0, 3);
    const rest = chassis.substring(3);
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="chassis-prefix" style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 800, color: '#00c2cb', background: 'rgba(0,194,203,0.12)', borderRadius: '4px', padding: '2px 6px', letterSpacing: '2px', border: '1px solid rgba(0,194,203,0.2)' }}>{prefix}</span>
            <span className="chassis-rest" style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 600, color: '#e8ecf4', letterSpacing: '2px' }}>{rest}</span>
        </span>
    );
}

function renderRegValue(reg: string | null) {
    if (!reg) return 'Not Detected';
    const parts = reg.split(' ');
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {parts.map((p, i) => <span key={i} className={`reg-part-${i}`} style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 800, letterSpacing: '1px', background: i === 0 ? 'rgba(0,194,203,0.1)' : i === 1 ? 'rgba(0,136,255,0.1)' : 'transparent', padding: i < 2 ? '2px 6px' : '0', borderRadius: '4px', color: i === 0 ? '#00c2cb' : i === 1 ? '#0088ff' : '#e8ecf4' }}>{p}</span>)}
        </span>
    );
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            style={{ background: copied ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(0,200,83,0.4)' : '#2d3748'}`, color: copied ? '#00c853' : '#4a5568', borderRadius: 6, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', marginLeft: 8 }}
        >
            {copied ? '✓ Copied' : 'Copy'}
        </button>
    );
}

function SummaryDonut({ valid, partial, invalid, skipped, total }: { valid: number, partial: number, invalid: number, skipped: number, total: number }) {
    if (total === 0) return null;
    const size = 100, cx = 50, cy = 50, r = 38;
    const circ = 2 * Math.PI * r;
    const segments = [
        { value: valid, color: '#00c853' },
        { value: partial, color: '#ffab00' },
        { value: invalid, color: '#ff1744' },
        { value: skipped, color: '#2d3748' },
    ];
    let offset = 0;
    const arcs = segments.map(s => {
        const pct = s.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const arc = { ...s, dash, gap, offset };
        offset += dash;
        return arc;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2535" strokeWidth="10" />
                {arcs.map((arc, i) => (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth="10" strokeDasharray={`${arc.dash} ${arc.gap}`} strokeDashoffset={circ * 0.25 - arc.offset} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                ))}
                <text x={cx} y={cy - 4} textAnchor="middle" fill="#e8ecf4" fontSize="16" fontWeight="800">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#4a5568" fontSize="8">TOTAL</text>
            </svg>
        </div>
    );
}

function SortTh({ col, label, sortCol, sortDir, toggleSort }: { col: string, label: string, sortCol: string | null, sortDir: string, toggleSort: (col: string) => void }) {
    const active = sortCol === col;
    return (
        <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '14px 16px', color: active ? '#00c2cb' : '#4a5568', transition: 'color 0.2s', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {label}
                <span style={{ fontSize: 8, opacity: active ? 1 : 0.3 }}>
                    {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                </span>
            </div>
        </th>
    );
}

export function VehicleModule() {
    const [mode, setMode] = useState<AppMode>("single");
    const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
    const [showInstructions, setShowInstructions] = useState(false);
    const [singleStatus, setSingleStatus] = useState<"idle" | "processing" | "complete">("idle");
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(INIT_CP);
    const [singleResult, setSingleResult] = useState<SingleResult | null>(null);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
    const [batchStatus, setBatchStatus] = useState<"idle" | "processing" | "complete">("idle");
    const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, fileName: "" });
    const [toasts, setToasts] = useState<Array<{ id: number, msg: string, type: string }>>([]);
    const [sessionStats, setSessionStats] = useState({ total: 0, valid: 0, invalid: 0, partial: 0, avgConf: 0 });
    const [tooltipRow, setTooltipRow] = useState<number | null>(null);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const cancelRef = useRef(false);

    function toggleSort(col: string) {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    }

    const sortedRows = [...batchRows].sort((a, b) => {
        if (!sortCol) return 0;
        let av = '', bv = '';
        if (sortCol === 'status') { av = a.status; bv = b.status; }
        if (sortCol === 'chassis') { av = a.chassis || ''; bv = b.chassis || ''; }
        if (sortCol === 'registration') { av = a.registration || ''; bv = b.registration || ''; }
        if (sortCol === 'file') { av = a.fileName; bv = b.fileName; }
        if (sortCol === 'state') { av = a.regState || ''; bv = b.regState || ''; }
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const showToast = (msg: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const fileRef = useRef<HTMLInputElement>(null);
    const folderRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (folderRef.current) {
            folderRef.current.setAttribute("webkitdirectory", "");
            folderRef.current.setAttribute("directory", "");
        }
    }, [mode]);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(3000) });
                const d = await r.json();
                setBackendStatus(d.status === 'ok' ? 'online' : 'offline');
            } catch {
                setBackendStatus('offline');
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const updateCheckpoint = useCallback((id: string, st: CpStatus) => {
        setCheckpoints(prev => prev.map(c => c.id === id ? { ...c, status: st } : c));
    }, []);

    const updateBatchRow = useCallback((index: number, data: Partial<BatchRow>) => {
        setBatchRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...data } as BatchRow;
            return next;
        });
    }, []);

    const toggleRowExpand = (index: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const analyzeDocument = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${BACKEND}/analyze`, { method: 'POST', body: formData, });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { throw new Error('Invalid response from backend'); }
        if (!response.ok) throw new Error(data.error || `Backend error: ${response.status}`);
        return data;
    };

    const runSinglePipeline = async (file: File) => {
        setUploadedFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
        setSingleStatus('processing');
        setSingleResult(null);
        setCheckpoints(INIT_CP);

        try {
            updateCheckpoint('document_loading', 'processing');
            await delay(300);
            updateCheckpoint('document_loading', 'pass');

            updateCheckpoint('ocr_analysis', 'processing');
            let data;
            try {
                data = await analyzeDocument(file);
            } catch (err: any) {
                updateCheckpoint('ocr_analysis', 'fail');
                setSingleResult({
                    verdict: 'error', status: 'error', error: err.message, statusMessage: err.message,
                    chassis: { value: null, source: '', confidence: 0 }, registration: { value: null, source: '', confidence: 0 },
                    pagesScanned: 0, ocrItemsFound: 0
                });
                setSingleStatus('complete');
                return;
            }
            await delay(300);
            updateCheckpoint('ocr_analysis', 'pass');

            updateCheckpoint('chassis_detection', 'processing');
            await delay(300);
            updateCheckpoint('chassis_detection', data.chassis?.value ? 'pass' : 'fail');

            updateCheckpoint('registration_detection', 'processing');
            await delay(300);
            updateCheckpoint('registration_detection', data.registration?.value ? 'pass' : 'fail');

            updateCheckpoint('verdict', 'processing');
            await delay(300);
            updateCheckpoint('verdict', 'pass');

            setSingleResult({
                verdict: data.status === 'valid' ? 'valid' : data.status === 'partial' ? 'review' : data.status === 'invalid' ? 'invalid' : data.status === 'skipped' ? 'irrelevant' : 'irrelevant',
                status: data.status,
                chassis: data.chassis,
                registration: data.registration,
                pagesScanned: data.pagesScanned,
                statusMessage: data.statusMessage,
                ocrItemsFound: data.ocrItemsFound
            });
            saveAnalyticsResult('single', [{
                filename: file.name,
                status: data.status,
                chassis: data.chassis?.value || null,
                manufacturer: data.chassis?.manufacturer || null,
                registration: data.registration?.value || null,
                state: data.registration?.state || null,
                confidence: Math.max(data.chassis?.confidence || 0, data.registration?.confidence || 0),
                processingTime: 1.5,
                rejectionReason: data.chassis?.rejection_reason || null
            }]);
            setSingleStatus('complete');
            showToast(`Analysis complete: ${data.status.toUpperCase()}`, data.status === 'valid' ? 'success' : 'error');

        } catch (err: any) {
            setSingleResult({
                verdict: 'error', status: 'error', error: err.message, statusMessage: err.message,
                chassis: { value: null, source: '', confidence: 0 }, registration: { value: null, source: '', confidence: 0 },
                pagesScanned: 0, ocrItemsFound: 0
            });
            saveAnalyticsResult('single', [{
                filename: file.name,
                status: 'error',
                chassis: null,
                manufacturer: null,
                registration: null,
                state: null,
                confidence: 0,
                processingTime: 0.1,
                rejectionReason: err.message
            }]);
            setSingleStatus('complete');
            showToast(`Analysis failed: ${err.message}`, 'error');
        }
    };

    const runBatchPipeline = async (files: File[]) => {
        const results: BatchRow[] = [];
        setBatchStatus('processing');
        setExpandedRows(new Set());
        setTooltipRow(null);
        cancelRef.current = false;

        for (let i = 0; i < files.length; i++) {
            results.push({
                index: i, fileName: files[i].name, fileSize: files[i].size, status: 'pending', statusMessage: '', chassis: null, chassisConfidence: 0,
                registration: null, regConfidence: 0, pagesScanned: 0, isVehicle: false
            });
        }
        setBatchRows(results);

        for (let i = 0; i < files.length; i++) {
            if (cancelRef.current) break;
            const file = files[i];
            updateBatchRow(i, { status: 'processing', fileName: file.name });
            setBatchProgress({ current: i + 1, total: files.length, fileName: file.name });

            try {
                const data = await analyzeDocument(file);

                let qrResult: { found: boolean; data: string | null; isValid: boolean; summary: string | null; link: string | null; } = {
                    found: false, data: null, isValid: false,
                    summary: null, link: null
                };
                try {
                    qrResult = await detectQRCode(file);
                } catch {
                    // QR detection failure must never crash the batch
                }

                const row: BatchRow = {
                    index: i, fileName: file.name, fileSize: file.size, status: data.status, statusMessage: data.statusMessage,
                    chassis: data.chassis?.value || null, chassisSource: data.chassis?.source, chassisConfidence: data.chassis?.confidence || 0,
                    chassisManufacturer: data.chassis?.manufacturer, chassisChecksum: data.chassis?.checksum, chassisIsValid: data.chassis?.is_valid,
                    chassisRejectionReason: data.chassis?.rejection_reason || null, registration: data.registration?.value || null,
                    regState: data.registration?.state, regSource: data.registration?.source, regConfidence: data.registration?.confidence || 0,
                    pagesScanned: data.pagesScanned, isVehicle: data.isVehicleDocument,
                    qrResult
                };
                results[i] = row;
                updateBatchRow(i, row);
            } catch (err: any) {
                const row = { ...results[i], status: 'error', statusMessage: err.message, };
                results[i] = row;
                updateBatchRow(i, row);
            }
            await delay(300);
        }
        setBatchRows([...results]);
        const finalRows = results.filter(r => r.status !== 'pending');
        const valid = finalRows.filter(r => r.status === 'valid').length;
        const invalid = finalRows.filter(r => r.status === 'invalid').length;
        const partial = finalRows.filter(r => r.status === 'partial').length;
        const avgConf = Math.round(
            finalRows.filter(r => r.chassisConfidence)
                .map(r => r.chassisConfidence)
                .reduce((a, b) => a + b, 0) /
            (finalRows.filter(r => r.chassisConfidence).length || 1)
        );
        setSessionStats({ total: finalRows.length, valid, invalid, partial, avgConf });

        saveAnalyticsResult('batch', finalRows.map(r => ({
            filename: r.fileName,
            status: r.status,
            chassis: r.chassis,
            manufacturer: r.chassisManufacturer || null,
            registration: r.registration,
            state: r.regState || null,
            confidence: Math.max(r.chassisConfidence || 0, r.regConfidence || 0),
            processingTime: 1.2,
            rejectionReason: r.chassisRejectionReason || null
        })));
        setBatchStatus('complete');
        showToast(`Batch processing completed (${results.length} files)`, 'success');
    };

    const exportCSV = () => {
        if (!batchRows.length) return;
        const hdrs = ["File Name", "Status", "Chassis", "Manufacturer", "Chassis Confidence", "Registration", "State", "Registration Confidence", "Pages Scanned", "Rejection Reason", "Status Message"];
        const rows = batchRows.map(r => [
            r.fileName, r.status, r.chassis || "Not Detected", r.chassisManufacturer || "-", `${r.chassisConfidence}%`,
            r.registration || "Not Detected", r.regState || "-", `${r.regConfidence}%`, r.pagesScanned.toString(),
            (r.chassisRejectionReason || "-").replace(/"/g, '""'), r.statusMessage.replace(/"/g, '""')
        ]);
        const csv = [hdrs.join(","), ...rows.map(r => `"${r.join('","')}"`)].join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `vehicle_forensics_batch_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportJSON = (rows: BatchRow[]) => {
        const data = rows.map(r => ({
            fileName: r.fileName,
            chassis: r.chassis,
            chassisValid: !!r.chassis && r.status !== 'invalid',
            chassisConfidence: r.chassisConfidence,
            manufacturer: r.chassisManufacturer,
            registration: r.registration,
            state: r.regState || null,
            status: r.status,
            reason: r.statusMessage,
            invalidReason: r.chassisRejectionReason || null,
            qrFound: r.qrResult?.found || false,
            qrSummary: r.qrResult?.summary || null,
            fileSizeKB: (r.fileSize / 1024).toFixed(1),
        }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehicle_batch_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const validCount = batchRows.filter(r => r.status === 'valid').length;
    const partialCount = batchRows.filter(r => r.status === 'partial').length;
    const invalidCount = batchRows.filter(r => r.status === 'invalid').length;
    const notVehicleCount = batchRows.filter(r => r.status === 'skipped').length;
    const errorCount = batchRows.filter(r => r.status === 'error').length;

    return (
        <div style={{ position: 'relative', background: '#050810', minHeight: '100vh', overflow: 'hidden' }}>
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,194,203,0.04) 0%, transparent 70%)', top: '-10%', left: '-10%', animation: 'meshFloat1 18s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,136,255,0.03) 0%, transparent 70%)', top: '40%', right: '-5%', animation: 'meshFloat2 22s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,83,0.02) 0%, transparent 70%)', bottom: '-5%', left: '30%', animation: 'meshFloat3 26s ease-in-out infinite' }} />
            </div>
            <div className="space-y-4 px-6 py-6" style={{ position: 'relative', zIndex: 1 }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
            .vehicle-module { position: relative; background-image: linear-gradient(rgba(0,194,203,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,194,203,0.02) 1px, transparent 1px); background-size: 40px 40px; background-position: -1px -1px; min-height: 100vh; padding: 24px; color: #e8ecf4; }
            .vehicle-hero { display: flex; align-items: center; gap: 24px; background: linear-gradient(135deg, #050d1a 0%, #0a1628 60%, #0d1f35 100%); border: 1px solid #1e2535; border-radius: 16px; padding: 24px 32px; margin-bottom: 24px; position: relative; overflow: hidden; }
            .vehicle-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,194,203,0.03) 40px, rgba(0,194,203,0.03) 41px); pointer-events: none; }
            .vehicle-hero h1 { font-size: 22px; font-weight: 700; color: #e8ecf4; margin: 0 0 6px 0; letter-spacing: -0.3px; }
            .vehicle-hero p { font-size: 13px; color: #4a5568; margin: 0 0 12px 0; }
            .hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }
            .badge-teal { font-size: 11px; font-weight: 600; color: #00c2cb; background: rgba(0,194,203,0.1); border: 1px solid rgba(0,194,203,0.3); border-radius: 20px; padding: 3px 10px; letter-spacing: 0.3px; }
            .badge-green { font-size: 11px; font-weight: 600; color: #00c853; background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.3); border-radius: 20px; padding: 3px 10px; }
            .mode-switcher { display: flex; gap: 4px; background: #0a0d14; border: 1px solid #1e2535; border-radius: 12px; padding: 4px; width: fit-content; margin-bottom: 20px; }
            .mode-btn { display: flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 9px; font-size: 13px; font-weight: 500; color: #4a5568; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; }
            .mode-btn.active { background: #00c2cb; color: #050d1a; box-shadow: 0 0 20px rgba(0,194,203,0.3); }
            .mode-btn:hover:not(.active) { color: #e8ecf4; background: #1a1f35; }
            .upload-zone { position: relative; border: 1px dashed #1e2535; border-radius: 16px; padding: 48px 32px; text-align: center; background: #080c14; transition: all 0.3s ease; overflow: hidden; cursor: pointer; }
            .upload-zone:hover { border-color: #00c2cb; background: rgba(0,194,203,0.03); }
            .scan-line { position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(0,194,203,0.6) 20%, rgba(0,194,203,1) 50%, rgba(0,194,203,0.6) 80%, transparent 100%); top: 0; animation: scanDown 3s ease-in-out infinite; opacity: 0.5; }
            @keyframes scanDown { 0% { top: 0; opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { top: 100%; opacity: 0; } }
            .upload-icon { margin-bottom: 16px; margin-left: auto; margin-right: auto; width: 48px; }
            .upload-title { font-size: 16px; font-weight: 600; color: #e8ecf4; margin: 0 0 6px; }
            .upload-sub { font-size: 12px; color: #4a5568; margin: 0 0 20px; letter-spacing: 0.5px; }
            .upload-btn { padding: 10px 28px; background: transparent; border: 1px solid #00c2cb; color: #00c2cb; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.5px; transition: all 0.2s; }
            .upload-btn:hover { background: #00c2cb; color: #050d1a; box-shadow: 0 0 20px rgba(0,194,203,0.4); }
            .verdict-banner { display: flex; align-items: center; gap: 16px; padding: 20px 28px; border-radius: 14px; margin-bottom: 20px; position: relative; overflow: hidden; }
            .verdict-banner.valid { background: linear-gradient(135deg, #0a1f10 0%, #0f2d1a 100%); border: 1px solid rgba(0,200,83,0.4); box-shadow: 0 0 30px rgba(0,200,83,0.1); }
            .verdict-banner.invalid { background: linear-gradient(135deg, #1a0a0a 0%, #2d0a0a 100%); border: 1px solid rgba(255,23,68,0.4); box-shadow: 0 0 30px rgba(255,23,68,0.1); }
            .verdict-banner.partial { background: linear-gradient(135deg, #1a1200 0%, #2d1f00 100%); border: 1px solid rgba(255,171,0,0.4); box-shadow: 0 0 30px rgba(255,171,0,0.1); }
            .verdict-banner.skipped { background: linear-gradient(135deg, #0d0f14 0%, #1a1b26 100%); border: 1px solid rgba(74,85,104,0.4); }
            .verdict-title { font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            .verdict-banner.valid .verdict-title { color: #00c853; }
            .verdict-banner.invalid .verdict-title { color: #ff1744; }
            .verdict-banner.partial .verdict-title { color: #ffab00; }
            .verdict-banner.skipped .verdict-title { color: #a0aec0; }
            .verdict-sub { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.6; margin-top: 3px; }
            .verdict-pulse { position: absolute; right: 20px; width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
            .valid .verdict-pulse { background: #00c853; box-shadow: 0 0 12px #00c853; }
            @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
            .data-card { background: #0d1020; border: 1px solid #1e2535; border-radius: 14px; padding: 20px 24px; position: relative; overflow: hidden; }
            .data-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #00c2cb; }
            .data-card-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #00c2cb; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .data-card-value { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 22px; font-weight: 700; color: #e8ecf4; letter-spacing: 2px; margin-bottom: 8px; }
            .data-card-value.invalid-value { color: #ff1744; text-decoration: line-through; opacity: 0.7; }
            .data-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
            .meta-badge { font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px; }
            .meta-badge.manufacturer { color: #00c2cb; background: rgba(0,194,203,0.1); border: 1px solid rgba(0,194,203,0.3); }
            .meta-badge.checksum-pass { color: #00c853; background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.3); }
            .meta-badge.checksum-fail { color: #ff1744; background: rgba(255,23,68,0.1); border: 1px solid rgba(255,23,68,0.3); }
            .meta-badge.state { color: #0088ff; background: rgba(0,136,255,0.1); border: 1px solid rgba(0,136,255,0.3); }
            .pipeline-stepper { background: #080c14; border: 1px solid #1e2535; border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; }
            .pipeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .pipeline-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #4a5568; text-transform: uppercase; }
            .pipeline-engine { font-size: 10px; color: #00c2cb; background: rgba(0,194,203,0.1); border: 1px solid rgba(0,194,203,0.2); padding: 3px 10px; border-radius: 20px; }
            .steps-row { display: flex; align-items: flex-start; justify-content: space-between; }
            .step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
            .step-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; z-index: 1; transition: all 0.3s ease; }
            .step-icon.pending { background: #0a0d14; border: 1px solid #1e2535; color: #4a5568; }
            .step-icon.processing { background: rgba(0,194,203,0.1); border: 2px solid #00c2cb; box-shadow: 0 0 15px rgba(0,194,203,0.4); }
            .step-icon.pass { background: rgba(0,200,83,0.15); border: 2px solid #00c853; color: #00c853; box-shadow: 0 0 12px rgba(0,200,83,0.3); }
            .step-icon.fail { background: rgba(255,23,68,0.15); border: 2px solid #ff1744; color: #ff1744; box-shadow: 0 0 12px rgba(255,23,68,0.3); }
            .step-spinner { width: 16px; height: 16px; border: 2px solid rgba(0,194,203,0.3); border-top-color: #00c2cb; border-radius: 50%; animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .step-line { position: absolute; top: 18px; left: 50%; right: -50%; height: 2px; background: #1e2535; z-index: 0; transition: background 0.5s ease; }
            .step-line.active { background: #00c853; }
            .step-label { font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #4a5568; margin-top: 8px; text-align: center; }
            .batch-table { border-radius: 14px; overflow: hidden; border: 1px solid #1e2535; width: 100%; border-collapse: collapse; }
            .batch-table thead tr { background: #080c14; }
            .batch-table thead th { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #4a5568; padding: 14px 16px; border-bottom: 1px solid #1e2535; text-align: left; }
            .batch-table tbody tr { background: #0a0d14; border-bottom: 1px solid rgba(30,37,53,0.5); transition: background 0.15s ease; }
            .batch-table tbody tr:hover { background: #0d1020; }
            .batch-table tbody tr.expanded { background: #0d1020; border-left: 2px solid #00c2cb; }
            .batch-table td { padding: 14px 16px; font-size: 13px; }
            .chassis-value { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #e8ecf4; letter-spacing: 1px; }
            .chassis-value.invalid { color: #ff5252; text-decoration: line-through; opacity: 0.7; }
            .rejection-note { font-size: 10px; color: #ff5252; margin-top: 3px; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
            .status-badge { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
            .status-badge.valid { color: #00c853; background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.4); box-shadow: 0 0 8px rgba(0,200,83,0.15); }
            .status-badge.invalid { color: #ff1744; background: rgba(255,23,68,0.1); border: 1px solid rgba(255,23,68,0.4); box-shadow: 0 0 8px rgba(255,23,68,0.15); }
            .status-badge.partial { color: #ffab00; background: rgba(255,171,0,0.1); border: 1px solid rgba(255,171,0,0.4); }
            .status-badge.skipped { color: #4a5568; background: rgba(74,85,104,0.1); border: 1px solid rgba(74,85,104,0.4); }
            .confidence-bar-wrap { display: flex; align-items: center; gap: 8px; }
            .confidence-bar { height: 4px; border-radius: 4px; background: #1e2535; width: 60px; overflow: hidden; }
            .confidence-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
            .confidence-fill.high { background: #00c853; }
            .confidence-fill.mid { background: #ffab00; }
            .confidence-fill.low { background: #ff1744; }
            .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
            .summary-card { border-radius: 12px; padding: 20px 16px; text-align: center; border: 1px solid; transition: transform 0.2s; }
            .summary-card:hover { transform: translateY(-2px); }
            .summary-card.valid { background: #0a1f10; border-color: rgba(0,200,83,0.3); box-shadow: 0 4px 20px rgba(0,200,83,0.08); }
            .summary-card.partial { background: #1a1200; border-color: rgba(255,171,0,0.3); box-shadow: 0 4px 20px rgba(255,171,0,0.08); }
            .summary-card.invalid { background: #1a0808; border-color: rgba(255,23,68,0.3); box-shadow: 0 4px 20px rgba(255,23,68,0.08); }
            .summary-card.skipped { background: #0d0f14; border-color: rgba(74,85,104,0.3); }
            .summary-card.error { background: #1a0a0a; border-color: rgba(255,23,68,0.2); }
            .summary-icon { font-size: 20px; margin-bottom: 8px; }
            .summary-count { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
            .summary-card.valid .summary-count { color: #00c853; }
            .summary-card.partial .summary-count { color: #ffab00; }
            .summary-card.invalid .summary-count { color: #ff1744; }
            .summary-card.skipped .summary-count { color: #4a5568; }
            .summary-label { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.6; }
            .csv-btn { padding: 8px 16px; background: transparent; border: 1px solid rgba(0,194,203,0.5); color: #00c2cb; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; }
            .csv-btn:hover { background: rgba(0,194,203,0.1); border-color: #00c2cb; box-shadow: 0 0 15px rgba(0,194,203,0.2); }
            @keyframes scanDoc { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(40px); opacity: 0; } }
            @keyframes meshFloat1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, 30px) scale(1.05); } 66% { transform: translate(-20px, 50px) scale(0.97); } }
            @keyframes meshFloat2 { 0%, 100% { transform: translate(0, 0) scale(1); } 40% { transform: translate(-50px, -30px) scale(1.08); } 70% { transform: translate(30px, 20px) scale(0.95); } }
            @keyframes meshFloat3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(60px, -40px) scale(1.1); } }
            .vehicle-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
            .vehicle-scroll::-webkit-scrollbar-track { background: #080c14; }
            .vehicle-scroll::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 10px; }
            .vehicle-scroll::-webkit-scrollbar-thumb:hover { background: #2d3748; }
            .toast-container { position: fixed; top: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
            .toast { padding: 14px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; color: #e8ecf4; display: flex; align-items: center; gap: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px); animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: auto; }
            .toast.success { border-bottom: 3px solid #00c853; background: rgba(0,200,83,0.15); border: 1px solid rgba(0,200,83,0.3); }
            .toast.error { border-bottom: 3px solid #ff1744; background: rgba(255,23,68,0.15); border: 1px solid rgba(255,23,68,0.3); }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}} />

                <div className="flex items-center justify-between pb-2">
                    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold tracking-widest uppercase", backendStatus === "online" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : backendStatus === "checking" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-red-500/30 bg-red-500/10 text-red-400")}>
                        {backendStatus === "online" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {backendStatus === "checking" && <Loader2 className="w-3 h-3 animate-spin" />}
                        {backendStatus === "online" ? "PaddleOCR Engine Online" : backendStatus === "checking" ? "Checking engine..." : "Engine Offline"}
                    </div>
                </div>

                <div className="vehicle-hero">
                    <svg viewBox="0 0 100 110" width="64" height="70" className="flex-shrink-0">
                        <path d="M50 2 L98 18 L98 62 Q98 90 50 108 Q2 90 2 62 L2 18 Z" fill="#0a1628" stroke="#00c2cb" strokeWidth="1.5" />
                        <path d="M50 10 L90 24 L90 62 Q90 84 50 98 Q10 84 10 62 L10 24 Z" fill="none" stroke="#00c2cb" strokeWidth="0.5" opacity="0.4" />
                        <line x1="22" y1="44" x2="78" y2="44" stroke="#00c2cb" strokeWidth="0.8" opacity="0.5" />
                        <line x1="18" y1="54" x2="82" y2="54" stroke="#00c2cb" strokeWidth="2" />
                        <line x1="22" y1="64" x2="78" y2="64" stroke="#00c2cb" strokeWidth="0.8" opacity="0.5" />
                        <line x1="28" y1="74" x2="72" y2="74" stroke="#00c2cb" strokeWidth="0.5" opacity="0.3" />
                        <rect x="26" y="48" width="48" height="12" rx="2" fill="#00c2cb" opacity="0.12" />
                        <text fontFamily="monospace" fontSize="7" fill="#00c2cb" fontWeight="700" x="50" y="57.5" textAnchor="middle">VIN SCAN</text>
                        <circle cx="50" cy="87" r="7" fill="none" stroke="#00c853" strokeWidth="1.5" />
                        <path d="M46 87 L49 91 L55 83" fill="none" stroke="#00c853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="vehicle-hero-text z-10">
                        <h1>Vehicle Forensics Engine</h1>
                        <p>AI-powered chassis and registration detection for Indian vehicles</p>
                        <div className="hero-badges">
                            <span className="badge-teal">PaddleOCR</span>
                            <span className="badge-teal">VIN Validation</span>
                            <span className="badge-teal">17-State Detection</span>
                            <span className="badge-green">Offline Mode</span>
                        </div>
                        <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {[
                                { label: 'Session Processed', value: sessionStats.total, color: '#e8ecf4' },
                                { label: 'Valid', value: sessionStats.valid, color: '#00c853' },
                                { label: 'Invalid / Fake', value: sessionStats.invalid, color: '#ff1744' },
                                { label: 'Avg Confidence', value: `${sessionStats.avgConf}%`, color: '#00c2cb' },
                            ].map(s => (
                                <div key={s.label}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#2d3748', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c853', boxShadow: '0 0 8px #00c853', animation: 'pulse 2s infinite', marginRight: 8 }} />
                                <span style={{ fontSize: 10, color: '#00c853', fontWeight: 600 }}>LIVE SESSION</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mode-switcher">
                    <button className={`mode-btn ${mode === 'single' ? 'active' : ''}`} id="btn-single" onClick={() => { setMode('single'); setSessionStats({ total: 0, valid: 0, invalid: 0, partial: 0, avgConf: 0 }); }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1" />
                            <line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1" />
                            <line x1="5" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1" />
                        </svg> Single Document
                    </button>
                    <button className={`mode-btn ${mode === 'batch' ? 'active' : ''}`} id="btn-batch" onClick={() => { setMode('batch'); setSessionStats({ total: 0, valid: 0, invalid: 0, partial: 0, avgConf: 0 }); }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="4" width="10" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="5" y="1" width="10" height="11" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                        </svg> Batch Folder
                    </button>
                </div>

                {mode === "single" && (
                    <div>
                        <div className="upload-zone" id="drop-zone" onClick={() => fileRef.current?.click()}>
                            {singleStatus === 'idle' || singleStatus === 'complete' ? (
                                <>
                                    <div className="empty-state" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                            <rect x="16" y="8" width="44" height="56" rx="6" stroke="#1e2535" strokeWidth="2" />
                                            <rect x="20" y="8" width="44" height="56" rx="6" stroke="#2d3748" strokeWidth="1.5" />
                                            <line x1="28" y1="28" x2="52" y2="28" stroke="#1e2535" strokeWidth="2" />
                                            <line x1="28" y1="36" x2="52" y2="36" stroke="#1e2535" strokeWidth="2" />
                                            <line x1="28" y1="44" x2="44" y2="44" stroke="#1e2535" strokeWidth="2" />
                                            <rect x="22" y="20" width="36" height="2" rx="1" fill="rgba(0,194,203,0.5)" style={{ animation: 'scanDoc 2s ease-in-out infinite' }} />
                                            <circle cx="60" cy="58" r="14" fill="#080c14" stroke="#00c2cb" strokeWidth="1.5" />
                                            <path d="M55 58 L59 62 L65 54" stroke="#00c2cb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <p className="upload-title">{uploadedFile && singleStatus === 'complete' ? `Analyzed: ${uploadedFile.name}` : "Drop vehicle document here"}</p>
                                    <p className="upload-sub">PDF • PNG • JPG • JPEG • TIFF • WEBP</p>
                                    <button className="upload-btn">Select File</button>
                                </>
                            ) : (
                                <div className="live-scan py-8 flex flex-col items-center">
                                    <div className="relative">
                                        <div className="scan-line-progress" style={{ width: '200px', height: '4px', background: '#1e2535', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div className="fill" style={{ width: `${Math.round((checkpoints.filter(c => c.status === 'pass' || c.status === 'fail').length / checkpoints.length) * 100)}%`, height: '100%', background: '#00c2cb', transition: 'width 0.3s ease' }}></div>
                                        </div>
                                        <div className="scan-flare absolute top-1/2 -ml-[25px]" style={{ left: `${Math.round((checkpoints.filter(c => c.status === 'pass' || c.status === 'fail').length / checkpoints.length) * 100)}%`, width: '50px', height: '30px', background: 'radial-gradient(ellipse at center, rgba(0,194,203,0.8) 0%, transparent 70%)', transform: 'translateY(-50%)' }}></div>
                                    </div>
                                    <p className="upload-title text-[#e8ecf4] mt-6 tracking-[1px] text-[11px] uppercase font-bold text-[#00c2cb]">
                                        {checkpoints.find(c => c.status === 'processing')?.label || checkpoints.find(c => c.status === 'pending')?.label || 'FINALIZATION'}...
                                    </p>
                                </div>
                            )}
                            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp,.bmp" onChange={e => { const f = e.target.files?.[0]; if (f) runSinglePipeline(f); e.target.value = ''; }} />
                        </div>

                        {singleStatus !== "idle" && (
                            <div className="mt-8">
                                <div className="pipeline-stepper">
                                    <div className="pipeline-header">
                                        <span className="pipeline-label">Analysis Pipeline</span>
                                        <span className="pipeline-engine">PaddleOCR Engine</span>
                                    </div>
                                    <div className="steps-row">
                                        {checkpoints.map((cp, i) => (
                                            <div className="step" key={cp.id}>
                                                <div className={`step-icon ${cp.status}`}>
                                                    {cp.status === 'processing' && <div className="step-spinner" />}
                                                    {cp.status === 'pass' && <span>✓</span>}
                                                    {cp.status === 'fail' && <span>✗</span>}
                                                    {cp.status === 'pending' && <span>{i + 1}</span>}
                                                </div>
                                                {i < checkpoints.length - 1 && (
                                                    <div className={`step-line ${cp.status === 'pass' ? 'active' : ''}`} />
                                                )}
                                                <div className="step-label">{cp.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {singleStatus === "complete" && singleResult && (
                                    <div>
                                        <div className={`verdict-banner ${singleResult.status}`}>
                                            <div className="verdict-icon">
                                                {singleResult.status === 'valid' ? (
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L30 8V18Q30 26 16 30Q2 26 2 18V8Z" fill="rgba(0,200,83,0.15)" stroke="#00c853" strokeWidth="1.5" /><path d="M10 16L14 20L22 12" stroke="#00c853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                ) : singleResult.status === 'invalid' ? (
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L30 8V18Q30 26 16 30Q2 26 2 18V8Z" fill="rgba(255,23,68,0.15)" stroke="#ff1744" strokeWidth="1.5" /><path d="M12 12L20 20M20 12L12 20" stroke="#ff1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                ) : (
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L30 8V18Q30 26 16 30Q2 26 2 18V8Z" fill="rgba(255,171,0,0.15)" stroke="#ffab00" strokeWidth="1.5" /><path d="M16 10V18M16 22H16.01" stroke="#ffab00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                )}
                                            </div>
                                            <div>
                                                <div className="verdict-title">{singleResult.status === 'valid' ? 'VALID DOCUMENT' : singleResult.status === 'invalid' ? 'INVALID / FAKE DOCUMENT' : singleResult.status === 'partial' ? 'PARTIAL RESULT' : 'NOT VEHICLE'}</div>
                                                <div className="verdict-sub">{singleResult.statusMessage}</div>
                                            </div>
                                            {singleResult.status === 'valid' && <div className="verdict-pulse" />}
                                        </div>

                                        {(singleResult.status !== 'skipped' && singleResult.status !== 'error') && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="data-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                    <div className="flex-1">
                                                        <div className="data-card-label">CHASSIS / VIN</div>
                                                        <div className={`data-card-value ${singleResult.chassis?.is_valid === false ? 'invalid-value' : ''}`}>{renderChassisValue(singleResult.chassis?.value || null)}</div>
                                                        <div className="data-card-meta">
                                                            {singleResult.chassis?.value && <span className="meta-badge">{(singleResult.chassis.value ? singleResult.chassis.value.length : 0)} chars</span>}
                                                            {singleResult.chassis?.manufacturer && <span className="meta-badge manufacturer">{singleResult.chassis.manufacturer}</span>}
                                                            {singleResult.chassis?.checksum !== undefined && <span className={`meta-badge ${singleResult.chassis.checksum ? 'checksum-pass' : 'checksum-fail'}`}>{singleResult.chassis.checksum ? 'CSUM PASS' : 'CSUM FAIL'}</span>}
                                                        </div>
                                                        {singleResult.chassis?.is_valid === false && <div className="mt-3 text-[#ff1744] text-xs font-mono font-bold">REASON: {singleResult.chassis?.rejection_reason}</div>}
                                                    </div>
                                                    {(singleResult.chassis?.confidence ?? 0) > 0 && <ConfidenceRing value={singleResult.chassis?.confidence ?? 0} label="CHASSIS" color={(singleResult.chassis?.confidence ?? 0) > 80 ? '#00c853' : (singleResult.chassis?.confidence ?? 0) > 50 ? '#ffab00' : '#ff1744'} />}
                                                </div>
                                                <div className="data-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                    <div className="flex-1">
                                                        <div className="data-card-label">REGISTRATION</div>
                                                        <div className="data-card-value">{renderRegValue(singleResult.registration?.value || null)}</div>
                                                        <div className="data-card-meta">
                                                            {singleResult.registration?.state && <span className="meta-badge state">{singleResult.registration.state}</span>}
                                                        </div>
                                                    </div>
                                                    {(singleResult.registration?.confidence ?? 0) > 0 && <ConfidenceRing value={singleResult.registration?.confidence ?? 0} label="REG" color={(singleResult.registration?.confidence ?? 0) > 80 ? '#00c853' : (singleResult.registration?.confidence ?? 0) > 50 ? '#ffab00' : '#ff1744'} />}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {mode === "batch" && (
                    <div>
                        <div className="upload-zone" onClick={() => folderRef.current?.click()}>
                            <div className="scan-line" id="scan-anim"></div>
                            <div className="upload-icon">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="28" rx="4" stroke="#00c2cb" strokeWidth="1.5" /><path d="M16 10V6C16 4.89543 16.8954 4 18 4H30C31.1046 4 32 4.89543 32 6V10" stroke="#00c2cb" strokeWidth="1.5" /><line x1="16" y1="20" x2="32" y2="20" stroke="#00c2cb" strokeWidth="1" opacity="0.6" /><line x1="16" y1="26" x2="28" y2="26" stroke="#00c2cb" strokeWidth="1" opacity="0.6" /></svg>
                            </div>
                            <p className="upload-title">Select Directory for Batch Analysis</p>
                            <button className="upload-btn mt-2">Open Folder</button>
                            <input ref={folderRef} type="file" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []); if (f.length) runBatchPipeline(f); e.target.value = ''; }} />
                        </div>

                        {batchStatus !== 'idle' && (
                            <div className="mt-8">
                                {batchStatus === 'processing' && (() => {
                                    const pct = batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, background: '#080c14', border: '1px solid #1e2535', borderRadius: 14, padding: '20px 28px', marginBottom: 16 }}>
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <svg width="72" height="72" viewBox="0 0 72 72">
                                                    <circle cx="36" cy="36" r="30" fill="none" stroke="#1e2535" strokeWidth="5" />
                                                    <circle cx="36" cy="36" r="30" fill="none" stroke="#00c2cb" strokeWidth="5" strokeDasharray={`${(pct / 100) * 188.5} 188.5`} strokeDashoffset="47" strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
                                                </svg>
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#e8ecf4', lineHeight: 1 }}>{pct}%</span>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8ecf4', marginBottom: 4 }}>Processing {batchProgress.current} of {batchProgress.total} files</div>
                                                <div style={{ fontSize: 11, color: '#4a5568', fontFamily: 'monospace', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340 }}>{batchProgress.fileName}</div>
                                                <div style={{ display: 'flex', gap: 16 }}>
                                                    {[
                                                        { label: 'Valid', count: Math.max(0, batchRows.filter(r => r.status === 'valid').length), color: '#00c853' },
                                                        { label: 'Invalid', count: Math.max(0, batchRows.filter(r => r.status === 'invalid').length), color: '#ff1744' },
                                                        { label: 'Partial', count: Math.max(0, batchRows.filter(r => r.status === 'partial').length), color: '#ffab00' },
                                                    ].map(s => (
                                                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                                            <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.count}</span>
                                                            <span style={{ fontSize: 10, color: '#4a5568' }}>{s.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={() => { cancelRef.current = true; }} style={{ background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.3)', color: '#ff5252', borderRadius: 8, padding: '8px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
                                                Cancel
                                            </button>
                                        </div>
                                    );
                                })()}
                                <div className="flex justify-between items-end mb-4">
                                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">Batch Results</h2>
                                    {batchStatus === 'complete' && (
                                        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden' }}>
                                            <button onClick={exportCSV} style={{ background: 'rgba(0,194,203,0.1)', border: '1px solid rgba(0,194,203,0.3)', borderRight: 'none', color: '#00c2cb', padding: '8px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,194,203,0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,194,203,0.1)'}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                EXPORT CSV
                                            </button>
                                            <button onClick={() => exportJSON(batchRows)} style={{ background: 'rgba(0,194,203,0.06)', border: '1px solid rgba(0,194,203,0.3)', color: '#00c2cb', padding: '8px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,194,203,0.14)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,194,203,0.06)'}>
                                                JSON
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {batchStatus === 'complete' && (
                                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                                        <SummaryDonut valid={validCount} partial={partialCount} invalid={invalidCount} skipped={notVehicleCount} total={batchRows.length} />
                                        <div className="summary-grid" style={{ flex: 1, marginBottom: 0 }}>
                                            <div className="summary-card valid"><div className="summary-icon">✓</div><div className="summary-count">{validCount}</div><div className="summary-label">Valid</div></div>
                                            <div className="summary-card partial"><div className="summary-icon">⚠</div><div className="summary-count">{partialCount}</div><div className="summary-label">Partial</div></div>
                                            <div className="summary-card invalid"><div className="summary-icon">✗</div><div className="summary-count">{invalidCount}</div><div className="summary-label">Invalid / Fake</div></div>
                                            <div className="summary-card skipped"><div className="summary-icon">→</div><div className="summary-count">{notVehicleCount}</div><div className="summary-label">Not Vehicle</div></div>
                                            <div className="summary-card error"><div className="summary-icon">!</div><div className="summary-count">{errorCount}</div><div className="summary-label">Error</div></div>
                                        </div>
                                    </div>
                                )}

                                {batchRows.length > 0 && (
                                    <div className="vehicle-scroll" style={{ maxHeight: 500, overflowY: 'auto' }}>
                                        <table className="batch-table">
                                            <thead>
                                                <tr>
                                                    <SortTh col="file" label="FILE NAME" sortCol={sortCol} sortDir={sortDir} toggleSort={toggleSort} />
                                                    <SortTh col="chassis" label="CHASSIS" sortCol={sortCol} sortDir={sortDir} toggleSort={toggleSort} />
                                                    <th style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a5568', padding: '14px 16px', textAlign: 'left' }}>MANUFACTURER</th>
                                                    <SortTh col="registration" label="REGISTRATION" sortCol={sortCol} sortDir={sortDir} toggleSort={toggleSort} />
                                                    <SortTh col="state" label="STATE" sortCol={sortCol} sortDir={sortDir} toggleSort={toggleSort} />
                                                    <th style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#4a5568', padding: '14px 16px', textAlign: 'left' }}>CONFIDENCE</th>
                                                    <SortTh col="status" label="STATUS" sortCol={sortCol} sortDir={sortDir} toggleSort={toggleSort} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedRows.map((row) => {
                                                    const cbConf = Math.max(row.chassisConfidence || 0, row.regConfidence || 0);
                                                    return (
                                                        <React.Fragment key={row.index}>
                                                            <tr className={expandedRows.has(row.index) ? 'expanded' : ''}>
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                                        <button onClick={() => toggleRowExpand(row.index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', marginTop: 1, transition: 'transform 0.2s, color 0.2s', transform: expandedRows.has(row.index) ? 'rotate(180deg)' : 'rotate(0deg)', color: expandedRows.has(row.index) ? '#00c2cb' : '#4a5568', flexShrink: 0 }}>
                                                                            <ChevronDown size={14} />
                                                                        </button>
                                                                        <div>
                                                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#e8ecf4', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="truncate w-42" title={row.fileName}>{row.fileName}</div>
                                                                            <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>
                                                                                {(row.fileSize / 1024).toFixed(1)} KB
                                                                            </div>
                                                                            {row.chassisRejectionReason && (
                                                                                <div style={{ fontSize: 10, color: '#ff5252', marginTop: 3, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                    ⚠ {row.chassisRejectionReason}
                                                                                </div>
                                                                            )}
                                                                            {!row.chassisRejectionReason && row.statusMessage && row.status === 'skipped' && (
                                                                                <div style={{ fontSize: 10, color: '#4a5568', marginTop: 3, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                    ℹ {row.statusMessage}
                                                                                </div>
                                                                            )}
                                                                            {row.qrResult?.found && row.qrResult?.isValid && (
                                                                                <div style={{ fontSize: 10, color: '#00c2cb', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                                                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                                                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                                                                    </svg>
                                                                                    QR Valid — {row.qrResult.summary?.substring(0, 35)}{(row.qrResult.summary?.length ?? 0) > 35 ? '...' : ''}
                                                                                </div>
                                                                            )}
                                                                            {row.qrResult?.found && !row.qrResult?.isValid && (
                                                                                <div style={{ fontSize: 10, color: '#ff5252', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                                    ⚠ QR Not Working (May be Invalid)
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className={`chassis-value ${row.chassisIsValid === false ? 'invalid' : ''}`}>{row.chassis || '—'}</div>
                                                                    {row.chassisIsValid === false && row.chassisRejectionReason && <span className="rejection-note" title={row.chassisRejectionReason}>⚠ {row.chassisRejectionReason}</span>}
                                                                </td>
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    {row.chassisManufacturer ? (
                                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#00c2cb', background: 'rgba(0,194,203,0.08)', border: '1px solid rgba(0,194,203,0.2)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                                                                            {row.chassisManufacturer}
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#2d3748' }}>—</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="chassis-value">{row.registration || '—'}</div>
                                                                </td>
                                                                <td>
                                                                    {row.regState ? (
                                                                        <span style={{ color: '#00c2cb', fontSize: 11, fontWeight: 600 }}>
                                                                            {row.regState.split('—')[1]?.trim() || row.regState}
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#2d3748' }}>—</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="confidence-bar-wrap">
                                                                        <div className="font-mono text-[10px]" style={{ color: cbConf >= 80 ? '#00c853' : cbConf >= 60 ? '#ffab00' : '#ff1744' }}>{cbConf}%</div>
                                                                        <div className="confidence-bar">
                                                                            <div className={`confidence-fill ${cbConf >= 80 ? 'high' : cbConf >= 60 ? 'mid' : 'low'}`} style={{ width: `${cbConf}%` }} />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {row.status === 'processing' ? <span className="text-[10px] text-[#00c2cb] animate-pulse">Processing...</span> :
                                                                        row.status === 'pending' ? <span className="text-[10px] text-[#4a5568]">Pending</span> :
                                                                            <span className={`status-badge ${row.status}`}>{row.status === 'skipped' ? 'NOT VEHICLE' : row.status}</span>}
                                                                </td>
                                                            </tr>
                                                            {expandedRows.has(row.index) && (
                                                                <tr>
                                                                    <td colSpan={7} style={{ padding: 0, background: '#070a10' }}>
                                                                        <div style={{ padding: '20px 24px', borderTop: '1px solid #1e2535', borderBottom: '1px solid #1e2535', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                                            <div style={{ background: '#0d1020', border: '1px solid #1e2535', borderRadius: 10, padding: '16px 20px' }}>
                                                                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#00c2cb', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,194,203,0.15)', paddingBottom: 8, marginBottom: 12 }}>
                                                                                    Chassis / VIN
                                                                                </div>
                                                                                {row.chassis ? (
                                                                                    <React.Fragment>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                                                                                            <span style={{ fontFamily: 'Courier New, monospace', fontSize: 16, fontWeight: 700, color: row.status === 'invalid' ? '#ff5252' : '#00e676', letterSpacing: 1, textDecoration: row.status === 'invalid' ? 'line-through' : 'none' }}>
                                                                                                {row.chassis}
                                                                                            </span>
                                                                                            <CopyButton value={row.chassis || ''} />
                                                                                        </div>
                                                                                        {row.status !== 'invalid' && (
                                                                                            <React.Fragment>
                                                                                                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}>
                                                                                                    <span style={{ color: '#00c853', marginRight: 6 }}>✓</span>
                                                                                                    Length: {row.chassis.replace(/\s/g, '').length} chars
                                                                                                    {row.chassis.replace(/\s/g, '').length === 17 ? <span style={{ color: '#00c853', marginLeft: 6 }}>(Standard VIN ✓)</span> : <span style={{ color: '#ffab00', marginLeft: 6 }}>(Short chassis)</span>}
                                                                                                </div>
                                                                                                {row.chassisManufacturer && (
                                                                                                    <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}><span style={{ color: '#00c2cb', marginRight: 6 }}>◆</span>Manufacturer:<span style={{ color: '#00c2cb', marginLeft: 6, fontWeight: 600 }}>{row.chassisManufacturer}</span></div>
                                                                                                )}
                                                                                                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}><span style={{ color: '#00c853', marginRight: 6 }}>✓</span>Source: {row.chassisSource}</div>
                                                                                                <div style={{ fontSize: 11, color: '#4a5568' }}><span style={{ marginRight: 6 }}>◉</span>Confidence:<span style={{ marginLeft: 6, fontWeight: 700, color: row.chassisConfidence >= 80 ? '#00c853' : row.chassisConfidence >= 60 ? '#ffab00' : '#ff5252' }}>{row.chassisConfidence}%</span></div>
                                                                                            </React.Fragment>
                                                                                        )}
                                                                                        {row.status === 'invalid' && (
                                                                                            <div style={{ background: '#1a0000', border: '1px solid rgba(255,23,68,0.3)', borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
                                                                                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: '#ff1744', textTransform: 'uppercase', marginBottom: 6 }}>⚠ Invalid Chassis — Reason</div>
                                                                                                <div style={{ fontSize: 11, color: '#ff5252', lineHeight: 1.6 }}>{row.chassisRejectionReason || 'Chassis format does not match Indian vehicle standards.'}</div>
                                                                                                <div style={{ fontSize: 10, color: '#4a5568', marginTop: 8, borderTop: '1px solid rgba(255,23,68,0.15)', paddingTop: 6 }}>Action: Verify chassis number with RTO or manufacturer records.</div>
                                                                                            </div>
                                                                                        )}
                                                                                    </React.Fragment>
                                                                                ) : (
                                                                                    <div>
                                                                                        <div style={{ fontSize: 12, color: '#ff5252', fontWeight: 700, marginBottom: 8 }}>NOT FOUND</div>
                                                                                        <div style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.6 }}>No chassis pattern matching Indian vehicle standards was detected in this document.</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div style={{ background: '#0d1020', border: '1px solid #1e2535', borderRadius: 10, padding: '16px 20px' }}>
                                                                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#00c2cb', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,194,203,0.15)', paddingBottom: 8, marginBottom: 12 }}>Registration Number</div>
                                                                                {row.registration ? (
                                                                                    <React.Fragment>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                                                                                            <span style={{ fontFamily: 'Courier New, monospace', fontSize: 16, fontWeight: 700, color: '#00e676', letterSpacing: 2 }}>{row.registration}</span>
                                                                                            <CopyButton value={row.registration || ''} />
                                                                                        </div>
                                                                                        <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}><span style={{ color: '#00c853', marginRight: 6 }}>✓</span>State:<span style={{ color: '#00c2cb', marginLeft: 6, fontWeight: 600 }}>{row.regState || '-'}</span></div>
                                                                                        <div style={{ fontSize: 11, color: '#4a5568', marginTop: 6 }}><span style={{ marginRight: 6 }}>◉</span>Source: {row.regSource}</div>
                                                                                    </React.Fragment>
                                                                                ) : (
                                                                                    <div>
                                                                                        <div style={{ fontSize: 12, color: '#ff5252', fontWeight: 700, marginBottom: 8 }}>NOT FOUND</div>
                                                                                        <div style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.6 }}>{row.status === 'skipped' ? 'Not in the format of Indian Vehicle Registration or Chassis Number.' : 'No valid Indian state registration format detected in this document.'}</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* QR CODE SECTION — only show if QR was attempted */}
                                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                                <div style={{ background: '#0d1020', border: `1px solid ${row.qrResult?.found && row.qrResult?.isValid ? 'rgba(0,194,203,0.3)' : row.qrResult?.found && !row.qrResult?.isValid ? 'rgba(255,23,68,0.3)' : '#1e2535'}`, borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                                                    <div style={{ flexShrink: 0, marginTop: 2, color: row.qrResult?.found && row.qrResult?.isValid ? '#00c2cb' : '#4a5568' }}>
                                                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                                                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                                                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                                                                            <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
                                                                                            <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
                                                                                            <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
                                                                                            <path d="M14 14h2v2h-2zM18 14h3M18 18h3M14 18v3M14 21h3" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6, color: row.qrResult?.found && row.qrResult?.isValid ? '#00c2cb' : '#4a5568' }}>QR Code</div>
                                                                                        {row.qrResult?.found && row.qrResult?.isValid && (
                                                                                            <div>
                                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 700, color: '#00c853', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 20, padding: '2px 10px' }}>✓ QR VALID</span></div>
                                                                                                <div style={{ fontSize: 12, color: '#c8d0e0', lineHeight: 1.6 }}>{row.qrResult.summary}</div>
                                                                                                {row.qrResult.link && (
                                                                                                    <a href={row.qrResult.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: '#00c2cb', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(0,194,203,0.3)', paddingBottom: 1 }}>
                                                                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>Open Source Link
                                                                                                    </a>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {row.qrResult?.found && !row.qrResult?.isValid && (
                                                                                            <div style={{ fontSize: 12, color: '#ff5252', lineHeight: 1.6 }}>QR code detected but could not be decoded. May be damaged, low resolution, or intentionally fake.</div>
                                                                                        )}
                                                                                        {!row.qrResult?.found && (
                                                                                            <div style={{ fontSize: 12, color: '#4a5568' }}>No QR code detected in this document.</div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ gridColumn: '1 / -1', fontSize: 10, color: '#2d3748', fontFamily: 'monospace', borderTop: '1px solid #1e2535', paddingTop: 10 }}>
                                                                                Extraction: PaddleOCR engine v2 · Size: {(row.fileSize / 1024).toFixed(1)} KB · Status: {row.statusMessage}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="toast-container">
                    {toasts.map(t => (
                        <div key={t.id} className={`toast ${t.type}`}>
                            {t.type === 'success' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c853" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff1744" strokeWidth="3"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            {t.msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
