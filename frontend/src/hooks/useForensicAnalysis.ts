import { useState, useCallback } from "react";
import { PipelineStage } from "@/components/forensics/PipelineStatus";
import { AnalysisResult, BoundingBox, FraudIndicator, BoxFinding } from "@/data/documents/types";
import { toast } from "sonner";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: any, retries = 7, backoff = 1500): Promise<Response> => {
    try {
        const response = await fetch(url, options);
        // Also retry on 5xx errors which indicate temporary server struggle
        if (!response.ok && response.status >= 500) {
            throw new Error(`Server Error: ${response.status}`);
        }
        return response;
    } catch (err: any) {
        if (retries > 0) {
            const skipRetry = err.message?.includes("401") || err.message?.includes("403");
            if (!skipRetry) {
                console.log(`Fetch attempt failed: ${err.message}. Retrying in ${backoff}ms... (${retries} left)`);
                await sleep(backoff);
                return fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
        }
        throw err;
    }
};

export interface BatchItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'invalid';
    progress: number;
    result: AnalysisResult | null;
    error?: string;
}

export interface BatchSummary {
    total: number;
    processed: number;
    genuine: number;
    suspicious: number;
    fraudulent: number;
    invalid: number;
    avgScore: number;
}

export function useForensicAnalysis() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult>({
        verdict: null,
        reasons: [],
        documentType: null,
        extractedData: null,
        boundingBoxes: [],
        fraudIndicators: [],
        boxFindings: [],
        isPdf: false,
        viewUrls: [],
        checkpoints: [],
    });

    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [isBatchMode, setIsBatchMode] = useState(false);

    const processSingleFile = async (file: File, bankName?: string, batchId?: string): Promise<AnalysisResult> => {
        // Create preview URL (only for non-batch or first item)
        if (!batchId) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
        }

        const formData = new FormData();
        formData.append("file", file);
        if (bankName && bankName !== "AUTO") {
            formData.append("bank_name", bankName);
        }

        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const uploadRes = await fetchWithRetry("http://127.0.0.1:8000/api/v1/documents/upload", {
            method: "POST",
            body: formData,
            headers: headers
        });

        if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}));
            throw new Error(errorData.detail || "Upload failed");
        }

        const uploadData = await uploadRes.json();
        const documentId = uploadData.id;

        // Poll for results
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 90;
            const API_BASE = "http://127.0.0.1:8000";

            const pollInterval = setInterval(async () => {
                try {
                    attempts++;
                    const pollRes = await fetchWithRetry(`${API_BASE}/api/v1/documents/${documentId}?t=${Date.now()}`, {
                        headers: headers
                    });

                    if (!pollRes.ok) throw new Error(`Server responded with ${pollRes.status}`);

                    const data = await pollRes.json();

                    if (data.status === 'COMPLETED') {
                        clearInterval(pollInterval);

                        const forensic = data.forensic_results?.final_decision || {};
                        const anomalies = data.forensic_results?.anomalies || [];
                        const symbolResults = data.symbol_results || [];
                        const sanitizeUrl = (url: string | null) => {
                            if (!url) return null;
                            if (url.startsWith("http")) return url;
                            return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
                        };

                        const analysisResult: AnalysisResult = {
                            verdict: forensic.status as any || data.verdict as any,
                            reasons: forensic.reasons || [data.reason || "Analysis completed successfully"],
                            documentType: data.document_type as any,
                            extractedData: forensic["Extracted Text"] || data.ocr_results?.extracted_data || null,
                            scores: {
                                authenticity_score: data.forensic_results?.final_decision?.scores || data.confidence_score || 0,
                                mathematical_integrity: 100,
                                pdf_authenticity: 100,
                                layout_anomaly: 100,
                                forgery_probability: 0
                            },
                            boundingBoxes: symbolResults.map((s: any, i: number) => {
                                const box = s.box_2d || s.bbox || [0, 0, 0, 0];
                                return {
                                    id: s.id || `box-${i}`,
                                    x: box[0],
                                    y: box[1],
                                    width: box[2],
                                    height: box[3],
                                    label: s.label,
                                    status: (s.status || (s.confidence > 0.8 ? 'valid' : 'suspicious')).toLowerCase() as any,
                                    type: s.type || 'BOX'
                                };
                            }),
                            fraudIndicators: [
                                ...(data.forensic_results?.checkpoints || []).map((cp: any) => ({
                                    id: cp.name,
                                    type: cp.result === 1.0 ? 'success' : 'critical',
                                    label: cp.name,
                                    description: cp.result === 1.0
                                        ? `Passed with ${cp.weight}% weight contribution.`
                                        : `Failed ${cp.weight}% weight. Potential fraud detected.`,
                                    category: cp.name.toUpperCase().includes("NAME") ? "STRUCTURAL" : "LOGICAL"
                                })),
                                ...(data.forensic_results?.final_decision?.["Fraud Indicators"] || []).map((fi: any) => ({
                                    id: fi.label,
                                    type: fi.status === "FAILED" ? 'critical' : 'success',
                                    label: fi.label,
                                    description: fi.message,
                                    category: fi.category_id
                                }))
                            ],
                            boxFindings: [],
                            isPdf: file.type === 'application/pdf',
                            viewUrls: (data.view_urls || []).map((url: string) => sanitizeUrl(url)),
                            checkpoints: data.forensic_results?.final_decision?.checkpoints || [],
                            ocrText: data.forensic_results?.ocr_text || data.ocr_results?.text || '',
                            is_checkpoint_based: data.forensic_results?.final_decision?.is_checkpoint_based || false,
                            master_template_used: data.forensic_results?.final_decision?.master_template_used || false
                        };

                        if (batchId) {
                            setBatchItems(prev => prev.map(item =>
                                item.id === batchId
                                    ? { ...item, status: 'completed', progress: 100, result: analysisResult }
                                    : item
                            ));
                        }

                        // NEW: Explicit Toast Notification for Blank/Irrelevant Documents
                        const blankAnomaly = anomalies.find((a: any) => a.type === "BLANK_OR_IRRELEVANT");
                        if (blankAnomaly && !batchId) {
                            toast.error(blankAnomaly.message || "Blank or irrelevant document detected", {
                                duration: 15000, // 15 seconds as requested
                            });
                        }

                        resolve(analysisResult);

                    } else if (data.status === 'INVALID_DOCUMENT') {
                        clearInterval(pollInterval);
                        const errorMsg = data.forensic_results?.anomalies?.[0]?.message || "Invalid or irrelevant bank statement uploaded.";
                        if (!batchId) {
                            toast.error(errorMsg, {
                                duration: 15000,
                            });
                        }
                        if (batchId) {
                            setBatchItems(prev => prev.map(item =>
                                item.id === batchId ? { ...item, status: 'invalid', error: errorMsg } : item
                            ));
                            // Resolve instead of reject for batch items to prevent loud dev overlays
                            resolve({ verdict: 'INVALID', reasons: [errorMsg], checkpoints: [], scores: { authenticity_score: 0, mathematical_integrity: 0, pdf_authenticity: 0, layout_anomaly: 0, forgery_probability: 100 } } as any);
                        }
                        else {
                            reject(new Error(errorMsg));
                        }
                    } else if (data.status === 'FAILED') {
                        clearInterval(pollInterval);
                        const errorMsg = data.forensic_results?.anomalies?.[0]?.message || "Analysis failed";
                        if (batchId) {
                            setBatchItems(prev => prev.map(item =>
                                item.id === batchId ? { ...item, status: 'failed', error: errorMsg } : item
                            ));
                            resolve({ verdict: 'FAILED', reasons: [errorMsg], checkpoints: [], scores: { authenticity_score: 0, mathematical_integrity: 0, pdf_authenticity: 0, layout_anomaly: 0, forgery_probability: 100 } } as any);
                        } else {
                            reject(new Error(errorMsg));
                        }
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        reject(new Error("Timeout during analysis"));
                    }
                } catch (err: any) {
                    clearInterval(pollInterval);
                    reject(err);
                }
            }, 2000);
        });
    };

    const processDocument = useCallback(async (file: File, bankName?: string) => {
        setIsProcessing(true);
        setIsBatchMode(false);
        setCurrentStage("preprocessing");

        try {
            const res = await processSingleFile(file, bankName);
            setResult(res);
            setCurrentStage("verdict");
        } catch (err: any) {
            toast.error(err.message || "Failed to analyze document");
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const processBatch = useCallback(async (files: File[], bankName?: string) => {
        setIsProcessing(true);
        setIsBatchMode(true);
        const newBatchItems: BatchItem[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'pending',
            progress: 0,
            result: null
        }));
        setBatchItems(newBatchItems);

        // Process sequentially for stability (Step 2 & 9)
        for (const item of newBatchItems) {
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing', progress: 10 } : i));
            try {
                await processSingleFile(item.file, bankName, item.id);
            } catch (err) {
                // Silenced to avoid loud dev errors; audit results are elegantly handled in the Batch UI table.
                console.warn(`Batch item ${item.id} validation result:`, err);
            }
        }
        setIsProcessing(false);
    }, []);

    const deleteMasterTemplate = useCallback(async (bankName: string) => {
        try {
            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`http://127.0.0.1:8000/api/v1/documents/master/${bankName}`, {
                method: "DELETE",
                headers: headers
            });

            if (!res.ok) throw new Error("Deletion failed");
            toast.success(`${bankName} Master Template deleted`);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete master template");
        }
    }, []);

    const getMasterStatus = useCallback(async (bankName: string) => {
        try {
            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`http://127.0.0.1:8000/api/v1/documents/master/${bankName}`, {
                headers: headers
            });
            return await res.json();
        } catch (err) {
            return { exists: false };
        }
    }, []);

    const setMasterTemplate = useCallback(async (file: File, bankName: string) => {
        setIsProcessing(true);
        setCurrentStage("preprocessing");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bank_name", bankName);

            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetchWithRetry("http://127.0.0.1:8000/api/v1/documents/master/upload", {
                method: "POST",
                body: formData,
                headers: headers
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "Master template upload failed");
            }

            toast.success(`${bankName} Master Template updated successfully`);
        } catch (err: any) {
            toast.error(err.message || "Failed to set master template");
            throw err;
        } finally {
            setIsProcessing(false);
            setCurrentStage("idle");
        }
    }, []);

    const reset = useCallback(() => {
        setIsProcessing(false);
        setIsBatchMode(false);
        setCurrentStage("idle");
        setImageUrl(null);
        setBatchItems([]);
        setResult({
            verdict: null,
            reasons: [],
            documentType: null,
            extractedData: null,
            boundingBoxes: [],
            fraudIndicators: [],
            boxFindings: [],
            isPdf: false,
            viewUrls: [],
            checkpoints: [],
        });
    }, []);

    const getBatchSummary = (): BatchSummary => {
        const completed = batchItems.filter(i => i.status === 'completed' && i.result);
        const processedItems = batchItems.filter(i => i.status === 'completed' || i.status === 'failed' || i.status === 'invalid');
        const scores = completed.map(i => i.result?.scores?.authenticity_score || 0);

        return {
            total: batchItems.length,
            processed: processedItems.length,
            genuine: completed.filter(i => i.result?.verdict === 'GENUINE' || i.result?.verdict === 'REAL' || i.result?.verdict === 'VERIFIED').length,
            suspicious: completed.filter(i => i.result?.verdict === 'SUSPICIOUS').length,
            fraudulent: completed.filter(i => i.result?.verdict === 'FAKE' || i.result?.verdict === 'LIKELY FORGED').length,
            invalid: batchItems.filter(i => i.status === 'invalid').length,
            avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        };
    };

    return {
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
    };
}
