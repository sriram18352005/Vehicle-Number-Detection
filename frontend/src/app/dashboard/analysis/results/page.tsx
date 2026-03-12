"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/forensics/Header";
import { DocumentPreview, BoundingBox } from "@/components/forensics/DocumentPreview";
import { VerdictDisplay } from "@/components/forensics/VerdictDisplay";
import { PipelineStatus, PipelineStage } from "@/components/forensics/PipelineStatus";
import { FraudIndicators, FraudIndicator } from "@/components/forensics/FraudIndicators";
import { HeatmapViewer } from "@/components/forensics/HeatmapViewer";
import { ExtractedData } from "@/components/forensics/ExtractedData";
import { BoundingBoxFindings, BoxFinding } from "@/components/forensics/BoundingBoxFindings";
import { DocumentStandards } from "@/components/forensics/DocumentStandards";

function ResultsContent() {
    const searchParams = useSearchParams();
    const documentId = searchParams.get("id");
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const backendUrl = "http://127.0.0.1:8000";
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const handleSelectBox = (box: any) => {
        setSelectedBoxId(box.id);
        if (typeof box.page === 'number') {
            setCurrentPageIndex(box.page);
        }
    };

    useEffect(() => {
        if (documentId) {
            const fetchResults = async () => {
                try {
                    const response = await fetch(`${backendUrl}/api/v1/documents/${documentId}`);
                    if (!response.ok) throw new Error("Failed to fetch results");
                    const data = await response.json();
                    setAnalysisData(data);
                } catch (error) {
                    console.error("Results fetch error:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchResults();

            const interval = setInterval(() => {
                if (analysisData?.status === "PENDING" || analysisData?.status === "PROCESSING") {
                    fetchResults();
                } else if (analysisData) {
                    clearInterval(interval);
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [documentId, analysisData?.status]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Retrieving Forensic Dossier...</p>
                </div>
            </div>
        );
    }

    const isProcessing = analysisData?.status === "PENDING" || analysisData?.status === "PROCESSING";
    const forensic = analysisData?.forensic_results?.final_decision || {};
    const verdictValue = isProcessing ? null : (forensic.Verdict || forensic.status || analysisData?.verdict);

    // Map Backend Status to PipelineStage
    const mapStatusToStage = (status: string): PipelineStage => {
        switch (status) {
            case "PENDING": return "preprocessing";
            case "PROCESSING": return "forensic_analysis";
            case "COMPLETED": return "verdict";
            default: return "idle";
        }
    };

    // Map Backend Anomalies to FraudIndicator
    const indicators: FraudIndicator[] = forensic["Fraud Indicators"] ?
        forensic["Fraud Indicators"].map((ind: any, idx: number) => ({
            id: `ind-${idx}`,
            type: ind.status === "PASSED" ? "success" : "critical",
            label: ind.label,
            description: ind.message || `Verification ${ind.status.toLowerCase()}`,
            status: ind.status
        })) :
        (analysisData?.forensic_results?.anomalies || []).map((anom: any, idx: number) => ({
            id: `anom-${idx}`,
            type: anom.severity === "CRITICAL" ? "critical" : "warning",
            label: anom.type,
            description: anom.message,
            region: anom.region
        }));

    // Map YOLO and Forensic results to BoundingBox and BoxFinding
    const boundingBoxes: BoundingBox[] = (analysisData?.symbol_results || []).map((det: any, idx: number) => {
        const box = det.box_2d || det.bbox || [0, 0, 0, 0];
        let status: "valid" | "suspicious" | "fraud" = "valid";
        const rawStatus = (det.status || (det.confidence > 0.8 ? "valid" : "suspicious")).toLowerCase();
        if (rawStatus === "fraud" || rawStatus === "failure" || rawStatus === "forged" || rawStatus === "fake") status = "fraud";
        else if (rawStatus === "suspicious" || rawStatus === "warning") status = "suspicious";

        return {
            id: `det-${idx}`,
            x: box[0],
            y: box[1],
            width: box[2],
            height: box[3],
            label: det.label,
            status: status,
            category: det.category,
            reason: det.reason,
            page: det.page || 0
        };
    });

    const findings: BoxFinding[] = (analysisData?.symbol_results || []).map((det: any, idx: number) => ({
        id: `det-${idx}`,
        region: det.label,
        issue: det.reason || det.message || (det.confidence > 0.8 ? "Confirmed visual element" : "Low confidence match"),
        status: (det.status || (det.confidence > 0.8 ? "valid" : "suspicious")).toLowerCase() as any,
        page: det.page || 0,
        coordinates: {
            x: det.box_2d ? det.box_2d[0] : 0,
            y: det.box_2d ? det.box_2d[1] : 0,
            w: det.box_2d ? det.box_2d[2] : 0,
            h: det.box_2d ? det.box_2d[3] : 0
        }
    }));

    // Derived viewUrls from preview_path (heuristic if not explicitly in JSON)
    const viewUrls = (analysisData?.symbol_results || []).reduce((acc: string[], det: any) => {
        if (typeof det.page === 'number' && !acc.includes(det.page)) {
            acc.push(det.page);
        }
        return acc;
    }, [0]).sort().map((p: number) => `${backendUrl}/api/v1/documents/preview/${documentId}/page_${p}.png`);

    const activeImageUrl = viewUrls[currentPageIndex] || (analysisData?.file_url ? `${backendUrl}${analysisData.file_url}` : null);

    return (
        <div className="min-h-screen bg-axiom-bg text-axiom-text pb-12">
            <Header />

            <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - 8/12 */}
                    <div className="lg:col-span-8 space-y-6">
                        <DocumentPreview
                            imageUrl={activeImageUrl}
                            pageUrls={viewUrls}
                            currentPageIndex={currentPageIndex}
                            onPageChange={setCurrentPageIndex}
                            activeBoxId={selectedBoxId}
                            isScanning={isProcessing}
                            boundingBoxes={boundingBoxes}
                            showBoxes={true}
                            documentType={analysisData?.document_type}
                            verdict={verdictValue}
                            scores={forensic.scores}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <HeatmapViewer
                                imageUrl={activeImageUrl}
                                isAnalyzing={isProcessing}
                            />
                            <ExtractedData
                                data={forensic["Extracted Text"] || analysisData?.ocr_results?.extracted_data || null}
                                documentType={analysisData?.document_type || "Unknown"}
                            />
                        </div>

                        <DocumentStandards
                            documentType={analysisData?.document_type || "Unknown"}
                        />
                    </div>

                    {/* Right Column - 4/12 */}
                    <div className="lg:col-span-4 space-y-6">
                        <VerdictDisplay
                            verdict={verdictValue}
                            reasons={analysisData?.forensic_results?.reason ? [analysisData.forensic_results.reason] : []}
                            isProcessing={isProcessing}
                            confidenceScore={forensic["Confidence Score"] || analysisData?.confidence_score}
                            anomalyScore={forensic["ML Anomaly Score"]}
                            mlScore={forensic["ML Classification"]}
                        />

                        <PipelineStatus
                            currentStage={mapStatusToStage(analysisData?.status)}
                        />

                        <FraudIndicators
                            indicators={indicators}
                        />

                        <BoundingBoxFindings
                            findings={findings}
                            onClickFinding={handleSelectBox}
                        />
                    </div>
                </div>
            </main >

            {/* Footer / Actions */}
            < div className="max-w-7xl mx-auto px-6 mt-6" >
                <div className="glass-panel p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/analysis" className="px-6 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-semibold">
                            Return to Analysis
                        </Link>
                        <button className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-semibold shadow-lg shadow-primary/20">
                            Download Forensic PDF
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Case Identifier</p>
                        <p className="text-lg font-bold font-mono">AX-{documentId || "PENDING"}</p>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default function AnalysisResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Neural Report...</p>
                </div>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
