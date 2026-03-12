"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/forensics/Header";
import { DocumentUpload } from "@/components/forensics/DocumentUpload";
import { PipelineStatus } from "@/components/forensics/PipelineStatus";
import { DocumentViewer } from "@/components/forensics/DocumentViewer";
import { AnalysisSidebar } from "@/components/forensics/AnalysisSidebar";
import { useForensicAnalysis } from "@/hooks/useForensicAnalysis";
import { Shield, Landmark, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BatchDashboard } from "@/components/forensics/BatchDashboard";

export default function AnalysisPage() {
    const {
        isProcessing,
        currentStage,
        imageUrl,
        result,
        batchItems,
        isBatchMode,
        processDocument,
        processBatch,
        setMasterTemplate,
        deleteMasterTemplate,
        getMasterStatus,
        reset,
        getBatchSummary,
        setResult
    } = useForensicAnalysis();

    const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
    const [selectedBank, setSelectedBank] = useState("AUTO");
    const [analysisMode, setAnalysisMode] = useState<"identity" | "finance">("identity");
    const [viewingBatchItem, setViewingBatchItem] = useState(false);

    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

    const handleSelectBox = (box: any) => {
        setSelectedBoxId(box.id);
    };

    const banks = [
        { id: "AUTO", name: "Auto Detect" },
        { id: "HDFC", name: "HDFC" },
        { id: "SBI", name: "SBI" },
        { id: "AXIS", name: "Axis" },
        { id: "ICICI", name: "ICICI" },
        { id: "IOB", name: "IOB" },
        { id: "KOTAK", name: "Kotak" }
    ];

    const handleFileSelect = (file: File) => {
        setViewingBatchItem(false);
        processDocument(file, selectedBank);
    };

    const handleFolderSelect = (files: File[]) => {
        setViewingBatchItem(false);
        processBatch(files, selectedBank);
    };

    const handleViewDetails = (itemResult: any) => {
        setResult(itemResult);
        setViewingBatchItem(true);
    };

    const handleBackToBatch = () => {
        setViewingBatchItem(false);
    };

    return (
        <div className="min-h-screen bg-axiom-bg text-axiom-text pb-6">
            <Header />

            <main className="max-w-[1600px] mx-auto px-6 mt-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-end">
                        <div className="flex bg-secondary/30 p-1 rounded-xl border border-border h-fit">
                            <button
                                onClick={() => setAnalysisMode("identity")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    analysisMode === "identity"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <Shield className="h-4 w-4" />
                                Identity
                            </button>
                            <button
                                onClick={() => setAnalysisMode("finance")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    analysisMode === "finance"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <Landmark className="h-4 w-4" />
                                Finance
                            </button>
                        </div>
                    </div>

                    {/* Bank Selection Tabs */}
                    {analysisMode === "finance" && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <div className="w-1 h-3 bg-primary rounded-full" />
                                    Active Validation Model: <span className="text-foreground">{selectedBank}</span>
                                </h3>
                            </div>
                            <div className="flex items-center gap-3 p-1.5 bg-secondary/20 rounded-2xl border border-border/50 overflow-x-auto no-scrollbar py-3">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 border-r border-border/50 mr-2">Templates</span>
                                {banks.map((bank) => (
                                    <button
                                        key={bank.id}
                                        onClick={() => setSelectedBank(bank.id)}
                                        className={cn(
                                            "whitespace-nowrap flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border",
                                            selectedBank === bank.id
                                                ? "bg-primary/10 text-primary border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-105"
                                                : "bg-background/20 text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-transparent hover:border-border/50"
                                        )}
                                    >
                                        {bank.id === "AUTO" ? (
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20">
                                                <Shield className="h-3 w-3 text-primary" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center overflow-hidden border border-border/30">
                                                <img
                                                    src={`/logos/${bank.id.toLowerCase()}.png`}
                                                    alt={bank.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}
                                        {bank.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Forensic Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 h-[calc(100vh-250px)] min-h-[750px] relative">

                    {/* Left - Workspace (8 cols) */}
                    <div className="lg:col-span-8 h-full flex flex-col gap-4 overflow-hidden">
                        {/* 1. Control Deck: Upload */}
                        <section className="glass-panel p-3 border-primary/20 bg-primary/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield className="w-12 h-12 text-primary" />
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <div className="w-1 h-3 bg-primary rounded-full" />
                                    Document Entry
                                </h3>
                                {isBatchMode && viewingBatchItem && (
                                    <button
                                        onClick={handleBackToBatch}
                                        className="text-[10px] font-bold text-primary hover:underline px-2 py-1 rounded bg-primary/10"
                                    >
                                        ← Back to Batch Results
                                    </button>
                                )}
                            </div>

                            <DocumentUpload
                                onFileSelect={handleFileSelect}
                                onFolderSelect={handleFolderSelect}
                                onSetMaster={(file) => setMasterTemplate(file, selectedBank)}
                                onDeleteMaster={deleteMasterTemplate}
                                getMasterStatus={getMasterStatus}
                                isProcessing={isProcessing}
                                activeBank={selectedBank}
                            />

                            {analysisMode === "finance" && selectedBank === "AUTO" && !isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3"
                                >
                                    <AlertTriangle className="w-5 h-5 text-warning animate-pulse" />
                                    <p className="text-xs font-bold text-warning uppercase tracking-tight">
                                        Please select a bank template above to enable fraud detection.
                                    </p>
                                </motion.div>
                            )}
                        </section>

                        <div className="flex-1 min-h-0">
                            {isBatchMode && !viewingBatchItem ? (
                                <BatchDashboard
                                    summary={getBatchSummary()}
                                    items={batchItems}
                                    onViewDetails={handleViewDetails}
                                    activeBank={selectedBank}
                                />
                            ) : (
                                <DocumentViewer
                                    fileUrl={imageUrl}
                                    viewUrls={result.viewUrls}
                                    isScanning={isProcessing}
                                    boundingBoxes={result.boundingBoxes}
                                    showBoxes={showBoundingBoxes && !isProcessing}
                                    verdict={result.verdict}
                                    activeBoxId={selectedBoxId}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right - Analysis & Controls (4 cols) */}
                    <div className="lg:col-span-4 h-full flex flex-col gap-6 overflow-y-auto no-scrollbar pr-1 pb-10">
                        {/* 2. Intelligent Pipeline Tracker */}
                        <PipelineStatus
                            currentStage={currentStage}
                            isProcessing={isProcessing}
                            mode={analysisMode}
                        />

                        {/* 3. Detailed Analysis Detail Deck */}
                        <AnalysisSidebar
                            result={result}
                            isProcessing={isProcessing}
                            documentType={result.documentType || "Unknown"}
                            selectedBank={selectedBank}
                            onSelectBox={handleSelectBox}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
