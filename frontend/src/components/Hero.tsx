"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative pt-48 pb-32 overflow-hidden bg-white">
            {/* Subtle Institutional Gradients */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />

            <div className="container mx-auto px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">FORENSIC NODE V4.2 ACTIVE</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.05] mb-8">
                            Trusted AI <br />
                            <span className="text-blue-600">Document</span> <br />
                            Authentication <br />
                            System
                        </h1>
                        <p className="text-slate-500 text-lg max-w-lg mb-12 leading-relaxed font-medium">
                            Experience the precision of laboratory-grade document analysis.
                            Our Axiom-driven engine delivers immutable forensic clarity for
                            global financial ecosystems.
                        </p>

                        <div className="flex items-center gap-6">
                            <Link
                                href="/dashboard/analysis"
                                className="px-10 py-5 bg-slate-900 text-white rounded-md font-black text-xs tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 uppercase flex items-center gap-3"
                            >
                                Start Forensic Audit
                            </Link>
                            <button className="flex items-center gap-2 text-xs font-black tracking-widest text-blue-600 hover:text-blue-700 transition-colors uppercase">
                                FSYN Framework <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Visual Group */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* Mockup Frame */}
                        <div className="relative z-10 bg-white rounded-3xl p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-sm border-2 border-blue-200" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-20 opacity-40">
                                <div className="h-0.5 w-full bg-blue-500/20" />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-24 bg-slate-50 rounded-xl" />
                                    <div className="h-24 bg-slate-50 rounded-xl" />
                                    <div className="h-24 bg-slate-50 rounded-xl" />
                                </div>
                            </div>

                            {/* Score Overlay */}
                            <div className="absolute bottom-10 right-10 bg-white p-6 rounded-2xl shadow-xl border border-slate-50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 leading-none">Authenticity Index</p>
                                <h3 className="text-4xl font-black text-slate-900 tabular-nums">99.982%</h3>
                            </div>

                            {/* Scanning Animation */}
                            <motion.div
                                animate={{ y: [0, 400] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/30 z-20"
                            >
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-500/5 to-transparent" />
                            </motion.div>
                        </div>

                        {/* Background Accents */}
                        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-50 rounded-full blur-[100px] pointer-events-none -z-10" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] pointer-events-none -z-10" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
