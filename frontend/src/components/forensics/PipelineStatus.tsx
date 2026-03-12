import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStage =
    | "idle"
    | "preprocessing"
    | "classification"
    | "ocr_extraction"
    | "rule_validation"
    | "forensic_analysis"
    | "fraud_detection"
    | "verdict"
    // Finance specific aliases
    | "bank_discovery"
    | "ledger_parsing"
    | "arithmetic_check"
    | "narration_intel"
    | "embedded_forensics";

interface PipelineStatusProps {
    currentStage: PipelineStage;
    isProcessing?: boolean;
    mode?: "identity" | "finance";
}

const identityStages: { id: PipelineStage; label: string; description: string }[] = [
    { id: "preprocessing", label: "Pre-Processing", description: "Noise removal, rotation correction" },
    { id: "classification", label: "Classification", description: "Document type detection" },
    { id: "ocr_extraction", label: "OCR & QR", description: "Text and barcode extraction" },
    { id: "rule_validation", label: "Rule Validation", description: "Format and checksum verification" },
    { id: "forensic_analysis", label: "Forensic Analysis", description: "ELA, noise, compression detection" },
    { id: "fraud_detection", label: "Fraud Detection", description: "Bounding box localization" },
    { id: "verdict", label: "Verdict Engine", description: "Final decision computation" },
];

const financeStages: { id: PipelineStage; label: string; description: string }[] = [
    { id: "preprocessing", label: "Pre-Processing", description: "Noise removal, cleaning" },
    { id: "classification", label: "Bank Discovery", description: "IFSC and branch identification" },
    { id: "ocr_extraction", label: "Statement Parsing", description: "Transaction table mapping" },
    { id: "rule_validation", label: "Ledger Validation", description: "Arithmetic balance re-computation" },
    { id: "forensic_analysis", label: "Narration Intelligence", description: "Syntax and behavioral rules" },
    { id: "fraud_detection", label: "Embedded Forensics", description: "Fonts, metadata & vector checks" },
    { id: "verdict", label: "Decision Engine", description: "Final bank-specific verdict" },
];

export function PipelineStatus({ currentStage, isProcessing = false, mode = "identity" }: PipelineStatusProps) {
    const stages = mode === "finance" ? financeStages : identityStages;

    const getStageIndex = (stage: PipelineStage) => {
        if (stage === "idle") return -1;
        // Map alias stages to core indices for polling consistency
        const index = stages.findIndex(s => s.id === stage);
        if (index !== -1) return index;

        // Fallback mapping for generic hook stages to finance labels
        const fallbackMap: Record<string, number> = {
            "preprocessing": 0,
            "classification": 1,
            "ocr_extraction": 2,
            "rule_validation": 3,
            "forensic_analysis": 4,
            "fraud_detection": 5,
            "verdict": 6
        };
        return fallbackMap[stage] ?? -1;
    };

    const currentIndex = getStageIndex(currentStage);

    return (
        <div className="glass-panel p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full bg-primary", isProcessing && "animate-pulse")} />
                {mode === "finance" ? "Financial Audit Pipeline" : "Analysis Pipeline"}
            </h2>

            <div className="space-y-1">
                {stages.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div
                            key={stage.id}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300",
                                (isCurrent && isProcessing) && "bg-primary/10 border border-primary/20",
                                isCompleted && "opacity-70"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                isCompleted && "bg-success/20 text-success",
                                (isCurrent && isProcessing) && "bg-primary/20 text-primary",
                                (isPending || (isCurrent && !isProcessing)) && "bg-secondary text-muted-foreground"
                            )}>
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (isCurrent && isProcessing) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (isCurrent && !isProcessing) ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Circle className="w-3 h-3" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm font-medium truncate",
                                    (isPending && !isCurrent) && "text-muted-foreground"
                                )}>
                                    {stage.label}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {stage.description}
                                </p>
                            </div>

                            {(isCurrent && isProcessing) && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                    <span className="text-[10px] font-black text-primary tracking-tighter">
                                        ANALYZING
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
