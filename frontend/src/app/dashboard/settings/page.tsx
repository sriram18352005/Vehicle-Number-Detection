"use client";

import { motion } from "framer-motion";

export default function SettingsPage() {
    return (
        <div className="p-8 pb-16">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-indigo-950 tracking-tight">System & Account Settings</h2>
                    <p className="text-slate-500 text-sm mt-1 font-bold uppercase tracking-tight opacity-70">Manage your institutional identity, security protocols, and API access.</p>
                </div>

                <div className="flex gap-4 sm:gap-8 border-b border-slate-100 overflow-x-auto no-scrollbar">
                    <button className="px-4 py-4 text-[10px] font-black text-primary border-b-2 border-primary uppercase tracking-widest whitespace-nowrap">Profile Identity</button>
                    <button className="px-4 py-4 text-[10px] font-black text-slate-400 hover:text-indigo-950 transition-colors uppercase tracking-widest whitespace-nowrap">Security & MFA</button>
                    <button className="px-4 py-4 text-[10px] font-black text-slate-400 hover:text-indigo-950 transition-colors uppercase tracking-widest whitespace-nowrap">API & Integrations</button>
                    <button className="px-4 py-4 text-[10px] font-black text-slate-400 hover:text-indigo-950 transition-colors uppercase tracking-widest whitespace-nowrap">Notifications</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="widget-card p-8 border border-slate-200 shadow-sm bg-white"
                        >
                            <h3 className="font-black text-xs text-indigo-950 uppercase tracking-widest mb-8 border-l-4 border-primary pl-4">Institutional Profile</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Forensic Specialist Name</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" defaultValue="Jameson Carter" type="text" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" defaultValue="j.carter@axiom-forensics.gov" type="email" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department / Division</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" defaultValue="Chief Forensic Division - Tier 1" type="text" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Employee ID / Badge</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" defaultValue="AX-9921-88" type="text" />
                                </div>
                            </div>
                            <div className="mt-10 pt-8 border-t border-slate-50 flex justify-end">
                                <button className="bg-primary text-white px-10 py-3 rounded-xl font-black text-[11px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-[0.2em]">
                                    Update Identity
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="widget-card p-8 border border-slate-200 shadow-sm bg-slate-50/50 backdrop-blur-sm"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-xs text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-500 pl-4">Institutional API Access</h3>
                                <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest hover:text-blue-700 transition-colors">Regenerate Credentials</button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm group hover:border-primary/40 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-primary/5 transition-colors shadow-inner">
                                            <span className="material-symbols-outlined text-indigo-600 font-bold text-2xl">key</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-indigo-950 uppercase tracking-tight">Production API Key</p>
                                            <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">ax_live_9921_************************</p>
                                        </div>
                                    </div>
                                    <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-950 transition-all border border-transparent hover:border-slate-100">
                                        <span className="material-symbols-outlined text-xl font-black">content_copy</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="widget-card p-8 text-center border border-slate-200 shadow-lg relative overflow-hidden group bg-white"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-indigo-500"></div>
                            <div className="w-28 h-28 rounded-full bg-slate-100 mx-auto mb-6 overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-500 ring-1 ring-slate-100">
                                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYGXH-Y7qM6B0WrOgdEAIraa0uEGdrMvyif3YpJSxV6vOkoGxJDav8Bg7F8ZuRK0_i305calXJkPaKmOJulIhDDZuNdwquSrrKl0K6vhkesqe_C3Htgp8lpMeR-LsF3qYDDrP13xGCq10xfnIQSAv0pPz4RMdBUS72-HSUVOSk5NwLsLBVKiKxk1dg1o6D_B4aSiBCYFmmybkwWCxqB2A4BArHSaMjah6U6W_n_NxgASZYEKfxEr2j61RgkYbzNQYi_fI1lbi-dfs" alt="Profile" />
                            </div>
                            <h4 className="font-black text-xl text-indigo-950 tracking-tighter">Jameson Carter</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 opacity-80">AX-9921-88 • Tier 1 Specialist</p>
                            <button className="mt-8 w-full py-3 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] shadow-sm hover:shadow-md hover:border-slate-300">
                                Change Photograph
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="widget-card p-8 border-none shadow-2xl bg-indigo-950 text-white relative overflow-hidden group"
                        >
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-amber-400 text-xl font-black">workspace_premium</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 opacity-80">Institutional Plan</span>
                            </div>
                            <h4 className="font-black text-2xl mb-3 tracking-tight">Government Elite</h4>
                            <p className="text-xs text-indigo-200/80 font-bold leading-relaxed mb-8 uppercase tracking-wide">Unlimited sub-pixel queries, YOLOv11 structural mapping, and 256-bit audit trails.</p>
                            <button className="w-full py-3.5 bg-white text-indigo-950 rounded-xl text-[11px] font-black hover:bg-indigo-50 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/60 ring-4 ring-indigo-900/20 active:scale-95">
                                Admin Panel
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
