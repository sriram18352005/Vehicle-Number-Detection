import React from 'react';
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";

export interface BoundingBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    status: "valid" | "suspicious" | "fraud";
    type?: "HIGHLIGHT" | "BOX" | "MARK";
    reason?: string;
    page?: number;
    impact?: string;
    weight?: number;
}

interface BoundingBoxOverlayProps {
    boundingBoxes: BoundingBox[];
    currentPage: number;
    onBoxClick?: (box: BoundingBox) => void;
    activeBoxId?: string | null;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
    boundingBoxes,
    currentPage,
    onBoxClick,
    activeBoxId
}) => {
    const filteredBoxes = boundingBoxes.filter(box => (box.page ?? 0) === currentPage);

    if (filteredBoxes.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-lg">
            {filteredBoxes.map((box) => (
                <div
                    key={box.id}
                    onClick={() => onBoxClick?.(box)}
                    className={cn(
                        "absolute transition-all duration-300 pointer-events-auto cursor-help group",
                        // Base style: Red border for violations
                        box.status === "fraud" ? "border-2 border-destructive animate-pulse-subtle bg-destructive/5" :
                            box.status === "suspicious" ? "border-2 border-warning bg-warning/5" : "border border-success/30 bg-success/5",

                        // Active state
                        activeBoxId === box.id && "ring-4 ring-white ring-offset-2 ring-offset-destructive z-50",

                        // Type specific
                        box.type === "HIGHLIGHT" && "border-b-4 border-t-0 border-x-0 rounded-none shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
                    )}
                    style={{
                        left: `${box.x / 10}%`,
                        top: `${box.y / 10}%`,
                        width: `${box.width / 10}%`,
                        height: `${box.height / 10}%`,
                        borderRadius: box.type === "HIGHLIGHT" ? "0" : "4px"
                    }}
                >
                    {/* Tooltip on Hover */}
                    <div className={cn(
                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 min-w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 pointer-events-none z-[100]",
                        box.status === "fraud" ? "bg-destructive/95 text-white" : "bg-slate-900/95 text-white"
                    )}>
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                {box.status === "fraud" ? <AlertCircle className="w-5 h-5 text-white" /> :
                                    box.status === "suspicious" ? <AlertTriangle className="w-5 h-5 text-warning" /> :
                                        <Info className="w-5 h-5 text-success" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-[10px] uppercase tracking-widest opacity-80 mb-1">{box.label}</h4>
                                <p className="text-xs font-bold leading-tight mb-2">{box.reason || "Detection marker"}</p>

                                {box.impact && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 mt-2">
                                        <div className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">
                                            IMPACT: {box.impact}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Triangle Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-inherit border-r border-b border-white/20 -mt-1.5" />
                    </div>

                    {/* Small Fraud Label Badge */}
                    <div className={cn(
                        "absolute -top-3.5 left-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter text-white shadow-lg",
                        box.status === "fraud" ? "bg-destructive" :
                            box.status === "suspicious" ? "bg-warning" : "bg-success"
                    )}>
                        {box.status === "fraud" ? "FRAUD DETECTED" : box.label}
                    </div>
                </div>
            ))}
        </div>
    );
};
