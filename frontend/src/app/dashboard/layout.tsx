"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const navItems = [
        { name: "Threat Intelligence", icon: "insights", path: "/dashboard" },
        { name: "Document Analysis", icon: "description", path: "/dashboard/analysis" },
        { name: "Audit Logs", icon: "history_edu", path: "/dashboard/audit-logs" },
        { name: "Reports", icon: "analytics", path: "/dashboard/reports" },
        { name: "Settings", icon: "settings", path: "/dashboard/settings" },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-display">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col z-20 shrink-0">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-background border border-border/40 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src="/logos/verentis_logo.png" alt="Verentis Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-lg font-extrabold tracking-tight">Verentis</h1>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`sidebar-item ${pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            <span className="text-sm font-semibold">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-border">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                            <img alt="User Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYGXH-Y7qM6B0WrOgdEAIraa0uEGdrMvyif3YpJSxV6vOkoGxJDav8Bg7F8ZuRK0_i305calXJkPaKmOJulIhDDZuNdwquSrrKl0K6vhkesqe_C3Htgp8lpMeR-LsF3qYDDrP13xGCq10xfnIQSAv0pPz4RMdBUS72-HSUVOSk5NwLsLBVKiKxk1dg1o6D_B4aSiBCYFmmybkwWCxqB2A4BArHSaMjah6U6W_n_NxgASZYEKfxEr2j61RgkYbzNQYi_fI1lbi-dfs" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{user?.full_name || "Jameson Carter"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user?.email || "Chief Forensic Officer"}</p>
                        </div>
                        <span className="material-symbols-outlined text-muted-foreground text-sm">unfold_more</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-2 w-full flex items-center gap-3 p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">logout</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                    </button>
                    <div className="mt-4 pt-4 border-t border-border flex justify-center">
                        <ThemeSwitcher />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            {pathname === '/dashboard' ? 'Dashboard Overview' :
                                pathname === '/dashboard/analysis' ? 'Forensic Services' :
                                    pathname === '/dashboard/audit-logs' ? 'Compliance & Governance' :
                                        pathname === '/dashboard/reports' ? 'Reporting Analytics' :
                                            pathname === '/dashboard/settings' ? 'Administrative Control' : 'Operations'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
                            <input className="pl-10 pr-4 py-1.5 bg-muted border-none rounded-full text-xs focus:ring-2 focus:ring-primary w-64" placeholder="Quick search..." type="text" />
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-card-foreground hover:bg-accent relative transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {children}

                    <footer className="mt-auto py-6 px-8 border-t border-border flex justify-between items-center bg-card shrink-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">© 2024 Verentis Forensic Division</p>
                        <div className="flex gap-6">
                            <a className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hover:text-primary" href="#">Documentation</a>
                            <a className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hover:text-primary" href="#">Forensic API</a>
                            <a className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hover:text-primary" href="#">Legal</a>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
