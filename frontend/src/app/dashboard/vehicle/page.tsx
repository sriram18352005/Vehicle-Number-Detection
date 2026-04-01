"use client";

import { useState, useRef, useCallback, useReducer } from "react";
import {
    ShieldCheck, ShieldX, AlertTriangle, Upload, FileText,
    Cpu, Settings, ChevronDown, ChevronUp, Activity, Loader2,
    CheckCircle2, XCircle, AlertCircle, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────
type CheckpointStatus = "pending" | "processing" | "pass" | "fail" | "skip";

interface Checkpoint {
    id: string;
    label: string;
    status: CheckpointStatus;
}

interface PipelineResult {
    verdict: "valid" | "review" | "irrelevant" | null;
    chassisNumber: string | null;
    registrationNumber: string | null;
    confidence: "low" | "medium" | "high" | null;
    reason: string | null;
    ocrText: string;
    characterCount: number;
    detectedLabels: string[];
    patternCandidates: string[];
}

interface PipelineState {
    status: "idle" | "processing" | "complete" | "error";
    currentStep: number;
    checkpoints: Checkpoint[];
    result: PipelineResult;
    uploadedFile: { name: string; size: string } | null;
}

// ─── Initial State ───────────────────────────────────────────────────────────
const INITIAL_CHECKPOINTS: Checkpoint[] = [
    { id: "image_conversion", label: "IMAGE CONVERSION", status: "pending" },
    { id: "ocr_extraction", label: "OCR EXTRACTION", status: "pending" },
    { id: "text_reconstruction", label: "TEXT RECONSTRUCTION", status: "pending" },
    { id: "label_detection", label: "LABEL DETECTION", status: "pending" },
    { id: "chassis_detection", label: "CHASSIS DETECTION", status: "pending" },
    { id: "registration_detection", label: "REGISTRATION DETECTION", status: "pending" },
    { id: "format_validation", label: "FORMAT VALIDATION", status: "pending" },
];

const INITIAL_RESULT: PipelineResult = {
    verdict: null,
    chassisNumber: null,
    registrationNumber: null,
    confidence: null,
    reason: null,
    ocrText: "",
    characterCount: 0,
    detectedLabels: [],
    patternCandidates: [],
};

const INITIAL_STATE: PipelineState = {
    status: "idle",
    currentStep: 0,
    checkpoints: INITIAL_CHECKPOINTS,
    result: INITIAL_RESULT,
    uploadedFile: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
type Action =
    | { type: "START"; payload: { name: string; size: string } }
    | { type: "SET_CHECKPOINT"; id: string; status: CheckpointStatus }
    | { type: "UPDATE_RESULT"; payload: Partial<PipelineResult> }
    | { type: "COMPLETE" }
    | { type: "ERROR" }
    | { type: "RESET" };

function reducer(state: PipelineState, action: Action): PipelineState {
    switch (action.type) {
        case "START":
            return { ...INITIAL_STATE, status: "processing", uploadedFile: action.payload, checkpoints: INITIAL_CHECKPOINTS.map(c => ({ ...c })) };
        case "SET_CHECKPOINT":
            return {
                ...state,
                checkpoints: state.checkpoints.map(c =>
                    c.id === action.id ? { ...c, status: action.status } : c
                ),
            };
        case "UPDATE_RESULT":
            return { ...state, result: { ...state.result, ...action.payload } };
        case "COMPLETE":
            return { ...state, status: "complete" };
        case "ERROR":
            return { ...state, status: "error" };
        case "RESET":
            return { ...INITIAL_STATE };
        default:
            return state;
    }
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const VEHICLE_KEYWORDS = [
    "chassis", "chasis", "vin", "frame no", "registration", "reg no",
    "vehicle", "rc book", "rc certificate", "owner", "engine no", "make",
    "model", "permit", "fitness", "insurance", "form 20", "form 21",
    "challan", "hypothecation", "sale letter"
];

const CHASSIS_REGEXES = [
    /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
    /(chassis|chasis|frame\s*no|vin|ch\.?\s*no)[\s:]*([A-Z0-9]{6,20})/gi,
];

const REG_REGEXES = [
    /\b[A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,3}[\s-]?\d{1,4}\b/gi,
    /\b[A-Z]{2}-\d{2}-\d{4}\b/gi,
    /\b\d{2}BH\d{4}[A-Z]{1,2}\b/gi,
];

function extractChassisCandidates(text: string): string[] {
    const found = new Set<string>();
    CHASSIS_REGEXES.forEach(rx => {
        const clone = new RegExp(rx.source, rx.flags);
        let m;
        while ((m = clone.exec(text)) !== null) {
            const val = m[2] ?? m[0];
            if (val && val.length >= 6) found.add(val.trim().toUpperCase());
        }
    });
    return Array.from(found);
}

function extractRegCandidates(text: string): string[] {
    const found = new Set<string>();
    REG_REGEXES.forEach(rx => {
        const clone = new RegExp(rx.source, rx.flags);
        let m;
        while ((m = clone.exec(text)) !== null) {
            found.add(m[0].trim().toUpperCase());
        }
    });
    return Array.from(found);
}

// ─── CDN Loader: PDF.js ──────────────────────────────────────────────────────
async function loadPdfJs(): Promise<any> {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
            const lib = (window as any).pdfjsLib;
            if (lib) {
                lib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                resolve(lib);
            } else {
                reject(new Error("pdfjsLib not found on window after script load"));
            }
        };
        script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
        document.head.appendChild(script);
    });
}

// ─── CDN Loader: Tesseract.js ─────────────────────────────────────────────────
async function runTesseractOCR(source: HTMLCanvasElement | string): Promise<string> {
    // Load Tesseract from CDN (prevents bundler/Turbopack issues)
    if (!(window as any).Tesseract) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Tesseract.js from CDN"));
            document.head.appendChild(script);
        });
    }
    const worker = await (window as any).Tesseract.createWorker("eng");
    const { data: { text } } = await worker.recognize(source);
    await worker.terminate();
    return text;
}

async function callClaudeAPI(ocrText: string): Promise<any> {
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

    const systemPrompt = `You are an expert Indian vehicle document forensic analyst. You will receive OCR text that may be noisy or garbled from scanning. YOUR JOB: 1. Determine if this is ANY vehicle-related document (RC, invoice, insurance, challan, permit, form 20, form 21, sale letter, hypothecation, etc.) 2. Extract Chassis/VIN number — look near words: chassis, chasis, ch no, frame, vin, body no 3. Extract Registration number in Indian formats: New (TN09AB1234 or TN 09 AB 1234), Old (MH-12-1234), BH series (23BH1234AA) 4. Even if text is garbled, attempt extraction using context clues. RESPOND ONLY IN THIS EXACT JSON FORMAT with no markdown and no extra text: { "isVehicleDocument": true or false, "chassisNumber": "string or null", "registrationNumber": "string or null", "chassisValid": true or false, "registrationValid": true or false, "confidence": "low or medium or high", "reason": "brief explanation" }`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey || "",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: "Extracted OCR text:\n" + ocrText }],
        }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    const raw = data.content.map((i: any) => i.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VehiclePage() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const [isDragging, setIsDragging] = useState(false);
    const [debugOpen, setDebugOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setCheckpoint = useCallback((id: string, status: CheckpointStatus) => {
        dispatch({ type: "SET_CHECKPOINT", id, status });
    }, []);

    const runPipeline = useCallback(async (file: File) => {
        dispatch({
            type: "START",
            payload: {
                name: file.name,
                size: `${(file.size / 1024).toFixed(1)} KB`,
            },
        });

        let fullText = "";
        toast.loading("Analyzing vehicle document...", { id: "vehicle-analysis" });

        try {
            // ── STEP 1: Image Conversion ──────────────────────────────────────────
            setCheckpoint("image_conversion", "processing");
            await sleep(300);

            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

            if (isPdf) {
                try {
                    console.log("Loading PDF.js...");
                    const pdfjsLib = await loadPdfJs();

                    const arrayBuffer = await file.arrayBuffer();
                    console.log("Parsing PDF...");
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    console.log(`PDF Loaded: ${pdf.numPages} pages`);
                    setCheckpoint("image_conversion", "pass");

                    // ── STEP 2: OCR Extraction (per page) ────────────────────────
                    setCheckpoint("ocr_extraction", "processing");

                    let ocrPass = false;

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);

                        // Try native text first
                        const textContent = await page.getTextContent();
                        const nativeText = textContent.items.map((i: any) => i.str).join(" ");

                        if (nativeText.trim().length >= 50) {
                            fullText += nativeText + "\n";
                            ocrPass = true;
                        } else {
                            // Render to canvas and OCR
                            const scale = 2.5;
                            const viewport = page.getViewport({ scale });
                            const canvas = document.createElement("canvas");
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;
                            const ctx = canvas.getContext("2d");
                            if (!ctx) throw new Error("Could not get 2D context");
                            await page.render({ canvasContext: ctx, viewport }).promise;

                            const text = await runTesseractOCR(canvas);
                            fullText += text + "\n";
                            if (text.trim().length > 0) ocrPass = true;
                        }
                    }

                    setCheckpoint("ocr_extraction", ocrPass ? "pass" : "fail");
                    if (!ocrPass) {
                        dispatch({ type: "UPDATE_RESULT", payload: { verdict: "irrelevant", reason: "Low quality scan — try higher resolution" } });
                        dispatch({ type: "COMPLETE" });
                        return;
                    }
                } catch (e: any) {
                    setCheckpoint("image_conversion", "fail");
                    setCheckpoint("ocr_extraction", "fail");
                    console.error("Pipeline Error:", e);
                    dispatch({ type: "UPDATE_RESULT", payload: { verdict: "irrelevant", reason: `Pipeline Error: ${e.message || String(e)}` } });
                    dispatch({ type: "COMPLETE" });
                    return;
                }
            } else {
                // Image file
                setCheckpoint("image_conversion", "pass");
                setCheckpoint("ocr_extraction", "processing");
                try {
                    const imageUrl = URL.createObjectURL(file);
                    const text = await runTesseractOCR(imageUrl);
                    URL.revokeObjectURL(imageUrl);
                    fullText = text;
                    setCheckpoint("ocr_extraction", text.trim().length > 0 ? "pass" : "fail");
                    if (text.trim().length === 0) {
                        dispatch({ type: "UPDATE_RESULT", payload: { verdict: "irrelevant", reason: "Blank or low quality image" } });
                        dispatch({ type: "COMPLETE" });
                        return;
                    }
                } catch (e: any) {
                    setCheckpoint("image_conversion", "fail");
                    setCheckpoint("ocr_extraction", "fail");
                    console.error("Pipeline Error:", e);
                    dispatch({ type: "UPDATE_RESULT", payload: { verdict: "irrelevant", reason: `Pipeline Error: ${e.message || String(e)}` } });
                    dispatch({ type: "COMPLETE" });
                    return;
                }
            }

            // ── STEP 3: Text Reconstruction ───────────────────────────────────────
            setCheckpoint("text_reconstruction", "processing");
            await sleep(200);
            let cleaned = fullText
                .replace(/\s{3,}/g, "  ")
                .replace(/0([A-Z])/g, "O$1")
                .replace(/1([A-Z])/g, "I$1")
                .split("\n")
                .filter(l => l.trim().length > 0)
                .join("\n");
            const charCount = cleaned.length;
            dispatch({ type: "UPDATE_RESULT", payload: { ocrText: cleaned, characterCount: charCount } });
            setCheckpoint("text_reconstruction", "pass");
            await sleep(200);

            // ── STEP 4: Label Detection ───────────────────────────────────────────
            setCheckpoint("label_detection", "processing");
            await sleep(200);
            const lowerText = cleaned.toLowerCase();
            const foundLabels = VEHICLE_KEYWORDS.filter(kw => lowerText.includes(kw.toLowerCase()));
            dispatch({ type: "UPDATE_RESULT", payload: { detectedLabels: foundLabels } });
            if (foundLabels.length >= 2) setCheckpoint("label_detection", "pass");
            else if (foundLabels.length === 1) setCheckpoint("label_detection", "skip");
            else setCheckpoint("label_detection", "fail");
            await sleep(200);

            // ── STEP 5: Chassis Detection ─────────────────────────────────────────
            setCheckpoint("chassis_detection", "processing");
            await sleep(200);
            const chassisCandidates = extractChassisCandidates(cleaned.toUpperCase());
            setCheckpoint("chassis_detection", chassisCandidates.length > 0 ? "pass" : "fail");
            await sleep(200);

            // ── STEP 6: Registration Detection ───────────────────────────────────
            setCheckpoint("registration_detection", "processing");
            await sleep(200);
            const regCandidates = extractRegCandidates(cleaned.toUpperCase());
            setCheckpoint("registration_detection", regCandidates.length > 0 ? "pass" : "fail");
            const allCandidates = [
                ...chassisCandidates.map(c => `${c} → chassis`),
                ...regCandidates.map(r => `${r} → registration`),
            ];
            dispatch({ type: "UPDATE_RESULT", payload: { patternCandidates: allCandidates } });
            await sleep(200);

            // ── STEP 7: Claude AI Validation ──────────────────────────────────────
            let claudeResult: any = null;
            try {
                claudeResult = await callClaudeAPI(cleaned.substring(0, 4000));
            } catch (e) {
                // Fallback: use regex results only
                claudeResult = {
                    isVehicleDocument: foundLabels.length >= 1,
                    chassisNumber: chassisCandidates[0] ?? null,
                    registrationNumber: regCandidates[0] ?? null,
                    chassisValid: chassisCandidates.length > 0,
                    registrationValid: regCandidates.length > 0,
                    confidence: "low",
                    reason: "AI validation unavailable. Using regex fallback.",
                };
            }

            const chassisNum = claudeResult?.chassisNumber ?? chassisCandidates[0] ?? null;
            const regNum = claudeResult?.registrationNumber ?? regCandidates[0] ?? null;
            const isVehicle = claudeResult?.isVehicleDocument ?? false;

            dispatch({
                type: "UPDATE_RESULT",
                payload: {
                    chassisNumber: chassisNum,
                    registrationNumber: regNum,
                    confidence: claudeResult?.confidence ?? "low",
                    reason: claudeResult?.reason ?? null,
                },
            });

            // ── STEP 8: Format Validation ─────────────────────────────────────────
            setCheckpoint("format_validation", "processing");
            await sleep(200);
            const chassisOk = chassisNum && /^[A-HJ-NPR-Z0-9]{6,20}$/.test(chassisNum.replace(/\s/g, ""));
            const regOk = regNum && /^[A-Z0-9\s-]{4,15}$/.test(regNum);
            if (chassisOk && regOk) setCheckpoint("format_validation", "pass");
            else if (chassisOk || regOk) setCheckpoint("format_validation", "skip");
            else setCheckpoint("format_validation", "fail");

            // ── Final Verdict ─────────────────────────────────────────────────────
            let verdict: "valid" | "review" | "irrelevant";
            if (!isVehicle) verdict = "irrelevant";
            else if (!chassisNum && !regNum) verdict = "review";
            else verdict = "valid";

            dispatch({ type: "UPDATE_RESULT", payload: { verdict } });
            dispatch({ type: "COMPLETE" });
            toast.success("Analysis complete", { id: "vehicle-analysis" });

        } catch (e: any) {
            console.error("Pipeline Error:", e);
            dispatch({ type: "UPDATE_RESULT", payload: { verdict: "irrelevant", reason: String(e) } });
            dispatch({ type: "ERROR" });
            toast.error("Analysis failed", { id: "vehicle-analysis" });
        }
    }, [setCheckpoint]);

    const handleFile = (f: File) => {
        const validTypes = ["application/pdf", "image/png", "image/jpg", "image/jpeg", "image/tiff"];
        const validExt = [".pdf", ".png", ".jpg", ".jpeg", ".tiff"];
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        if (!validTypes.includes(f.type) && !validExt.includes(ext)) return;
        runPipeline(f);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };

    const checkpointIcon = (status: CheckpointStatus) => {
        if (status === "pass") return <CheckCircle2 className="w-5 h-5 text-[#00c853]" />;
        if (status === "fail") return <XCircle className="w-5 h-5 text-[#ff1744]" />;
        if (status === "skip") return <AlertCircle className="w-5 h-5 text-[#ffab00]" />;
        if (status === "processing") return <Loader2 className="w-5 h-5 text-[#00aaff] animate-spin" />;
        return <div className="w-5 h-5 rounded-full border-2 border-[#1e2535]" />;
    };

    const { result, checkpoints, status, uploadedFile } = state;

    return (
        <div style={{ background: "#0a0d14" }} className="min-h-screen p-6 lg:p-10 font-sans">
            <div className="max-w-[1100px] mx-auto space-y-6">

                {/* ── Document Entry Panel ─── */}
                <div
                    style={{ background: "#10131c", border: "1px solid #1e2535", borderRadius: 12 }}
                    className="p-6"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div style={{ width: 4, height: 22, background: "#00c2cb", borderRadius: 2 }} />
                        <span style={{ color: "#e8ecf4", letterSpacing: "0.15em" }} className="text-xs font-black uppercase">Document Entry</span>
                    </div>

                    {/* Drag-and-drop zone */}
                    <div
                        onDragEnter={() => setIsDragging(true)}
                        onDragLeave={() => setIsDragging(false)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${isDragging ? "#00c2cb" : "#1e2535"}`,
                            borderRadius: 10,
                            background: isDragging ? "rgba(0,194,203,0.05)" : "rgba(255,255,255,0.01)",
                            transition: "all 0.2s",
                            minHeight: 140,
                        }}
                        className="flex flex-col items-center justify-center cursor-pointer gap-3 mb-4"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.tiff"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                        {uploadedFile ? (
                            <>
                                <FileText className="w-8 h-8" style={{ color: "#00c2cb" }} />
                                <div className="text-center">
                                    <p style={{ color: "#e8ecf4" }} className="text-sm font-bold">{uploadedFile.name}</p>
                                    <p style={{ color: "#4a5568" }} className="text-xs mt-1">{uploadedFile.size}</p>
                                </div>
                                <span
                                    style={{ background: "rgba(0,194,203,0.1)", color: "#00c2cb", borderRadius: 6, fontSize: 10, letterSpacing: "0.1em" }}
                                    className="px-3 py-1 font-black uppercase"
                                >
                                    {status === "processing" ? "PROCESSING SINGLE" : "PROCESSED"}
                                </span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8" style={{ color: "#4a5568" }} />
                                <p style={{ color: "#e8ecf4" }} className="text-sm font-bold">Drag & drop document or click to browse</p>
                                <p style={{ color: "#4a5568" }} className="text-xs">PDF, PNG, JPG, JPEG, TIFF</p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00c2cb] animate-pulse" />
                            <span style={{ color: "#00c2cb", fontSize: 10, letterSpacing: "0.1em" }} className="font-black uppercase">ACTIVE: AUTO</span>
                        </div>
                        <button
                            onClick={() => dispatch({ type: "RESET" })}
                            style={{ color: "#4a5568", fontSize: 10, letterSpacing: "0.1em" }}
                            className="font-black uppercase hover:text-white transition-colors"
                        >
                            RESET
                        </button>
                    </div>
                </div>

                {/* ── Results ─── */}
                <AnimatePresence>
                    {(status === "complete" || status === "processing") && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Verdict Banner */}
                            {status === "complete" && result.verdict && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        background: result.verdict === "valid" ? "#0f2d1a" : result.verdict === "review" ? "#2d1f00" : "#2d0a0a",
                                        border: `1px solid ${result.verdict === "valid" ? "#00c853" : result.verdict === "review" ? "#ffab00" : "#ff1744"}`,
                                        borderRadius: 12,
                                        color: result.verdict === "valid" ? "#00c853" : result.verdict === "review" ? "#ffab00" : "#ff1744",
                                    }}
                                    className="p-6 flex items-center gap-5"
                                >
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 12,
                                        background: "rgba(255,255,255,0.05)",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        {result.verdict === "valid" ? <ShieldCheck className="w-7 h-7" /> :
                                            result.verdict === "review" ? <AlertTriangle className="w-7 h-7" /> :
                                                <ShieldX className="w-7 h-7" />}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-black uppercase tracking-wider">
                                            {result.verdict === "valid" ? "VALID DOCUMENT" :
                                                result.verdict === "review" ? "NEEDS REVIEW" :
                                                    "IRRELEVANT DOCUMENT"}
                                        </h2>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">
                                            {result.reason || (result.verdict === "review"
                                                ? "PARTIAL DATA DETECTED — MANUAL CHECK REQUIRED"
                                                : "VEHICLE FORENSICS PIPELINE RESULT")}
                                        </p>
                                    </div>
                                    {result.confidence && (
                                        <div className="ml-auto text-right">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-60">Confidence</p>
                                            <p className="text-lg font-black uppercase">{result.confidence}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Extracted Data Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        label: "CHASSIS / VIN",
                                        value: result.chassisNumber,
                                        icon: <Cpu className="w-5 h-5" style={{ color: "#00c2cb" }} />,
                                    },
                                    {
                                        label: "REGISTRATION NO",
                                        value: result.registrationNumber,
                                        icon: <Hash className="w-5 h-5" style={{ color: "#00c2cb" }} />,
                                    },
                                ].map(card => (
                                    <div
                                        key={card.label}
                                        style={{ background: "#10131c", border: "1px solid #1e2535", borderRadius: 12 }}
                                        className="p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div style={{ width: 36, height: 36, background: "rgba(0,194,203,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {card.icon}
                                            </div>
                                            <span style={{ color: "#4a5568", fontSize: 10, letterSpacing: "0.15em" }} className="font-black uppercase">{card.label}</span>
                                        </div>
                                        <p
                                            style={{
                                                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                                                fontSize: card.value ? 20 : 18,
                                                color: card.value ? "#e8ecf4" : "#4a5568",
                                                letterSpacing: "0.05em",
                                            }}
                                            className="font-bold break-all"
                                        >
                                            {card.value || "— — —"}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Pipeline Checkpoints */}
                            <div style={{ background: "#10131c", border: "1px solid #1e2535", borderRadius: 12 }} className="p-6">
                                <p style={{ color: "#4a5568", fontSize: 10, letterSpacing: "0.15em" }} className="font-black uppercase mb-4">Pipeline Checkpoints</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {checkpoints.map((cp, i) => (
                                        <motion.div
                                            key={cp.id}
                                            initial={{ opacity: 0.3 }}
                                            animate={{ opacity: cp.status !== "pending" ? 1 : 0.4 }}
                                            transition={{ delay: i * 0.08 }}
                                            style={{
                                                background: cp.status === "pass" ? "rgba(0,200,83,0.07)" :
                                                    cp.status === "fail" ? "rgba(255,23,68,0.07)" :
                                                        cp.status === "skip" ? "rgba(255,171,0,0.07)" :
                                                            "rgba(255,255,255,0.02)",
                                                border: `1px solid ${cp.status === "pass" ? "rgba(0,200,83,0.2)" :
                                                    cp.status === "fail" ? "rgba(255,23,68,0.2)" :
                                                        cp.status === "skip" ? "rgba(255,171,0,0.2)" :
                                                            "#1e2535"}`,
                                                borderRadius: 10,
                                                padding: "14px 16px",
                                            }}
                                            className="flex items-center gap-3"
                                        >
                                            {checkpointIcon(cp.status)}
                                            <span style={{ color: cp.status === "pending" ? "#4a5568" : "#e8ecf4", fontSize: 10, letterSpacing: "0.08em", lineHeight: 1.4 }} className="font-black uppercase">
                                                {cp.label}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* System Debugger */}
                            <div style={{ background: "#10131c", border: "1px solid #1e2535", borderRadius: 12 }}>
                                <button
                                    onClick={() => setDebugOpen(p => !p)}
                                    className="w-full flex items-center justify-between p-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-4 h-4" style={{ color: "#4a5568" }} />
                                        <span style={{ color: "#e8ecf4", fontSize: 11, letterSpacing: "0.1em" }} className="font-black uppercase">System Debugger</span>
                                        <span style={{ color: "#4a5568", fontSize: 10, letterSpacing: "0.08em" }} className="font-bold">Source: OCR (High-Res Scanned)</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {result.characterCount > 0 && (
                                            <span style={{ color: "#00c2cb", fontSize: 10, letterSpacing: "0.1em" }} className="font-black uppercase">
                                                {result.characterCount.toLocaleString()} CHARACTERS
                                            </span>
                                        )}
                                        {debugOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {debugOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div className="px-5 pb-5 space-y-5" style={{ borderTop: "1px solid #1e2535" }}>
                                                <DebugSection title="RECONSTRUCTED OCR LINES">
                                                    {result.ocrText ? (
                                                        <div
                                                            style={{
                                                                background: "#080b12",
                                                                border: "1px solid #1e2535",
                                                                borderRadius: 8,
                                                                maxHeight: 200,
                                                                overflowY: "auto",
                                                                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                                                                fontSize: 11,
                                                                color: "#e8ecf4",
                                                                padding: "12px 16px",
                                                                lineHeight: 1.7,
                                                                whiteSpace: "pre-wrap",
                                                            }}
                                                        >
                                                            {result.ocrText}
                                                        </div>
                                                    ) : <NoneText />}
                                                </DebugSection>
                                                <DebugSection title="DETECTED LABELS">
                                                    {result.detectedLabels.length > 0 ? (
                                                        <p style={{ color: "#00c2cb", fontFamily: "monospace", fontSize: 12 }}>
                                                            {result.detectedLabels.join(", ")}
                                                        </p>
                                                    ) : <NoneText />}
                                                </DebugSection>
                                                <DebugSection title="PATTERN CANDIDATES">
                                                    {result.patternCandidates.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {result.patternCandidates.map((c, i) => (
                                                                <p key={i} style={{ color: "#e8ecf4", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                                                                    <span style={{ color: "#00c853" }}>✓</span> {c}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    ) : <NoneText />}
                                                </DebugSection>
                                                {result.reason && (
                                                    <DebugSection title="AI REASON">
                                                        <p style={{ color: "#4a5568", fontSize: 12, fontStyle: "italic" }}>{result.reason}</p>
                                                    </DebugSection>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Idle state info */}
                {status === "idle" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {[
                            { title: "8-Step Pipeline", desc: "Sequential forensic analysis: image conversion, OCR, reconstruction, labeling, pattern detection, and AI validation." },
                            { title: "Claude AI Validation", desc: "Claude Sonnet semantically validates extracted values against Indian RTO standards for maximum precision." },
                            { title: "Multi-Format Support", desc: "Handles PDFs, scanned images (PNG, JPEG, TIFF) with high-res 2.5× canvas rendering for noisy documents." },
                        ].map(info => (
                            <div key={info.title} style={{ background: "#10131c", border: "1px solid #1e2535", borderRadius: 12 }} className="p-5">
                                <h5 style={{ color: "#00c2cb", fontSize: 10, letterSpacing: "0.15em" }} className="font-black uppercase mb-2">{info.title}</h5>
                                <p style={{ color: "#4a5568", fontSize: 12, lineHeight: 1.6 }}>{info.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Small helper components ──────────────────────────────────────────────────
function DebugSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="pt-4">
            <p style={{ color: "#4a5568", fontSize: 9, letterSpacing: "0.15em" }} className="font-black uppercase mb-2">{title}</p>
            {children}
        </div>
    );
}

function NoneText() {
    return <p style={{ color: "#1e2535", fontSize: 12, fontStyle: "italic" }}>None</p>;
}
