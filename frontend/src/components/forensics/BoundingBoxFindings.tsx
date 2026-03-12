import { Square, MapPin, PenTool, User, Shield, CreditCard, Landmark, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BoxFinding {
    id: string;
    region: string;
    issue: string;
    status: "valid" | "suspicious" | "fraud";
    coordinates: { x: number; y: number; w: number; h: number };
    page?: number;
}

interface BoundingBoxFindingsProps {
    findings: BoxFinding[];
    onHoverFinding?: (id: string | null) => void;
    onClickFinding?: (finding: BoxFinding) => void;
}

const getRegionIcon = (region: string) => {
    const reg = region.toLowerCase();
    if (reg.includes("signature")) return <PenTool className="w-4 h-4" />;
    if (reg.includes("photo") || reg.includes("face")) return <User className="w-4 h-4" />;
    if (reg.includes("logo") || reg.includes("emblem")) return <Shield className="w-4 h-4" />;
    if (reg.includes("card") || reg.includes("pan")) return <CreditCard className="w-4 h-4" />;
    if (reg.includes("bank") || reg.includes("sbi") || reg.includes("hdfc")) return <Landmark className="w-4 h-4" />;
    return <Square className="w-4 h-4" />;
};

export function BoundingBoxFindings({ findings, onHoverFinding, onClickFinding }: BoundingBoxFindingsProps) {
    return (
        <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-semibold">Analyzed Regions</h2>
                    <p className="text-xs text-muted-foreground">Detection & fraud localization</p>
                </div>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-auto pr-2">
                {findings.length > 0 ? (
                    findings.map((finding) => (
                        <div
                            key={finding.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:translate-x-1 active:scale-95",
                                finding.status === "valid" && "bg-success/5 border-success/20 hover:border-success/40",
                                finding.status === "suspicious" && "bg-warning/5 border-warning/20 hover:border-warning/40",
                                finding.status === "fraud" && "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                            )}
                            onMouseEnter={() => onHoverFinding?.(finding.id)}
                            onMouseLeave={() => onHoverFinding?.(null)}
                            onClick={() => onClickFinding?.(finding)}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                finding.status === "valid" && "bg-success/20 text-success",
                                finding.status === "suspicious" && "bg-warning/20 text-warning",
                                finding.status === "fraud" && "bg-destructive/20 text-destructive"
                            )}>
                                {getRegionIcon(finding.region)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold break-words">{finding.region}</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                                        finding.status === "valid" && "bg-success/20 text-success",
                                        finding.status === "suspicious" && "bg-warning/20 text-warning",
                                        finding.status === "fraud" && "bg-destructive/20 text-destructive"
                                    )}>
                                        {finding.status}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground break-words leading-tight mt-0.5">{finding.issue}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground font-mono">
                                <MapPin className="w-3 h-3" />
                                <span>{Math.round(finding.coordinates.x)},{Math.round(finding.coordinates.y)}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Square className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No regions analyzed</p>
                    </div>
                )}
            </div>
        </div>
    );
}
