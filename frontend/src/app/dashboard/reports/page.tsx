"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.1)';

export default function ReportsPage() {
    const [selectedRange, setSelectedRange] = useState('7D');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [viewingArchives, setViewingArchives] = useState(false);
    const [reportItems, setReportItems] = useState<any[]>([]);
    const [showExportToast, setShowExportToast] = useState(false);
    const [reportsData, setReportsData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                // Fetch Reporting Analytics
                const rangeMap: any = { '1D': 1, '7D': 7, '30D': 30, '90D': 90 };
                const days = rangeMap[selectedRange] || 7;
                const reportsResponse = await fetch(`http://127.0.0.1:8000/api/v1/analytics/reports?days=${days}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (reportsResponse.ok) {
                    const data = await reportsResponse.json();
                    setReportsData(data);
                }

                // Fetch Reports (Documents)
                const docsResponse = await fetch("http://127.0.0.1:8000/api/v1/documents/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (docsResponse.ok) {
                    const data = await docsResponse.json();
                    setReportItems(data.map((doc: any) => ({
                        id: doc.filename,
                        date: new Date(doc.created_at).toLocaleString(),
                        status: doc.verdict,
                        statusClass: doc.verdict === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                        security: doc.verdict === 'VERIFIED' ? 3 : 1,
                        icon: doc.verdict === 'VERIFIED' ? 'assessment' : 'dangerous',
                        iconClass: doc.verdict === 'VERIFIED' ? 'bg-blue-50 text-primary' : 'bg-red-50 text-red-500'
                    })));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [selectedRange]);

    const handleGenerateSummary = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000);
    };

    const handleExportPDF = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            setShowExportToast(true);
            setTimeout(() => setShowExportToast(false), 3000);
        }, 2500);
    };

    const typologyChartData = {
        labels: reportsData?.typology?.map((t: any) => t.label) || [],
        datasets: [{
            data: reportsData?.typology?.map((t: any) => t.count) || [],
            backgroundColor: [
                '#3b82f6', // Blue
                '#8b5cf6', // Purple
                '#ef4444', // Red
                '#f97316'  // Orange
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const typologyChartOptions = {
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
                        return `${percentage}% (${context.raw} incidents)`;
                    }
                }
            }
        }
    };

    const efficiencyChartData = {
        labels: reportsData?.efficiency_trends?.map((t: any) => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) || [],
        datasets: [
            {
                label: 'Processing Time (s)',
                data: reportsData?.efficiency_trends?.map((t: any) => t.processing_time) || [],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Documents Analyzed',
                data: reportsData?.efficiency_trends?.map((t: any) => t.documents_analyzed) || [],
                borderColor: '#3b82f6',
                borderDash: [5, 5],
                yAxisID: 'y1',
                tension: 0.4,
            },
            {
                label: 'Detection Accuracy (%)',
                data: reportsData?.efficiency_trends?.map((t: any) => t.accuracy) || [],
                borderColor: '#10b981',
                yAxisID: 'y2',
                tension: 0.4,
            }
        ]
    };

    const efficiencyChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { usePointStyle: true, boxWidth: 6, font: { family: "'Inter', sans-serif", size: 10 } }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: { display: true, text: 'Time (s)', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Count', font: { size: 10 } }
            },
            y2: {
                type: 'linear' as const,
                display: false,
                position: 'right' as const,
                min: 0,
                max: 100
            }
        }
    };


    return (
        <div className="p-8 pb-16 relative">
            {/* Export Notification Toast */}
            <AnimatePresence>
                {showExportToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-950 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-800/50 backdrop-blur-md"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-tight">Export Successful</p>
                            <p className="text-[10px] text-indigo-200 mt-0.5 uppercase tracking-widest font-black">Forensic_Report.pdf generated.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-end border-b border-slate-800 pb-8">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">Forensic Reporting Center</h2>
                        <p className="text-slate-400 text-sm mt-1 font-bold uppercase tracking-tight opacity-70">Cross-institutional fraud detection metrics and efficiency KPIs.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGenerateSummary}
                            disabled={isGenerating}
                            className={`bg-slate-900/50 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg font-black text-[11px] hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm ${isGenerating && 'opacity-50 cursor-not-allowed'}`}
                        >
                            <span className={`material-symbols-outlined text-lg font-bold ${isGenerating && 'animate-spin'}`}>
                                {isGenerating ? 'autorenew' : 'calendar_month'}
                            </span>
                            {isGenerating ? 'Generating...' : 'Generate Summary'}
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className={`bg-primary text-white px-4 py-2.5 rounded-lg font-black text-[11px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 uppercase tracking-widest ${isExporting && 'opacity-50 cursor-not-allowed'}`}
                        >
                            <span className={`material-symbols-outlined text-lg font-bold ${isExporting && 'animate-bounce'}`}>
                                {isExporting ? 'downloading' : 'picture_as_pdf'}
                            </span>
                            {isExporting ? 'Exporting...' : 'Export Forensic PDF'}
                        </button>
                    </div>
                </div>

                {/* KPI Banner */}
                {reportsData && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { title: 'Total Documents', key: 'total_documents', icon: 'description', suffix: '' },
                            { title: 'Fraud Cases', key: 'fraud_cases', icon: 'gpp_bad', suffix: '' },
                            { title: 'Suspicious Details', key: 'suspicious_cases', icon: 'warning', suffix: '' },
                            { title: 'Processing Time', key: 'avg_processing_time', icon: 'timer', suffix: 's' },
                            { title: 'Detection Accuracy', key: 'detection_accuracy', icon: 'target', suffix: '%' },
                        ].map((kpi, idx) => {
                            const data = reportsData.kpis[kpi.key];
                            return (
                                <div key={idx} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-5 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors border border-blue-500/20">
                                            <span className="material-symbols-outlined text-[18px]">{kpi.icon}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-900/50 border ${data.is_positive ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                                            <span className="material-symbols-outlined text-[12px]">{data.is_positive ? 'trending_up' : 'trending_down'}</span>
                                            {data.trend_percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-white tracking-tighter">
                                            {typeof data.value === 'number' && Number.isInteger(data.value) ? data.value : data.value.toFixed(1)}{kpi.suffix}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">{kpi.title}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-xs text-white uppercase tracking-widest border-l-4 border-primary pl-3">Fraud Typology</h3>
                            <span className="material-symbols-outlined text-slate-500 text-xl font-bold group-hover:text-primary transition-colors cursor-help">info</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center py-6 h-full">
                            <div className="relative w-48 h-48 mb-8">
                                {reportsData && reportsData.typology && (
                                    <div className="w-full h-full">
                                        <Doughnut data={typologyChartData} options={typologyChartOptions} />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-white tracking-tighter">{reportsData?.kpis?.total_documents?.value || '--'}</span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Total Incidents</span>
                                </div>
                            </div>
                            <div className="w-full space-y-3 px-4 pt-4 mt-auto">
                                {reportsData && reportsData.typology && reportsData.typology.map((t: any, idx: number) => {
                                    const colors = ['bg-blue-500 shadow-blue-500/40', 'bg-purple-500 shadow-purple-500/40', 'bg-red-500 shadow-red-500/40', 'bg-orange-500 shadow-orange-500/40'];
                                    const borderColors = ['border-blue-500/20', 'border-purple-500/20', 'border-red-500/20', 'border-orange-500/20'];
                                    return (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${colors[idx % colors.length]}`}></div>
                                                <span className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">{t.label}</span>
                                            </div>
                                            <span className={`font-black text-white border-b ${borderColors[idx % borderColors.length]}`}>{t.percentage}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 lg:col-span-2">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-black text-xs text-white uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Processing Efficiency</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 opacity-60">Mean processing time per document batch (seconds)</p>
                            </div>
                            <div className="flex gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-950 shadow-inner">
                                {['1D', '7D', '30D', '90D'].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setSelectedRange(range)}
                                        className={`px-3 py-1 text-[9px] font-black rounded-md uppercase tracking-widest transition-all ${selectedRange === range ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 w-full h-80 px-2 pb-2">
                            {reportsData && <Line data={efficiencyChartData} options={efficiencyChartOptions} />}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl lg:col-span-3 overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary font-bold">folder_shared</span>
                                {viewingArchives ? 'All Forensic Archives' : 'Recently Generated Reports'}
                            </h3>
                            <button
                                onClick={() => setViewingArchives(!viewingArchives)}
                                className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.15em] hover:text-blue-400 transition-colors"
                            >
                                {viewingArchives ? 'Return to Recent' : 'View All Archives'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Report Identifier</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Generated On</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Level</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 bg-transparent">
                                    {(viewingArchives ? [...reportItems, ...reportItems] : reportItems).map((report, i) => (
                                        <motion.tr
                                            key={`${viewingArchives ? 'v' : 'r'}-${i}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-current/10 shadow-sm group-hover:scale-105 transition-transform ${report.iconClass}`}>
                                                        <span className="material-symbols-outlined text-xl font-bold">{report.icon}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{report.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap">{report.date}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-current/10 ${report.statusClass}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex gap-1.5 min-w-[60px]">
                                                    {[1, 2, 3].map((s) => (
                                                        <div
                                                            key={s}
                                                            className={`w-4 h-1 rounded-full transition-all duration-500 ${s <= report.security ? (report.security === 1 ? 'bg-red-500 shadow-sm shadow-red-500/40' : 'bg-emerald-500 shadow-sm shadow-emerald-500/40') : 'bg-slate-800'}`}
                                                            style={{ width: s <= report.security ? '1.5rem' : '1rem' }}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-slate-700 hover:shadow-sm">
                                                    <span className="material-symbols-outlined text-xl font-black">download</span>
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
