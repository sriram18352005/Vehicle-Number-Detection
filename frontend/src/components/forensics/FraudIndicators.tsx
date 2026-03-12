import { AlertTriangle, AlertOctagon, CheckCircle, Info, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FraudIndicator {
    id: string;
    type: "critical" | "warning" | "info" | "passed" | "success";
    label: string;
    description: string;
    region?: string;
    category?: string;
    status?: "PASSED" | "FAILED";
}

interface FraudIndicatorsProps {
    indicators: FraudIndicator[];
}

export function FraudIndicators({ indicators }: FraudIndicatorsProps) {
    const passedCount = indicators.filter(i => (i.type === "passed" || i.type === "success")).length;
    const totalCount = indicators.length;
    const healthPercent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100;

    // Define mandatory categories
    const categories = [
        { id: "STRUCTURAL", label: "Structural Checks", description: "Font, alignment, and branding" },
        { id: "LOGICAL", label: "Logical Checks", description: "Arithmetic and chronology" },
        { id: "FORMAT", label: "Format Checks", description: "Account and date standards" },
        { id: "FORENSIC", label: "Forensic Checks", description: "Metadata and timestamps" }
    ];

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                    <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-semibold text-lg tracking-tight">Forensic Checkpoints</h2>
                    <p className="text-xs text-muted-foreground">Categorized multi-spectral audit</p>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Trust Integrity Index</span>
                    <span className={cn(
                        "text-xs font-black",
                        healthPercent > 80 ? "text-success" : healthPercent > 50 ? "text-warning" : "text-destructive"
                    )}>{healthPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5 p-0 border border-border">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000 ease-out rounded-full",
                            healthPercent > 80 ? "bg-success shadow-[0_0_12px_rgba(34,197,94,0.4)]" :
                                healthPercent > 50 ? "bg-warning shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                        )}
                        style={{ width: `${healthPercent}%` }}
                    />
                </div>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
                {categories.map((cat) => {
                    const catIndicators = indicators.filter(i => i.category === cat.id);
                    // Handle case where category might be mapped to full label
                    const filtered = catIndicators.length > 0 ? catIndicators : indicators.filter(i => i.label?.toUpperCase().includes(cat.id));

                    const isFailed = filtered.some(i => i.type === "critical");

                    return (
                        <div key={cat.id} className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{cat.label}</h3>
                                    <p className="text-[9px] text-muted-foreground/60">{cat.description}</p>
                                </div>
                                {filtered.length > 0 && (
                                    <span className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full",
                                        isFailed ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-success/10 text-success border border-success/20"
                                    )}>
                                        {isFailed ? "VIOLATION" : "SECURE"}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {filtered.length > 0 ? (
                                    filtered.map((indicator) => {
                                        const isPassed = indicator.type === "passed" || indicator.type === "success";

                                        return (
                                            <div
                                                key={indicator.id}
                                                className={cn(
                                                    "group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300",
                                                    isPassed
                                                        ? "bg-success/5 border-success/10 hover:bg-success/10"
                                                        : "bg-destructive/5 border-destructive/10 hover:bg-destructive/10 shadow-sm shadow-destructive/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center border transition-transform group-hover:scale-110",
                                                    isPassed ? "bg-success/20 border-success/30 text-success" : "bg-destructive/20 border-destructive/30 text-destructive"
                                                )}>
                                                    {isPassed ? <CheckCircle className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <h4 className="text-[11px] font-black tracking-tight text-foreground/80 uppercase">{indicator.label}</h4>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-tight break-words">{indicator.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center">
                                        <p className="text-[9px] text-muted-foreground opacity-50 uppercase tracking-tighter">Diagnostic In Progress</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
