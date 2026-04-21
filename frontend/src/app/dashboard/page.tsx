"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    Shield,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    Fingerprint,
    TrendingUp,
    Zap,
    Globe,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsSession {
    id: number;
    date: string;
    total: number;
    valid: number;
    invalid: number;
    partial: number;
    skipped: number;
    manufacturers: Record<string, number>;
    states: Record<string, number>;
}

function safeDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function safePct(num: number, den: number): number {
    if (!den || den === 0 || isNaN(den)) return 0;
    const result = Math.round((num / den) * 100);
    return isNaN(result) ? 0 : result;
}

function safeNum(n: any): number {
    const v = Number(n);
    return isNaN(v) ? 0 : v;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY HEATMAP — GitHub contribution style
// ═══════════════════════════════════════════════════════════════
function ActivityHeatmap({ sessions }: { sessions: AnalyticsSession[] }) {
    const CELL_SIZE = 13;
    const CELL_GAP  = 3;
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const [tooltip, setTooltip] = useState<{
        day: typeof days[0]; x: number; y: number;
    } | null>(null);

    // ── Build 112-day grid ending today ────────────────────────────
    const today = new Date();
    const days: {
        date: Date; dateStr: string;
        total: number; valid: number; invalid: number; partial: number;
        level: number;
    }[] = [];

    for (let i = 111; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({ date: d, dateStr, total: 0, valid: 0, invalid: 0, partial: 0, level: 0 });
    }

    // Populate from sessions
    sessions.forEach(s => {
        const sd = safeDate(s.date);
        if (!sd) return;
        const sessionDate = sd.toISOString().split('T')[0];
        const day = days.find(d => d.dateStr === sessionDate);
        if (day) {
            day.total   += safeNum(s.total);
            day.valid   += safeNum(s.valid);
            day.invalid += safeNum(s.invalid);
            day.partial += safeNum(s.partial);
        }
    });

    const maxTotal = Math.max(...days.map(d => d.total), 1);
    days.forEach(d => {
        if (d.total === 0)                          d.level = 0;
        else if (d.total <= maxTotal * 0.25)        d.level = 1;
        else if (d.total <= maxTotal * 0.50)        d.level = 2;
        else if (d.total <= maxTotal * 0.75)        d.level = 3;
        else                                         d.level = 4;
    });

    // ── Group into week columns ─────────────────────────────────────
    const weeks: (typeof days[0] | null)[][] = [];
    let currentWeek: (typeof days[0] | null)[] = [];
    const firstDayOfWeek = days[0].date.getDay();
    for (let p = 0; p < firstDayOfWeek; p++) currentWeek.push(null);
    days.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) { weeks.push([...currentWeek]); currentWeek = []; }
    });
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    // ── Month labels ────────────────────────────────────────────────
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
        const firstReal = week.find(d => d !== null);
        if (firstReal) {
            const m = firstReal.date.getMonth();
            if (m !== lastMonth) {
                monthLabels.push({ label: firstReal.date.toLocaleDateString('en-IN', { month: 'short' }), weekIndex: wi });
                lastMonth = m;
            }
        }
    });

    // ── Cell color logic ────────────────────────────────────────────
    function getCellColor(day: typeof days[0] | null): string {
        if (!day || day.total === 0) return '#0d1020';
        const validRatio   = day.valid   / day.total;
        const invalidRatio = day.invalid / day.total;
        if (invalidRatio > 0.5) {
            return ['#1a0808','#3d1010','#661515','#991f1f','#cc2828'][day.level];
        } else if (validRatio > 0.5) {
            return ['#0d1020','#0a2510','#0f4020','#146b30','#00c853'][day.level];
        } else {
            return ['#0d1020','#1a1200','#2d1f00','#4d3500','#ffab00'][day.level];
        }
    }

    function getCellGlow(day: typeof days[0] | null): string {
        if (!day || day.total === 0 || day.level < 3) return 'none';
        const invalidRatio = day.invalid / day.total;
        const validRatio   = day.valid   / day.total;
        if (invalidRatio > 0.5) return '0 0 8px rgba(255,23,68,0.6)';
        if (validRatio   > 0.5) return '0 0 8px rgba(0,200,83,0.6)';
        return '0 0 8px rgba(255,171,0,0.5)';
    }

    // ── Footer stats ────────────────────────────────────────────────
    const activeDays = days.filter(d => d.total > 0).length;
    const peakDay    = Math.max(...days.map(d => d.total), 0);
    const total16wk  = days.reduce((a, d) => a + d.total, 0);
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].total > 0) streak++; else break;
    }

    return (
        <div className="bg-[#0a0d14] border border-[#1e2535] rounded-3xl p-7 relative overflow-hidden">
            {/* Top shimmer border */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,194,203,0.6) 40%, rgba(0,136,255,0.6) 60%, transparent)' }} />

            {/* Card Header */}
            <div className="flex items-start justify-between mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00c2cb" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span className="text-[9px] font-black text-[#00c2cb] uppercase tracking-[0.25em]">Activity Intelligence</span>
                    </div>
                    <h3 className="text-xl font-black text-[#e8ecf4]">Document Processing Heatmap</h3>
                    <p className="text-[11px] text-[#4a5568] mt-1">16-week forensic activity across all batch sessions</p>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2.5 items-end">
                    <div className="flex items-center gap-1.5 text-[9px] text-[#4a5568]">
                        <span>Less</span>
                        {[0,1,2,3,4].map(l => (
                            <div key={l} style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)',
                                backgroundColor: l === 0 ? '#0d1020' : l === 1 ? '#0a2510' : l === 2 ? '#0f4020' : l === 3 ? '#146b30' : '#00c853'
                            }} />
                        ))}
                        <span>More</span>
                    </div>
                    <div className="flex gap-3.5">
                        {[{ color:'#00c853', label:'Mostly Valid' }, { color:'#ff1744', label:'Mostly Invalid' }, { color:'#ffab00', label:'Mixed' }].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: l.color, boxShadow: `0 0 4px ${l.color}80` }} />
                                <span className="text-[9px] text-[#4a5568] font-semibold">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="relative overflow-x-auto">
                {/* Month labels */}
                <div className="flex gap-[3px] mb-1.5" style={{ marginLeft: 32 }}>
                    {weeks.map((_, wi) => {
                        const ml = monthLabels.find(m => m.weekIndex === wi);
                        return (
                            <div key={wi} style={{ width: CELL_SIZE, fontSize: 8, fontWeight: 600, color: ml ? '#4a5568' : 'transparent', whiteSpace: 'nowrap' }}>
                                {ml?.label || '·'}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-1">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-[3px] mr-1" style={{ width: 24 }}>
                        {DAY_LABELS.map((d, i) => (
                            <div key={d} style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`, fontSize: 8, fontWeight: 600, color: '#2d3748', textAlign: 'right', opacity: [1,3,5].includes(i) ? 1 : 0 }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Week columns */}
                    <div className="flex gap-[3px]">
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-[3px]">
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        style={{
                                            width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3,
                                            backgroundColor: getCellColor(day),
                                            border: day && day.total > 0 ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)',
                                            boxShadow: getCellGlow(day),
                                            cursor: day && day.total > 0 ? 'pointer' : 'default',
                                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                        }}
                                        onMouseEnter={e => {
                                            if (!day || day.total === 0) return;
                                            const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                                            setTooltip({ day, x: rect.left, y: rect.top });
                                            (e.target as HTMLDivElement).style.transform = 'scale(1.4)';
                                            (e.target as HTMLDivElement).style.zIndex = '10';
                                        }}
                                        onMouseLeave={e => {
                                            setTooltip(null);
                                            (e.target as HTMLDivElement).style.transform = 'scale(1)';
                                            (e.target as HTMLDivElement).style.zIndex = '1';
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer stats */}
            <div className="flex items-center gap-6 mt-6 pt-5 border-t border-[#1e2535]">
                {[
                    { val: activeDays, label: 'Active Days',   color: '#00c2cb' },
                    { val: peakDay,    label: 'Peak Day',      color: '#00c853' },
                    { val: streak,     label: 'Day Streak',    color: '#ffab00' },
                    { val: total16wk,  label: 'Total 16-Week', color: '#e8ecf4' },
                ].map((stat, i, arr) => (
                    <React.Fragment key={stat.label}>
                        <div>
                            <p className="text-[18px] font-black" style={{ color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.val}</p>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#2d3748] mt-0.5">{stat.label}</p>
                        </div>
                        {i < arr.length - 1 && <div className="w-px h-8 bg-[#1e2535]" />}
                    </React.Fragment>
                ))}
                {activeDays === 0 && (
                    <p className="ml-auto text-[10px] text-[#2d3748] italic">Run batch analyses to populate the heatmap</p>
                )}
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div style={{
                    position: 'fixed', left: tooltip.x + 20, top: tooltip.y - 10,
                    zIndex: 9999, background: '#10131c', border: '1px solid #2d3748',
                    borderRadius: 10, padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8)', pointerEvents: 'none', minWidth: 180
                }}>
                    <p className="text-[10px] font-bold text-[#e8ecf4] mb-2 tracking-wide">
                        {tooltip.day.date.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-[10px] text-[#4a5568]">Total Processed</span>
                            <span className="text-[12px] font-black text-[#e8ecf4] font-mono">{tooltip.day.total}</span>
                        </div>
                        {[{ label: 'Valid', val: tooltip.day.valid, color: '#00c853' }, { label: 'Invalid', val: tooltip.day.invalid, color: '#ff1744' }, { label: 'Partial', val: tooltip.day.partial, color: '#ffab00' }].map(s => (
                            <div key={s.label} className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                                    <span className="text-[10px] text-[#4a5568]">{s.label}</span>
                                </div>
                                <span className="text-[11px] font-bold font-mono" style={{ color: s.color }}>{s.val}</span>
                            </div>
                        ))}
                        <div className="pt-2 mt-1 border-t border-[#1e2535]">
                            <div className="flex justify-between mb-1">
                                <span className="text-[9px] text-[#4a5568] font-semibold uppercase tracking-wide">Accuracy</span>
                                <span className="text-[10px] font-black" style={{ color: safePct(tooltip.day.valid, tooltip.day.total) >= 80 ? '#00c853' : safePct(tooltip.day.valid, tooltip.day.total) >= 50 ? '#ffab00' : '#ff1744' }}>
                                    {safePct(tooltip.day.valid, tooltip.day.total)}%
                                </span>
                            </div>
                            <div className="h-1 bg-[#1e2535] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${safePct(tooltip.day.valid, tooltip.day.total)}%`, backgroundColor: safePct(tooltip.day.valid, tooltip.day.total) >= 80 ? '#00c853' : safePct(tooltip.day.valid, tooltip.day.total) >= 50 ? '#ffab00' : '#ff1744' }} />
                            </div>
                        </div>
                    </div>
                    {/* Arrow */}
                    <div style={{ position: 'absolute', left: -5, top: 16, width: 8, height: 8, background: '#10131c', border: '1px solid #2d3748', borderRight: 'none', borderTop: 'none', transform: 'rotate(45deg)' }} />
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
    const [stats, setStats] = useState({ total: 0, integrity: 0, fraud: 0, accuracy: 0 });
    const [loading, setLoading] = useState(true);


    const loadData = () => {
        try {
            const raw = localStorage.getItem('verentis_analytics');
            if (raw) {
                const parsed: AnalyticsSession[] = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Sanitize each session
                    const clean = parsed.map(s => ({
                        ...s,
                        id:      safeNum(s.id),
                        total:   safeNum(s.total),
                        valid:   safeNum(s.valid),
                        invalid: safeNum(s.invalid),
                        partial: safeNum(s.partial),
                        skipped: safeNum(s.skipped),
                        manufacturers: s.manufacturers || {},
                        states:        s.states        || {},
                    }));

                    // Use all sessions (no period filter — heatmap handles its own 16-week window)
                    const working = clean;

                    setSessions(working);

                    const total   = working.reduce((a, s) => a + s.total,   0);
                    const valid   = working.reduce((a, s) => a + s.valid,   0);
                    const invalid = working.reduce((a, s) => a + s.invalid, 0);

                    setStats({
                        total,
                        integrity: safePct(valid,   total),
                        fraud:     invalid,
                        accuracy:  safePct(valid + invalid, total),
                    });
                } else {
                    setSessions([]);
                    setStats({ total: 0, integrity: 0, fraud: 0, accuracy: 0 });
                }
            } else {
                setSessions([]);
                setStats({ total: 0, integrity: 0, fraud: 0, accuracy: 0 });
            }
        } catch (e) {
            console.error("Dashboard data error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    // ── Aggregate manufacturer & state counts ───────────────────────────────
    const mfrTotals: Record<string, number> = {};
    const stateTotals: Record<string, number> = {};
    sessions.forEach(s => {
        Object.entries(s.manufacturers || {}).forEach(([k, v]) => {
            mfrTotals[k] = (mfrTotals[k] || 0) + safeNum(v);
        });
        Object.entries(s.states || {}).forEach(([k, v]) => {
            stateTotals[k] = (stateTotals[k] || 0) + safeNum(v);
        });
    });
    const topStates = Object.entries(stateTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxStateCount = topStates[0]?.[1] || 1;



    // ── Dynamic insight ─────────────────────────────────────────────────────
    const insightText = (() => {
        if (sessions.length === 0) return "No forensic sessions recorded yet. Run an analysis from the Document Analysis tab to populate this dashboard.";
        const total   = sessions.reduce((a, s) => a + s.total,   0);
        const fraud   = sessions.reduce((a, s) => a + s.invalid, 0);
        const partial = sessions.reduce((a, s) => a + s.partial, 0);
        const topMfr  = Object.entries(mfrTotals).sort((a, b) => b[1] - a[1])[0];
        const topState= topStates[0];
        const fraudPct = safePct(fraud, total);
        if (fraudPct > 30) return `High fraud rate detected: ${fraudPct}% of ${total} scans flagged as invalid. Immediate manual review recommended.`;
        if (topMfr && topState) return `Top manufacturer: ${topMfr[0]} (${topMfr[1]} docs). Highest volume state: ${topState[0]} (${topState[1]} scans). ${partial} documents show partial extraction — consider rescanning.`;
        if (topMfr) return `${topMfr[0]} leads with ${topMfr[1]} vehicles scanned. System integrity at ${safePct(sessions.reduce((a,s)=>a+s.valid,0), total)}%.`;
        return `${total} total documents processed across ${sessions.length} forensic sessions. Platform operating within normal parameters.`;
    })();

    return (
        <div className="min-h-full bg-[#050810] text-[#e8ecf4] p-8 font-sans">
            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#00c2cb] opacity-[0.05] rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0088ff] opacity-[0.03] rounded-full blur-[120px]" />
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1e2535]">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Forensic Intelligence</h1>
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#00c2cb10] border border-[#00c2cb30] rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c2cb] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c2cb]" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00c2cb]">Real-time Nexus</span>
                            </div>
                        </div>
                        <p className="text-sm text-[#4a5568] font-medium mt-1">
                            Synchronized forensic monitoring across <span className="text-[#00c2cb] font-bold">Identity</span>, <span className="text-[#00c2cb] font-bold">Finance</span>, and <span className="text-[#00c2cb] font-bold">Automotive</span> intelligence sectors.
                        </p>
                    </div>
                    <div className="p-4 bg-[#10131c] border border-[#1e2535] rounded-2xl flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-[#4a5568] uppercase tracking-widest">Active Agency</p>
                            <p className="text-xs font-bold text-[#e8ecf4]">Verentis Core Engine v4.0</p>
                        </div>
                        <div className="w-10 h-10 bg-[#00c2cb] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,194,203,0.3)]">
                            <Zap className="w-5 h-5 text-[#0a0d14]" />
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Investigations" value={sessions.length === 0 ? '—' : stats.total.toLocaleString()} sub="Cumulative scans" icon={<FileText className="w-6 h-6" />} color="#00c2cb" />
                    <KPICard title="Forensic Integrity"   value={sessions.length === 0 ? '—' : `${stats.integrity}%`} sub="Clean certificate rate" icon={<Shield className="w-6 h-6" />} color="#00c853" />
                    <KPICard title="Fraud Intercepted"    value={sessions.length === 0 ? '—' : stats.fraud.toLocaleString()} sub="Tampered documents" icon={<AlertTriangle className="w-6 h-6" />} color="#ff1744" />
                    <KPICard title="Neural Accuracy"      value={sessions.length === 0 ? '—' : `${stats.accuracy}%`} sub="Extraction success rate" icon={<Zap className="w-6 h-6" />} color="#0088ff" />
                </div>

                {/* Activity Heatmap — full width */}
                <ActivityHeatmap sessions={sessions} />

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left: Geographic + Insight */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Geographic + Insight */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Geographic Density */}
                            <div className="bg-[#10131c]/50 backdrop-blur-md border border-[#1e2535] rounded-3xl p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-[#0088ff]" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Geographic Density</h4>
                                </div>
                                {topStates.length === 0 ? (
                                    <div className="py-8 text-center opacity-20">
                                        <Globe className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No regional data yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {topStates.map(([state, count]) => (
                                            <div key={state} className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                    <span className="text-[#c8d0e0]">{state}</span>
                                                    <span className="text-[#0088ff]">{count} Scan{count !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(count / maxStateCount) * 100}%` }}
                                                        transition={{ duration: 0.8 }}
                                                        className="h-full bg-gradient-to-r from-[#0088ff] to-[#00c2cb] rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Intelligence Insight */}
                            <div className="bg-[#10131c]/50 backdrop-blur-md border border-[#1e2535] rounded-3xl p-6 space-y-5 relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                                    <Activity className="w-32 h-32 text-[#ffab00]" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-[#ffab00]" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Intelligence Insight</h4>
                                </div>
                                <div className="bg-[#050810] border border-[#ffab0020] rounded-2xl p-4 min-h-[80px] flex items-center">
                                    <p className="text-[11px] font-medium text-[#c8d0e0] leading-relaxed italic">
                                        {insightText}
                                    </p>
                                </div>
                                {sessions.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#ffab00] animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#ffab00]">
                                            {stats.fraud > 0 ? 'Manual review suggested' : 'System nominal'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Session Stream */}
                    <div className="xl:col-span-4">
                        <div className="bg-[#10131c]/50 backdrop-blur-md border border-[#1e2535] rounded-3xl overflow-hidden flex flex-col shadow-2xl h-full">
                            <div className="px-6 py-5 bg-[#0a0d14] border-b border-[#1e2535] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-[#00c2cb]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Stream</span>
                                </div>
                                <span className="text-[9px] font-bold text-[#4a5568] uppercase tracking-widest">
                                    {sessions.length} Session{sessions.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
                                {sessions.length === 0 ? (
                                    <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                                        <Clock className="w-12 h-12" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Waiting for sessions...</p>
                                        <p className="text-[9px] text-[#4a5568]">Run a batch or single analysis on the Vehicle tab</p>
                                    </div>
                                ) : (
                                    [...sessions].reverse().map((s, i) => {
                                        const pct = safePct(s.valid, s.total);
                                        const d   = safeDate(s.date);
                                        const timeLabel = d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
                                        const dateLabel = d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
                                        return (
                                            <div key={i} className="p-4 bg-[#0a0d14] border border-[#1e2535] rounded-2xl group hover:border-[#00c2cb20] transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-[#1e2535] flex items-center justify-center">
                                                            <Fingerprint className="w-4 h-4 text-[#4a5568] group-hover:text-[#00c2cb] transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[#e8ecf4] uppercase">BATCH #{i + 1}</p>
                                                            <p className="text-[8px] font-bold text-[#4a5568] uppercase">{dateLabel} · {timeLabel}</p>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                                                        s.invalid > 0
                                                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                                                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                    )}>
                                                        {s.invalid > 0 ? 'Threat Found' : 'Clean'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between text-[8px] font-black text-[#4a5568] uppercase">
                                                            <span>Accuracy</span>
                                                            <span>{pct}%</span>
                                                        </div>
                                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#00c853' : pct >= 40 ? '#ffab00' : '#ff1744' }} />
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[11px] font-black text-[#e8ecf4]">{s.total}</p>
                                                        <p className="text-[8px] font-bold text-[#4a5568] uppercase">Docs</p>
                                                    </div>
                                                </div>
                                                {/* Per-session breakdown */}
                                                <div className="flex gap-3 mt-2 pt-2 border-t border-white/5">
                                                    <span className="text-[8px] text-[#00c853] font-bold">✓ {s.valid} valid</span>
                                                    {s.invalid > 0 && <span className="text-[8px] text-[#ff1744] font-bold">✗ {s.invalid} invalid</span>}
                                                    {s.partial  > 0 && <span className="text-[8px] text-[#ffab00] font-bold">~ {s.partial} partial</span>}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-4 bg-[#0a0d14] border-t border-[#1e2535]">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-base font-black text-[#00c853]">{sessions.reduce((a,s)=>a+s.valid,0)}</p>
                                        <p className="text-[8px] text-[#4a5568] font-black uppercase">Valid</p>
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-[#ff1744]">{sessions.reduce((a,s)=>a+s.invalid,0)}</p>
                                        <p className="text-[8px] text-[#4a5568] font-black uppercase">Invalid</p>
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-[#ffab00]">{sessions.reduce((a,s)=>a+s.partial,0)}</p>
                                        <p className="text-[8px] text-[#4a5568] font-black uppercase">Partial</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, sub, icon, color }: { title: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#10131c]/50 backdrop-blur-md border border-[#1e2535] rounded-3xl p-6 relative overflow-hidden group hover:border-[#00c2cb40] transition-all"
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0a0d14] border border-[#1e2535] flex items-center justify-center group-hover:scale-110 transition-transform duration-500" style={{ color }}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
                        <p className="text-[10px] font-black text-[#4a5568] uppercase tracking-widest mt-1">{title}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-[#4a5568]" />
                    </div>
                    <span className="text-[9px] font-bold text-[#4a5568] uppercase text-right leading-none max-w-[60px]">{sub}</span>
                </div>
            </div>
            {/* Ambient glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-1000" style={{ backgroundColor: color }} />
        </motion.div>
    );
}
