"use client";

import Link from "next/link";
import { ShieldCheck, Menu, User } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 bg-white/80 backdrop-blur-md border-b border-slate-200"
        >
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/30">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                    AL <span className="text-blue-600">AUTHENTICATOR</span>
                </span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                <Link href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</Link>
                <Link href="#explainability" className="hover:text-blue-600 transition-colors">Explainability</Link>
                <Link href="#compliance" className="hover:text-blue-600 transition-colors">Compliance</Link>
                <Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            </div>

            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                    Client Login
                </Link>
                <Link
                    href="/dashboard/analysis"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                    ENTERPRISE ACCESS
                </Link>
                <Menu className="w-6 h-6 md:hidden text-slate-800 cursor-pointer" />
            </div>
        </motion.nav>
    );
}
