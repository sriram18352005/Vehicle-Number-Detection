"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

export default function DashboardPage() {
    const [activityItems, setActivityItems] = useState<any[]>([]);
    const [stats, setStats] = useState({ verified: '0', fraud: '0', confidence: '0%' });
    const [metrics, setMetrics] = useState<any>(null);
    const [trendsData, setTrendsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [trendsLoading, setTrendsLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState(7);
    const router = useRouter();

    const fetchMetrics = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("http://127.0.0.1:8000/api/dashboard/metrics", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched metrics:", data);
                setMetrics(data);
            } else {
                console.warn("Metrics fetch failed with status:", res.status);
            }
        } catch (err) {
            console.error("Failed to fetch metrics:", err);
        } finally {
            setMetricsLoading(false);
        }
    };

    const fetchTrends = async (days: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        setTrendsLoading(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/analytics/trends?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTrendsData(data);
            }
        } catch (err) {
            console.error("Failed to fetch trends:", err);
        } finally {
            setTrendsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                setMetricsLoading(false);
                setTrendsLoading(false);
                return;
            }

            try {
                // Initial fetches
                fetchMetrics();
                fetchTrends(timeFilter);

                // Fetch Stats and Activities in parallel
                const [statsRes, activityRes] = await Promise.all([
                    fetch("http://127.0.0.1:8000/api/v1/analytics/summary", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch("http://127.0.0.1:8000/api/v1/documents/?limit=10", {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats({
                        verified: (statsData.total_verified || 0).toLocaleString(),
                        fraud: (statsData.fraud_detected || 0).toLocaleString(),
                        confidence: `${((statsData.avg_confidence || 0) * 100).toFixed(1)}%`
                    });
                }

                if (activityRes.ok) {
                    const data = await activityRes.json();
                    setActivityItems(data.map((doc: any) => {
                        const verdict = doc.verdict || 'UNKNOWN';
                        const confidence = doc.confidence_score || 0;
                        return {
                            id: `CASE-${doc.id}`,
                            status: verdict === 'UNKNOWN' ? 'Pending' : verdict.charAt(0) + verdict.slice(1).toLowerCase(),
                            color: verdict === 'VERIFIED' ? 'status-verified' : verdict === 'FAKE' ? 'status-fake' : 'status-suspicious',
                            title: doc.filename,
                            time: new Date(doc.created_at || Date.now()).toLocaleTimeString(),
                            conf: `${(confidence * 100).toFixed(1)}%`
                        };
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Polling for metrics every 5 seconds
        const metricsInterval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(metricsInterval);
    }, []);

    // Effect to re-fetch trends when timeFilter changes
    useEffect(() => {
        if (!loading) {
            fetchTrends(timeFilter);
        }
    }, [timeFilter]);

    const chartData = [40, 60, 35, 85, 55, 25, 45];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Forensic Analysis</h2>
                <p className="text-slate-500 text-sm mt-1">Status Report: 12 active forensic investigations today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="kpi-card"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Scans</p>
                            {metricsLoading ? (
                                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded"></div>
                            ) : (
                                <h3 className="text-3xl font-extrabold">{metrics?.total_scans ?? "--"}</h3>
                            )}
                            <div className="flex items-center gap-1 text-slate-400 mt-2">
                                <span className="material-symbols-outlined text-sm">history</span>
                                <span className="text-xs font-bold">Lifetime investigations</span>
                            </div>
                        </div>
                        <div className="opacity-20 absolute -right-4 -bottom-4">
                            <span className="material-symbols-outlined text-7xl text-primary">search</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="kpi-card"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Verified Real</p>
                            {metricsLoading ? (
                                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded"></div>
                            ) : (
                                <h3 className="text-3xl font-extrabold">{metrics?.verified_real ?? "--"}</h3>
                            )}
                            <div className="flex items-center gap-1 text-emerald-600 mt-2">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                <span className="text-xs font-bold">Authenticated</span>
                            </div>
                        </div>
                        <div className="opacity-20 absolute -right-4 -bottom-4">
                            <span className="material-symbols-outlined text-7xl text-primary">verified_user</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="kpi-card"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Detected Fake</p>
                            {metricsLoading ? (
                                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded"></div>
                            ) : (
                                <h3 className="text-3xl font-extrabold">{metrics?.detected_fake ?? "--"}</h3>
                            )}
                            <div className="flex items-center gap-1 text-red-500 mt-2">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                <span className="text-xs font-bold">Fraud identified</span>
                            </div>
                        </div>
                        <div className="opacity-20 absolute -right-4 -bottom-4">
                            <span className="material-symbols-outlined text-7xl text-red-500">gpp_maybe</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="kpi-card border-l-4 border-primary"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Processing</p>
                            {metricsLoading ? (
                                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded"></div>
                            ) : (
                                <h3 className="text-3xl font-extrabold">
                                    {metrics?.avg_processing_time != null ? `${Number(metrics.avg_processing_time).toFixed(1)}s` : "--"}
                                </h3>
                            )}
                            <div className="flex items-center gap-1 text-primary mt-2">
                                <span className="material-symbols-outlined text-sm">bolt</span>
                                <span className="text-xs font-bold">Lightning fast</span>
                            </div>
                        </div>
                        <div className="opacity-20 absolute -right-4 -bottom-4">
                            <span className="material-symbols-outlined text-7xl text-primary">psychology</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="widget-card xl:col-span-2 bg-slate-900 border-slate-800 text-white overflow-hidden relative">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

                    <div className="p-6 border-b border-slate-800/50 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]">analytics</span>
                            <h3 className="font-bold tracking-tight">Fraud Trends Analysis</h3>
                        </div>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(Number(e.target.value))}
                            className="text-xs bg-slate-800 border-slate-700 text-slate-300 rounded-lg py-1 px-3 outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer hover:bg-slate-750 transition-colors"
                        >
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 90 Days</option>
                        </select>
                    </div>

                    <div className="p-6 pb-2 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Verified</p>
                            <h4 className="text-xl font-bold text-emerald-400">{trendsLoading ? "..." : trendsData?.total_verified ?? 0}</h4>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fraud Detected</p>
                            <h4 className="text-xl font-bold text-red-400">{trendsLoading ? "..." : trendsData?.total_fraud ?? 0}</h4>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suspicious</p>
                            <h4 className="text-xl font-bold text-orange-400">{trendsLoading ? "..." : trendsData?.total_suspicious ?? 0}</h4>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 from-primary/10 to-transparent bg-gradient-to-br">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Accuracy</p>
                            <h4 className="text-xl font-bold text-white">{trendsLoading ? "..." : `${trendsData?.accuracy ?? 0}%`}</h4>
                        </div>
                    </div>

                    <div className="p-6 h-[320px] relative z-10">
                        {trendsLoading ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800/20 rounded-xl animate-pulse">
                                <span className="text-slate-500 text-sm font-medium">Synchronizing data...</span>
                            </div>
                        ) : (
                            <div className="w-full h-full relative">
                                <Line
                                    data={{
                                        labels: trendsData?.trends.map((t: any) => new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' })) || [],
                                        datasets: [
                                            {
                                                fill: true,
                                                label: 'Real',
                                                data: trendsData?.trends.map((t: any) => t.real) || [],
                                                borderColor: '#10b981',
                                                backgroundColor: 'rgba(16, 185, 129, 0.3)',
                                                tension: 0.4,
                                            },
                                            {
                                                fill: true,
                                                label: 'Suspicious',
                                                data: trendsData?.trends.map((t: any) => t.suspicious) || [],
                                                borderColor: '#f59e0b',
                                                backgroundColor: 'rgba(245, 158, 11, 0.3)',
                                                tension: 0.4,
                                            },
                                            {
                                                fill: true,
                                                label: 'Fake',
                                                data: trendsData?.trends.map((t: any) => t.fake) || [],
                                                borderColor: '#ef4444',
                                                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                                                tension: 0.4,
                                            },
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: {
                                                stacked: true,
                                                grid: { display: false },
                                                ticks: { color: '#64748b', font: { size: 10 } },
                                                border: { display: false }
                                            },
                                            y: {
                                                stacked: true,
                                                grid: { color: '#1e293b' },
                                                ticks: { color: '#64748b', font: { size: 10 } },
                                                border: { display: false }
                                            }
                                        },
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                mode: 'index',
                                                intersect: false,
                                                backgroundColor: '#0f172a',
                                                titleColor: '#f8fafc',
                                                bodyColor: '#f8fafc',
                                                borderColor: '#1e293b',
                                                borderWidth: 1,
                                                cornerRadius: 8
                                            }
                                        },
                                        interaction: {
                                            mode: 'index',
                                            intersect: false,
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-6 relative z-10">
                        <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap">
                                {trendsData?.insight || "Analyzing recent detection patterns..."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="widget-card">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-600">list_alt</span>
                            <h3 className="font-bold">Recent Activity</h3>
                        </div>
                        <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">View All</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="p-4 animate-pulse">
                                    <div className="flex justify-between mb-2">
                                        <div className="h-4 w-16 bg-slate-100 rounded"></div>
                                        <div className="h-4 w-20 bg-slate-100 rounded-full"></div>
                                    </div>
                                    <div className="h-3 w-3/4 bg-slate-100 rounded mb-2"></div>
                                    <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                                </div>
                            ))
                        ) : activityItems.map((activity, i) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="p-4 hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold">{activity.id}</span>
                                    <span className={`status-badge ${activity.color}`}>{activity.status}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2 font-medium">{activity.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                    {activity.time} • confidence: {activity.conf}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
