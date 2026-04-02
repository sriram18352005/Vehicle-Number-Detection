"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

function AnimatedNumber({ value }: { value: number }) {
    const elRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        if (!elRef.current) return;
        const target = value;
        const start = 0;
        const duration = 1000;
        const startTime = performance.now();
        let animationFrame: number;
        function update(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            if (elRef.current) {
                elRef.current.textContent = String(Math.round(start + (target - start) * eased));
            }
            if (progress < 1) animationFrame = requestAnimationFrame(update);
        }
        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [value]);
    return <span ref={elRef}>{value}</span>;
}

export default function DashboardAnalytics() {
    const [dataStore, setDataStore] = useState<any>(null);
    const [filter, setFilter] = useState<'Today' | '7 Days' | '30 Days' | 'All Time'>('All Time');
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const loadData = () => {
        try {
            const str = localStorage.getItem('verentis_analytics');
            if (str) setDataStore(JSON.parse(str));
            setLastRefresh(Date.now());
        } catch (e) {
            console.error('Failed to load analytics', e);
        }
    };

    useEffect(() => {
        loadData();
        const int = setInterval(loadData, 30000);
        return () => clearInterval(int);
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearAnalytics = () => {
        if (window.confirm('Are you sure you want to clear all local analytics data?')) {
            localStorage.removeItem('verentis_analytics');
            setDataStore(null);
            setExpandedRows(new Set());
        }
    };

    const filteredSessions = useMemo(() => {
        if (!dataStore?.sessions) return [];
        const now = Date.now();
        const daysMs = (days: number) => days * 24 * 60 * 60 * 1000;

        return dataStore.sessions.filter((s: any) => {
            if (filter === 'Today') return (now - s.timestamp) < daysMs(1);
            if (filter === '7 Days') return (now - s.timestamp) < daysMs(7);
            if (filter === '30 Days') return (now - s.timestamp) < daysMs(30);
            return true;
        });
    }, [dataStore, filter]);

    const stats = useMemo(() => {
        const ag = { total: 0, valid: 0, invalid: 0, partial: 0, skipped: 0, confSum: 0, confCount: 0 };
        filteredSessions.forEach((s: any) => {
            ag.total += s.totalFiles || 0;
            ag.valid += s.validCount || 0;
            ag.invalid += s.invalidCount || 0;
            ag.partial += s.partialCount || 0;
            ag.skipped += s.skippedCount || 0;
            s.files.forEach((f: any) => {
                if (f.confidence) {
                    ag.confSum += f.confidence;
                    ag.confCount++;
                }
            });
        });
        const avgConf = ag.confCount ? Math.round(ag.confSum / ag.confCount) : 0;
        return { ...ag, avgConf };
    }, [filteredSessions]);

    // Trend calculations
    const last30Days = useMemo(() => {
        const labels = [];
        const valid = [];
        const invalid = [];
        const total = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000);
            labels.push(d.getDate() + '/' + (d.getMonth() + 1));
            let counts = { v: 0, inv: 0, t: 0 };
            dataStore?.sessions?.forEach((s: any) => {
                const sd = new Date(s.timestamp);
                if (sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()) {
                    counts.v += s.validCount || 0;
                    counts.inv += s.invalidCount || 0;
                    counts.t += s.totalFiles || 0;
                }
            });
            valid.push(counts.v);
            invalid.push(counts.inv);
            total.push(counts.t);
        }
        return { labels, valid, invalid, total };
    }, [dataStore]);

    // Manufacturers & States
    const manPerf = useMemo(() => {
        const map: any = {};
        const stateMap: any = {};

        filteredSessions.forEach((s: any) => {
            s.files.forEach((f: any) => {
                if (f.manufacturer) {
                    if (!map[f.manufacturer]) map[f.manufacturer] = { count: 0, v: 0, inv: 0, cSum: 0, cCount: 0 };
                    map[f.manufacturer].count++;
                    if (f.status === 'valid') map[f.manufacturer].v++;
                    if (f.status === 'invalid') map[f.manufacturer].inv++;
                    if (f.confidence) { map[f.manufacturer].cSum += f.confidence; map[f.manufacturer].cCount++; }
                }
                if (f.state && f.state.trim().length > 0) {
                    if (!stateMap[f.state]) stateMap[f.state] = 0;
                    stateMap[f.state]++;
                }
            });
        });
        const arr = Object.keys(map).map(k => ({ ...map[k], name: k, avgConf: map[k].cCount ? Math.round(map[k].cSum / map[k].cCount) : 0 }))
            .sort((a, b) => b.count - a.count);

        const stateArr = Object.keys(stateMap).map(k => ({ label: k, count: stateMap[k] })).sort((a, b) => b.count - a.count);

        return { manufacturers: arr, states: stateArr };
    }, [filteredSessions]);

    const recentActivity = useMemo(() => {
        const files: any[] = [];
        dataStore?.sessions?.forEach((s: any) => {
            s.files.forEach((f: any) => {
                files.push({ ...f, timestamp: s.timestamp });
            });
        });
        files.sort((a, b) => b.timestamp - a.timestamp);
        return files.slice(0, 20);
    }, [dataStore]);

    const exportFullReport = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`
            <html>
                <head>
                    <title>Verentis Analytics Report</title>
                    <style>
                        body { font-family: sans-serif; color: #111; padding: 40px; }
                        h1 { color: #00c2cb; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                        th { background: #f0f0f0; }
                    </style>
                </head>
                <body>
                    <h1>Verentis Forensic Intelligence Report</h1>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Filter: ${filter}</p>
                    
                    <h3>KPIs</h3>
                    <ul>
                        <li>Total Processed: ${stats.total}</li>
                        <li>Valid: ${stats.valid}</li>
                        <li>Invalid: ${stats.invalid}</li>
                        <li>Avg Confidence: ${stats.avgConf}%</li>
                    </ul>

                    <h3>Top Manufacturers</h3>
                    <table>
                        <tr><th>Manufacturer</th><th>Count</th><th>Valid</th><th>Invalid</th><th>Assessed Confidence</th></tr>
                        ${manPerf.manufacturers.slice(0, 10).map((m: any) => `<tr><td>${m.name}</td><td>${m.count}</td><td>${m.v}</td><td>${m.inv}</td><td>${m.avgConf}%</td></tr>`).join('')}
                    </table>

                    <script>window.print();</script>
                </body>
            </html>
        `);
        w.document.close();
    };

    if (!dataStore || dataStore.sessions.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#0a0d14] text-[#4a5568]">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-6 opacity-50">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <h2 className="text-[#e8ecf4] text-xl font-bold mb-2 tracking-widest uppercase">No Analytics Data Yet</h2>
                <p className="text-sm">Start analyzing vehicle documents to see insights here.</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#0a0d14', color: '#e8ecf4', minHeight: '100%', padding: '32px' }} className="font-sans flex flex-col overflow-y-auto w-full max-w-[1600px] mx-auto">
            <style dangerouslySetInnerHTML={{
                __html: `
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s, border-color 0.2s;
                    display: flex; flex-direction: column; gap: 8px;
                }
                .glass-card:hover { transform: translateY(-3px); border-color: rgba(255, 255, 255, 0.15); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
                .glass-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(0, 194, 203, 0.6) 50%, transparent 100%);
                }
                .glass-card.green::before { background: linear-gradient(90deg, transparent 0%, rgba(0, 200, 83, 0.6) 50%, transparent 100%); }
                .glass-card.red::before { background: linear-gradient(90deg, transparent 0%, rgba(255, 23, 68, 0.6) 50%, transparent 100%); }
                .glass-card.blue::before { background: linear-gradient(90deg, transparent 0%, rgba(0, 136, 255, 0.6) 50%, transparent 100%); }
                .glass-card::after {
                    content: '';
                    position: absolute; top: -50%; right: -20%; width: 120px; height: 120px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(0, 194, 203, 0.06) 0%, transparent 70%); pointer-events: none;
                }
                .kpi-number { font-size: 36px; font-weight: 800; line-height: 1; color: #e8ecf4; }
                .kpi-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #4a5568; }
                .kpi-trend { font-size: 12px; font-weight: 600; margin-top: auto; }
                .kpi-trend.up { color: #00c853; }
                .kpi-trend.down { color: #ff1744; }
                .kpi-trend.neutral { color: #4a5568; }
                
                .filter-btn { padding: 6px 16px; font-size: 12px; font-weight: 600; color: #4a5568; background: transparent; border: 1px solid #1e2535; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
                .filter-btn.active { color: #00c2cb; border-color: #00c2cb; background: rgba(0,194,203,0.08); }
                .filter-btn:hover:not(.active) { color: #e8ecf4; border-color: #4a5568; }
                
                .action-btn { padding: 8px 20px; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #00c2cb; color: #00c2cb; background: transparent; }
                .action-btn:hover { background: #00c2cb; color: #050d1a; }
                .action-btn.danger { border-color: #ff1744; color: #ff1744; }
                .action-btn.danger:hover { background: #ff1744; color: white; }

                .state-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; padding: 16px; border-radius: 12px; border: 1px solid #1e2535; }
                .state-cell { aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; cursor: pointer; transition: transform 0.1s; position: relative; color: white; }
                .state-cell:hover { transform: scale(1.3); z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                .state-cell .tooltip { position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); background: #1e2535; color: #e8ecf4; font-size: 10px; padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none; display: none; margin-bottom: 2px; z-index: 50; }
                .state-cell:hover .tooltip { display: block; }
                
                .leaderboard-row { display: grid; grid-template-columns: 32px 1fr 60px 60px 60px 80px; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(30,37,53,0.5); transition: background 0.15s; }
                .leaderboard-row:hover { background: rgba(0,194,203,0.03); }
                .rank-badge { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
                .rank-badge.gold { background: rgba(255,171,0,0.2); color: #ffab00; }
                .rank-badge.silver { background: rgba(180,180,180,0.2); color: #aaa; }
                .rank-badge.bronze { background: rgba(176,100,50,0.2); color: #cd7f32; }
                .rank-badge.other { background: #1e2535; color: #4a5568; }

                .timeline-item { display: flex; gap: 14px; padding: 10px 0; align-items: flex-start; }
                .timeline-left { display: flex; flex-direction: column; align-items: center; width: 16px; flex-shrink: 0; align-self: stretch; }
                .timeline-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
                .timeline-dot.valid { background: #00c853; box-shadow: 0 0 8px rgba(0,200,83,0.6); }
                .timeline-dot.invalid { background: #ff1744; box-shadow: 0 0 8px rgba(255,23,68,0.6); }
                .timeline-dot.partial { background: #ffab00; box-shadow: 0 0 8px rgba(255,171,0,0.6); }
                .timeline-dot.skipped { background: #4a5568; }
                .timeline-connector { width: 1px; flex: 1; background: #1e2535; margin: 4px 0; min-height: 20px; }
                .timeline-content { flex: 1; padding-bottom: 8px; border-bottom: 1px solid rgba(30,37,53,0.5); }
                .timeline-filename { font-size: 12px; font-weight: 600; color: #e8ecf4; }
                .timeline-detail { font-size: 10px; color: #4a5568; margin-top: 3px; font-family: monospace; }
                .timeline-time { font-size: 9px; color: #2d3748; margin-top: 4px; }
                
                @media (prefers-reduced-motion: reduce) {
                    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
                }
            `}} />

            <div className="flex justify-between items-end mb-8 relative shrink-0">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-[#00c2cb] mb-1">ANALYTICS DASHBOARD</h1>
                    <p className="text-[#4a5568] text-sm font-semibold tracking-wide">Vehicle Forensic Intelligence — Real-time Processing Insights</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2 bg-[#10131c] p-1 border border-[#1e2535] rounded-xl">
                        {['Today', '7 Days', '30 Days', 'All Time'].map(f => (
                            <button key={f} onClick={() => setFilter(f as any)} className={`filter-btn ${filter === f ? 'active' : ''}`}>{f}</button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button className="action-btn" onClick={exportFullReport}>Export Full Report</button>
                        <button className="action-btn danger" onClick={clearAnalytics}>Clear Data</button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 text-[10px] text-[#4a5568] font-mono">Last updated: {Math.floor((Date.now() - lastRefresh) / 1000 / 60) || 'just'} min ago</div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6 mb-6 shrink-0">
                <div className="glass-card teal">
                    <div className="kpi-label mb-2 flex justify-between items-center">Total Documents <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c2cb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                    <div className="kpi-number"><AnimatedNumber value={stats.total} /></div>
                    <div className="kpi-trend neutral uppercase text-[10px]">ALL TIME</div>
                </div>
                <div className="glass-card green">
                    <div className="kpi-label mb-2 flex justify-between items-center">Valid Documents <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c853" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg></div>
                    <div className="kpi-number"><AnimatedNumber value={stats.valid} /> <span className="text-lg opacity-50 font-normal">({stats.total ? Math.round((stats.valid / stats.total) * 100) : 0}%)</span></div>
                    <div className="kpi-trend up">Chassis + Registration detected</div>
                </div>
                <div className="glass-card red">
                    <div className="kpi-label mb-2 flex justify-between items-center">Invalid / Fake <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff1744" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>
                    <div className="kpi-number"><AnimatedNumber value={stats.invalid} /></div>
                    <div className="kpi-trend down">Format violations</div>
                </div>
                <div className="glass-card blue">
                    <div className="kpi-label mb-2 flex justify-between items-center">Avg Confidence <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0088ff" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
                    <div className="kpi-number"><AnimatedNumber value={stats.avgConf} />%</div>
                    <div className="kpi-trend" style={{ color: '#0088ff' }}>Detection accuracy</div>
                </div>
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-3 gap-6 mb-6 h-[340px] shrink-0">
                <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-6 relative flex flex-col items-center col-span-1">
                    <div className="self-start text-[10px] font-black uppercase tracking-[2px] text-[#4a5568] mb-4">DOCUMENT STATUS BREAKDOWN</div>
                    <div className="relative w-[220px] h-[220px] mx-auto mt-2">
                        <Doughnut data={{
                            labels: ['Valid', 'Partial', 'Invalid/Fake', 'Not Vehicle', 'Error'],
                            datasets: [{
                                data: [stats.valid, stats.partial, stats.invalid, stats.skipped, 0],
                                backgroundColor: ['#00c853', '#ffab00', '#ff1744', '#4a5568', '#c62828'],
                                borderWidth: 0,
                                hoverOffset: 8
                            }]
                        }} options={{
                            responsive: true,
                            cutout: '75%',
                            plugins: {
                                legend: { position: 'bottom', labels: { color: '#e8ecf4', font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 12 } },
                                tooltip: { backgroundColor: '#1e2535', titleColor: '#e8ecf4', bodyColor: '#4a5568', borderColor: '#2d3748', borderWidth: 1 }
                            }
                        }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-24px]">
                            <span className="text-3xl font-black">{stats.total}</span>
                            <span className="text-[10px] uppercase tracking-widest text-[#4a5568]">Total</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-6 col-span-2 flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-[2px] text-[#4a5568] mb-4">PROCESSING TREND — LAST 30 DAYS</div>
                    <div className="flex-1 w-full relative">
                        <Line data={{
                            labels: last30Days.labels,
                            datasets: [
                                { label: 'Valid', data: last30Days.valid, borderColor: '#00c853', backgroundColor: 'rgba(0,200,83,0.08)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
                                { label: 'Invalid', data: last30Days.invalid, borderColor: '#ff1744', backgroundColor: 'rgba(255,23,68,0.06)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
                                { label: 'Total', data: last30Days.total, borderColor: '#00c2cb', backgroundColor: 'rgba(0,194,203,0.04)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, borderDash: [4, 4] }
                            ]
                        }} options={{
                            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                            scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a5568', font: { size: 10 }, maxTicksLimit: 8 } },
                                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a5568', font: { size: 10 } }, beginAtZero: true }
                            },
                            plugins: { legend: { labels: { color: '#e8ecf4', font: { size: 10 }, usePointStyle: true } } }
                        }} />
                    </div>
                </div>
            </div>

            {/* Row 3: Bar & Map */}
            <div className="grid grid-cols-2 gap-6 mb-6 shrink-0">
                <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-6 h-[380px] flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-[2px] text-[#4a5568] mb-6">TOP MANUFACTURERS DETECTED</div>
                    <div className="flex-1">
                        <Bar
                            data={{
                                labels: manPerf.manufacturers.slice(0, 10).map((m: any) => m.name.substring(0, 20)),
                                datasets: [{
                                    label: 'Vehicles',
                                    data: manPerf.manufacturers.slice(0, 10).map((m: any) => m.count),
                                    backgroundColor: ['rgba(0,194,203,0.7)', 'rgba(0,136,255,0.7)', 'rgba(0,200,83,0.7)', 'rgba(255,171,0,0.7)', 'rgba(156,100,255,0.7)'],
                                    borderRadius: 4
                                }]
                            }}
                            options={{
                                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                                scales: {
                                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a5568' } },
                                    y: { grid: { display: false }, ticks: { color: '#e8ecf4', font: { size: 11 } } }
                                },
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </div>
                <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-6 h-[380px] flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-[2px] text-[#4a5568] mb-4">GEOGRAPHIC DISTRIBUTION</div>
                    <div className="flex-1 flex gap-6">
                        <div className="w-[60%] border border-[#1e2535] rounded-xl p-3 bg-[#0a0d14]">
                            <div className="state-grid">
                                {Array.from({ length: 48 }).map((_, i) => {
                                    const states = manPerf.states;
                                    const s = states[i % Math.max(1, states.length)] || { label: 'Empty', count: 0 };
                                    const val = Math.min(s.count * 10, 100);
                                    let bg = '#1e2535';
                                    if (val > 0) bg = `rgba(0,194,203,${Math.max(0.2, val / 100)})`;
                                    return (
                                        <div key={i} className="state-cell" style={{ background: bg }}>
                                            {s.count > 0 && s.label.substring(0, 2)}
                                            {s.count > 0 && <div className="tooltip">{s.label}: {s.count}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="w-[40%] flex flex-col gap-3 overflow-hidden">
                            <div className="text-[10px] uppercase font-bold text-[#4a5568] border-b border-[#1e2535] pb-2">Top States Map</div>
                            {manPerf.states.slice(0, 5).map((s: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#00c2cb] font-mono">{i + 1}.</span>
                                        <span className="text-[#e8ecf4] font-semibold truncate w-20">{s.label}</span>
                                    </div>
                                    <span className="text-[#4a5568] font-bold">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4: Lists */}
            <div className="grid grid-cols-2 gap-6 mb-6 shrink-0">
                <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-0 h-[400px] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[#1e2535] text-[10px] font-black uppercase tracking-[2px] text-[#4a5568]">MANUFACTURER INTELLIGENCE</div>
                    <div className="flex-1 overflow-y-auto">
                        {manPerf.manufacturers.map((m: any, i: number) => (
                            <div key={i} className="leaderboard-row">
                                <div className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other'}`}>{i + 1}</div>
                                <div className="manufacturer-name truncate">{m.name}</div>
                                <div className="text-center font-mono text-[11px] text-[#e8ecf4]">{m.count}</div>
                                <div className="text-center font-mono text-[11px] text-[#00c853]">{m.v}</div>
                                <div className="text-center font-mono text-[11px] text-[#ff1744]">{m.inv}</div>
                                <div className="text-right font-mono text-[11px] text-[#0088ff]">{m.avgConf}%</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-0 h-[400px] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[#1e2535] text-[10px] font-black uppercase tracking-[2px] text-[#4a5568] flex justify-between items-center">
                        TIMELINE ACTIVITY <span className="text-[#00c853] text-[10px]">&bull; Live</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {recentActivity.map((r: any, i: number) => {
                            const ago = Math.floor((Date.now() - r.timestamp) / 1000 / 60);
                            return (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-left">
                                        <div className={`timeline-dot ${r.status}`} />
                                        {i !== recentActivity.length - 1 && <div className="timeline-connector" />}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-filename">{r.filename}</div>
                                        <div className="timeline-detail">{r.chassis || 'NO CHASSIS DETECTED'}</div>
                                        <div className="timeline-time">{ago <= 0 ? 'Just now' : `${ago}m ago`}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Table */}
            <div className="bg-[#10131c] border border-[#1e2535] rounded-2xl p-6 shrink-0 mb-12">
                <div className="text-[10px] font-black uppercase tracking-[2px] text-[#4a5568] mb-6">BATCH SESSION HISTORY</div>
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th className="py-3 px-4 border-b border-[#1e2535] text-[#4a5568] text-[10px] uppercase font-bold tracking-widest">Session ID</th>
                            <th className="py-3 px-4 border-b border-[#1e2535] text-[#4a5568] text-[10px] uppercase font-bold tracking-widest">Date</th>
                            <th className="py-3 px-4 border-b border-[#1e2535] text-[#4a5568] text-[10px] uppercase font-bold tracking-widest">Mode</th>
                            <th className="py-3 px-4 border-b border-[#1e2535] text-[#4a5568] text-[10px] uppercase font-bold tracking-widest">Files</th>
                            <th className="py-3 px-4 border-b border-[#1e2535] text-[#4a5568] text-[10px] uppercase font-bold tracking-widest">Valid / Inv</th>
                            <th className="py-3 px-4 border-b border-[#1e2535] text-[#4a5568] text-[10px] uppercase font-bold tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSessions.map((row: any, idx: number) => (
                            <React.Fragment key={idx}>
                                <tr className="hover:bg-[#1e253530] transition-colors border-b border-[#1e2535]">
                                    <td className="py-3 px-4 font-mono text-[11px] text-[#00c2cb]">{row.id}</td>
                                    <td className="py-3 px-4 text-[12px] text-[#e8ecf4]">{new Date(row.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-4"><span className="uppercase text-[9px] font-bold tracking-widest bg-[#1e2535] px-2 py-1 rounded text-[#a0aec0]">{row.mode}</span></td>
                                    <td className="py-3 px-4 font-mono text-[11px] text-[#e8ecf4]">{row.totalFiles}</td>
                                    <td className="py-3 px-4 font-mono text-[11px]">
                                        <span className="text-[#00c853]">{row.validCount}</span> <span className="text-[#4a5568]">/</span> <span className="text-[#ff1744]">{row.invalidCount}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button onClick={() => toggleExpand(row.id)} className="text-[11px] uppercase tracking-wider font-bold text-[#00c2cb] hover:underline">
                                            {expandedRows.has(row.id) ? 'Collapse' : 'Details'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRows.has(row.id) && (
                                    <tr>
                                        <td colSpan={6} className="p-0 border-b border-[#1e2535]">
                                            <div className="bg-[#0a0d14] p-6 m-4 mt-0 rounded-lg border border-[#1e2535]">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr>
                                                            <th className="pb-2 text-[10px] uppercase tracking-wider text-[#4a5568]">File</th>
                                                            <th className="pb-2 text-[10px] uppercase tracking-wider text-[#4a5568]">Status</th>
                                                            <th className="pb-2 text-[10px] uppercase tracking-wider text-[#4a5568]">Manufacturer</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {row.files.map((f: any, fi: number) => (
                                                            <tr key={fi}>
                                                                <td className="py-2 text-[11px] text-[#e8ecf4]">{f.filename}</td>
                                                                <td className="py-2"><span className={`uppercase text-[9px] px-2 py-0.5 rounded font-bold ${f.status === 'valid' ? 'bg-[#00c85320] text-[#00c853]' : f.status === 'invalid' ? 'bg-[#ff174420] text-[#ff1744]' : 'bg-[#4a556820] text-[#a0aec0]'}`}>{f.status}</span></td>
                                                                <td className="py-2 text-[11px] text-[#a0aec0]">{f.manufacturer || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
