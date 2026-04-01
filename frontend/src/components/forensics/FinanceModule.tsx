"use client";

import React, { useState } from "react";
import { useForensicAnalysis } from "@/hooks/useForensicAnalysis";
import { DocumentUpload } from "./DocumentUpload";
import { PipelineStatus } from "./PipelineStatus";
import { AnalysisSidebar } from "./AnalysisSidebar";
import { DocumentPreview } from "./DocumentPreview";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORTED_BANKS = ["AUTO", "ICICI", "HDFC", "AXIS", "SBI", "KOTAK"];

export function FinanceModule() {
    const [selectedBank, setSelectedBank] = useState("AUTO");
    const [showBankDropdown, setShowBankDropdown] = useState(false);

    const {
        isProcessing,
        currentStage,
        result,
        imageUrl,
        processDocument,
        reset,
        setMasterTemplate,
        deleteMasterTemplate,
        getMasterStatus
    } = useForensicAnalysis();

    const handleUpload = (file: File) => {
        processDocument(file, selectedBank, "finance");
    };

    const hasResult = !!result.verdict;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {!hasResult && !isProcessing && (
                <div className="max-w-4xl mx-auto py-12">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                            <Landmark className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-3">Financial Audit</h1>
                        <p className="text-muted-foreground max-w-lg mx-auto font-medium">
                            Upload bank statements for automated forensic integrity checks, transaction analysis, and structural validation.
                        </p>
                    </div>

                    {/* Bank Selection */}
                    <div className="max-w-md mx-auto mb-8 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block text-center">
                            Target Institution Model
                        </label>
                        <button
                            onClick={() => setShowBankDropdown(!showBankDropdown)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-secondary/40 border border-border/50 rounded-2xl hover:border-primary/40 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Landmark className="w-5 h-5 text-primary" />
                                <span className="font-bold text-lg">{selectedBank}</span>
                            </div>
                            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", showBankDropdown && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {showBankDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-1 p-2">
                                        {SUPPORTED_BANKS.map(bank => (
                                            <button
                                                key={bank}
                                                onClick={() => {
                                                    setSelectedBank(bank);
                                                    setShowBankDropdown(false);
                                                }}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-sm font-bold transition-all text-left flex items-center justify-between",
                                                    selectedBank === bank ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-white"
                                                )}
                                            >
                                                {bank}
                                                {selectedBank === bank && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <DocumentUpload
                        onFileSelect={handleUpload}
                        isProcessing={isProcessing}
                        activeBank={selectedBank}
                        onSetMaster={(file) => setMasterTemplate(file, selectedBank)}
                        onDeleteMaster={(bank) => deleteMasterTemplate(bank)}
                        getMasterStatus={(bank) => getMasterStatus(bank)}
                    />
                </div>
            )}

            {isProcessing && (
                <div className="max-w-2xl mx-auto py-20 space-y-8">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                        <div className="relative">
                            <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Audit Engine Active</h3>
                            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-40">Reconciling transaction logic</p>
                        </div>
                    </div>
                    <PipelineStatus currentStage={currentStage} />
                </div>
            )}

            <AnimatePresence>
                {hasResult && !isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 xl:grid-cols-12 gap-8"
                    >
                        {/* Left: Document Viewer */}
                        <div className="xl:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original Financial Instrument</h3>
                                </div>
                                <button
                                    onClick={reset}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                                >
                                    New Analysis
                                </button>
                            </div>
                            <div className="sticky top-24">
                                <DocumentPreview
                                    imageUrl={imageUrl || ""}
                                    isScanning={isProcessing}
                                    isPdf={result.isPdf}
                                    pageUrls={result.viewUrls}
                                    verdict={result.verdict}
                                    scores={result.scores}
                                />
                            </div>
                        </div>

                        {/* Right: Forensic Intelligence */}
                        <div className="xl:col-span-4">
                            <AnalysisSidebar
                                result={result}
                                isProcessing={isProcessing}
                                documentType={result.documentType || "BANK_STATEMENT"}
                                selectedBank={selectedBank}
                                analysisMode="finance"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
