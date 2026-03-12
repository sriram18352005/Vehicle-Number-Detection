"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Search, BarChart3, Fingerprint, Lock } from "lucide-react";

const features = [
    {
        icon: <Zap className="w-6 h-6 text-blue-400" />,
        title: "Real-Time Analysis",
        description: "Stateless processing pipeline delivering sub-second forensic insights without data persistence."
    },
    {
        icon: <Shield className="w-6 h-6 text-blue-400" />,
        title: "Pixel Integrity",
        description: "Multi-layered ELA and noise analysis detecting digital manipulation at the sub-pixel level."
    },
    {
        icon: <Search className="w-6 h-6 text-blue-400" />,
        title: "Structural Verification",
        description: "YOLO-driven symbol detection for official stamps, signatures, and holographic security elements."
    },
    {
        icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
        title: "Explainable AI (XAI)",
        description: "Transparent scoring mechanisms providing clear rationale for every VERIFIED or FAKE verdict."
    },
    {
        icon: <Fingerprint className="w-6 h-6 text-blue-400" />,
        title: "ID Specialization",
        description: "Algorithmic validation for Aadhaar checksums, MRZ strings, and international passport zones."
    },
    {
        icon: <Lock className="w-6 h-6 text-blue-400" />,
        title: "Audit Grade",
        description: "Cryptographically-linked action logs and legally-auditable forensic PDF reporting."
    }
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-slate-950/50">
            <div className="container mx-auto px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Enterprise-Ready Intelligence</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Engineered for high-stakes environments where accuracy and security are non-negotiable.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
