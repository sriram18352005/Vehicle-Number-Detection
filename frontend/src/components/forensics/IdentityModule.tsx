"use client";

import React, { useState } from "react";
import { useForensicAnalysis } from "@/hooks/useForensicAnalysis";
import { DocumentUpload } from "./DocumentUpload";
import { PipelineStatus } from "./PipelineStatus";
import { AnalysisSidebar } from "./AnalysisSidebar";
import { DocumentPreview } from "./DocumentPreview";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, RefreshCw } from "lucide-react";

export function IdentityModule() {
    const {
        isProcessing,
        currentStage,
        result,
        imageUrl,
        processDocument,
        reset
    } = useForensicAnalysis();

    const handleUpload = (file: File) => {
        processDocument(file, undefined, "identity");
    };

    const hasResult = !!result.verdict;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {!hasResult && !isProcessing && (
                <div className="max-w-4xl mx-auto py-12">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-3">Identity Verification</h1>
                        <p className="text-muted-foreground max-w-lg mx-auto font-medium">
                            Upload government-issued IDs for multi-spectral forensic analysis, OCR extraction, and biometric tamper detection.
                        </p>
                    </div>
                    <DocumentUpload
                        onFileSelect={handleUpload}
                        isProcessing={isProcessing}
                        activeBank="AUTO"
                    />
                </div>
            )}

            {isProcessing && (
                <div className="max-w-2xl mx-auto py-20 space-y-8">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                        <div className="relative">
                            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Forensic Agent Active</h3>
                            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-40">Analyzing substrate integrity</p>
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
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original Substrate Scan</h3>
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
                                documentType={result.documentType || "IDENTITY"}
                                analysisMode="identity"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
