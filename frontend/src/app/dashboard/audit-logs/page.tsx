"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface AuditLog {
    id: number;
    time: string;
    user: string;
    action: string;
    resource: string;
    status: string;
    statusClass: string;
    icon: string;
    initials?: string;
    severity: string;
    bank: string;
    result: string;
    rowClass: string;
    rawDetails: any;
}

export default function AuditLogsPage() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalLogs, setTotalLogs] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [dateRange, setDateRange] = useState("All Time");
    const [actionType, setActionType] = useState("All Actions");
    const [severityFilter, setSeverityFilter] = useState("All Levels");

    // Toast Alert
    const [criticalAlert, setCriticalAlert] = useState<{ show: boolean, message: string }>({ show: false, message: "" });
    const lastNotifiedId = useRef<number>(0);

    const logsPerPage = 20;

    const fetchAuditLogs = async (isPolling = false) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            if (!isPolling) setIsLoading(true);
            const skip = (currentPage - 1) * logsPerPage;

            const params = new URLSearchParams();
            params.append("limit", logsPerPage.toString());
            params.append("skip", skip.toString());
            if (dateRange !== "All Time") params.append("date_range", dateRange);
            if (actionType !== "All Actions") params.append("action_type", actionType);
            if (severityFilter !== "All Levels") params.append("severity", severityFilter);

            const res = await fetch(`http://127.0.0.1:8000/api/v1/audit/?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTotalLogs(data.total);

                const parsedLogs = data.items.map((log: any) => {
                    const action = log.action || 'SYSTEM_ACTION';
                    const details = log.details || {};
                    const severity = details.severity || 'INFO';

                    // Map severity to colors
                    let statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
                    let bgRow = 'hover:bg-slate-50';
                    if (severity === 'WARNING') {
                        statusClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                        bgRow = 'hover:bg-yellow-50/30';
                    }
                    if (severity === 'ALERT') {
                        statusClass = 'bg-orange-50 text-orange-700 border-orange-200';
                        bgRow = 'hover:bg-orange-50/20';
                    }
                    if (severity === 'CRITICAL') {
                        statusClass = 'bg-red-50 text-red-700 border-red-200 font-extrabold';
                        bgRow = 'bg-red-50 hover:bg-red-100/50 border-l-4 border-l-red-500';
                    }

                    return {
                        id: log.id,
                        time: new Date(log.created_at).toLocaleString(),
                        user: log.user_id === "SYSTEM" ? "System API" : "Institutional User",
                        action: action.replace(/_/g, ' '),
                        resource: log.document_id ? `DOC-${log.document_id}` : 'SYS-CORE',
                        status: details.status || 'Success',
                        statusClass: statusClass,
                        rowClass: bgRow,
                        icon: log.user_id === "SYSTEM" ? 'robot_2' : 'person_check',
                        severity: severity,
                        bank: details.bank_type || 'N/A',
                        result: details.verification_result || 'N/A',
                        rawDetails: details
                    };
                });

                setAuditLogs(parsedLogs);

                if (isPolling && parsedLogs.length > 0) {
                    const latestLog = parsedLogs[0];
                    if (latestLog.id > lastNotifiedId.current) {
                        if (latestLog.severity === 'CRITICAL') {
                            setCriticalAlert({
                                show: true,
                                message: `⚠ ${latestLog.action}: Fraud detected in ${latestLog.resource} (${latestLog.bank})`
                            });
                            setTimeout(() => setCriticalAlert({ show: false, message: "" }), 6000);
                        }
                        lastNotifiedId.current = latestLog.id;
                    }
                } else if (!isPolling && parsedLogs.length > 0) {
                    lastNotifiedId.current = parsedLogs[0].id;
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
        const intervalId = setInterval(() => {
            if (currentPage === 1) {
                fetchAuditLogs(true);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [currentPage, dateRange, actionType, severityFilter]);

    const totalPages = Math.ceil(totalLogs / logsPerPage);

    return (
        <div className="p-8 relative">
            {/* Real-Time CRITICAL Alert */}
            <AnimatePresence>
                {criticalAlert.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-red-500"
                    >
                        <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
                        <p className="font-extrabold tracking-wide text-sm">{criticalAlert.message}</p>
                        <button onClick={() => setCriticalAlert({ show: false, message: "" })} className="ml-4 opacity-70 hover:opacity-100">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-extrabold text-indigo-950 tracking-tight">Enterprise Audit Logs</h2>
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Audit Stream</span>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm mt-1 text-pretty max-w-2xl font-medium leading-relaxed">Real-time immutable ledger of system-wide interactions and forensic events.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="widget-card p-4 flex flex-wrap items-center gap-4 border border-slate-200">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase px-1 tracking-widest">Date Range</label>
                        <select
                            value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option>All Time</option>
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase px-1 tracking-widest">Action Type</label>
                        <select
                            value={actionType} onChange={(e) => setActionType(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option>All Actions</option>
                            <option>Document Upload</option>
                            <option>Bank Verification</option>
                            <option>Fraud Detected</option>
                            <option>User Authenticated</option>
                            <option>Report Generated</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase px-1 tracking-widest">Severity</label>
                        <select
                            value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option>All Levels</option>
                            <option>Success (Normal)</option>
                            <option>Warning (Alert)</option>
                            <option>Failed (Critical)</option>
                        </select>
                    </div>
                </div>

                {/* Audit Table */}
                <div className="widget-card border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="table-header">Timestamp</th>
                                    <th className="table-header">User</th>
                                    <th className="table-header">Action Type</th>
                                    <th className="table-header">Resource</th>
                                    <th className="table-header">Bank</th>
                                    <th className="table-header">Severity</th>
                                    <th className="table-header">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 relative">
                                {isLoading && auditLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">autorenew</span>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {auditLogs.map((log) => (
                                            <motion.tr
                                                key={log.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`transition-colors group ${log.rowClass}`}
                                            >
                                                <td className="table-cell font-mono text-[11px] font-bold text-slate-500 whitespace-nowrap">{log.time}</td>
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${log.user === "System API" ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-indigo-100 border-indigo-200 text-indigo-600"}`}>
                                                            <span className="material-symbols-outlined text-xs font-bold">{log.icon}</span>
                                                        </div>
                                                        <span className="font-extrabold text-slate-800 text-xs tracking-tight">{log.user}</span>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="relative cursor-help">
                                                        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                                                            {log.action}
                                                        </span>
                                                        {/* Tooltip */}
                                                        <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-max max-w-xs bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl z-10">
                                                            <pre className="font-mono">{JSON.stringify(log.rawDetails, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tight">{log.resource}</td>
                                                <td className="table-cell font-bold text-slate-600 text-[11px]">{log.bank}</td>
                                                <td className="table-cell">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${log.statusClass}`}>
                                                        {log.severity}
                                                    </span>
                                                </td>
                                                <td className="table-cell font-bold text-slate-700 text-[11px]">{log.result}</td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                            Showing <span className="font-black text-slate-900 mx-1">{auditLogs.length}</span> of {totalLogs} events
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-indigo-950 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
                            </button>
                            <span className="text-[11px] font-extrabold text-slate-400 mx-2">PAGE {currentPage} / {Math.max(1, totalPages)}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-indigo-950 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
