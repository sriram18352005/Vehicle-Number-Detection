"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { cn } from "@/lib/utils";
import { Shield, Activity, FileText, Clipboard, BarChart, Settings as SettingsIcon, LogOut, Search, X } from "lucide-react";

function CommandPalette({ open, setOpen, router }: { open: boolean, setOpen: any, router: any }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [selIdx, setSelIdx] = useState(0);
    const actions = [
        { label: 'Analytics Dashboard', path: '/dashboard/reports', icon: <BarChart className="w-4 h-4" /> },
        { label: 'Document Analysis (Live Scan)', path: '/dashboard/analysis', icon: <FileText className="w-4 h-4" /> },
        { label: 'Threat Intelligence', path: '/dashboard', icon: <Activity className="w-4 h-4" /> },
        { label: 'Audit Logs', path: '/dashboard/audit-logs', icon: <Clipboard className="w-4 h-4" /> },
        { label: 'System Settings', path: '/dashboard/settings', icon: <SettingsIcon className="w-4 h-4" /> },
    ];
    const filtered = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => { setSelIdx(0); }, [query]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
        else setQuery("");
    }, [open]);

    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((o: boolean) => !o);
            }
            if (!open) return;
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(s => (s + 1) % (filtered.length || 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(s => (s - 1 + filtered.length) % (filtered.length || 1)); }
            if (e.key === 'Enter') { e.preventDefault(); if (filtered[selIdx]) { router.push(filtered[selIdx].path); setOpen(false); } }
        };
        window.addEventListener('keydown', handleDown);
        return () => window.removeEventListener('keydown', handleDown);
    }, [open, setOpen, filtered, selIdx, router]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
            <div className="bg-[#10131c] border border-[#1e2535] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-[600px] overflow-hidden transform transition-all flex flex-col" style={{ animation: 'paletteIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', maxHeight: '70vh' }}>
                <div className="flex items-center px-4 py-3 border-b border-[#1e2535]">
                    <Search className="w-5 h-5 text-[#00c2cb]" />
                    <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} className="flex-1 bg-transparent border-none text-[#e8ecf4] px-4 py-2 focus:outline-none placeholder:text-[#4a5568] focus:ring-0" placeholder="Type a command or search..." />
                    <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-[#1e2535] text-[#4a5568]"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto p-2 flex-1 relative">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-[#4a5568] text-sm">No results found for "{query}".</div>
                    ) : (
                        filtered.map((action, i) => (
                            <button key={action.path} onClick={() => { router.push(action.path); setOpen(false); }} onMouseEnter={() => setSelIdx(i)} className={`w-full flex items-center justify-between p-3 rounded-lg group transition-colors text-left ${i === selIdx ? 'bg-[#1e2535]' : 'hover:bg-[#1a1f30]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={i === selIdx ? "text-[#00c2cb]" : "text-[#4a5568]"}>{action.icon}</div>
                                    <span className={i === selIdx ? "text-[#00c2cb] text-sm font-bold" : "text-[#e8ecf4] text-sm font-medium"}>{action.label}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold text-[#00c2cb] transition-opacity ${i === selIdx ? 'opacity-100' : 'opacity-0'}`}>Jump ⏎</span>
                            </button>
                        ))
                    )}
                </div>
                <div className="p-3 bg-[#0a0d14] border-t border-[#1e2535] flex justify-between items-center text-[10px] text-[#4a5568] shrink-0">
                    <span><kbd className="bg-[#1e2535] px-1.5 py-0.5 rounded mr-1 leading-none font-sans border border-[#2d3748]">↑↓</kbd> to navigate</span>
                    <span><kbd className="bg-[#1e2535] px-1.5 py-0.5 rounded mr-1 leading-none font-sans border border-[#2d3748]">⏎</kbd> to select</span>
                    <span><kbd className="bg-[#1e2535] px-1.5 py-0.5 rounded mr-1 leading-none font-sans border border-[#2d3748]">esc</kbd> to close</span>
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes paletteIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                `}} />
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [cmdOpen, setCmdOpen] = useState(false);

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
        { name: "Threat Intelligence", icon: <Activity className="w-4 h-4" />, path: "/dashboard" },
        { name: "Document Analysis", icon: <FileText className="w-4 h-4" />, path: "/dashboard/analysis" },
        { name: "Audit Logs", icon: <Clipboard className="w-4 h-4" />, path: "/dashboard/audit-logs" },
        { name: "Dashboard", icon: <BarChart className="w-4 h-4" />, path: "/dashboard/reports" },
        { name: "Settings", icon: <SettingsIcon className="w-4 h-4" />, path: "/dashboard/settings" },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-display">
            {/* Sidebar */}
            <aside className="w-[220px] bg-[#10131c] border-r border-[#1e2535] flex flex-col z-20 shrink-0">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#00c2cb] rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#0a0d14]" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter uppercase text-[#e8ecf4]">Verentis</h1>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                pathname === item.path
                                    ? "bg-[#00c2cb15] text-[#00c2cb] border border-[#00c2cb30]"
                                    : "text-[#4a5568] hover:text-[#e8ecf4] hover:bg-[#1e2535]"
                            )}
                        >
                            <span className={cn(
                                "transition-transform group-hover:scale-110",
                                pathname === item.path ? "text-[#00c2cb]" : "text-inherit"
                            )}>
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
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
                        <h2 className="text-sm font-black text-[#e8ecf4] uppercase tracking-[0.2em]">
                            FORENSIC SERVICES
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <button onClick={() => setCmdOpen(true)} className="flex items-center justify-between w-64 px-4 py-2 bg-[#10131c] border border-[#1e2535] rounded-full text-xs text-[#4a5568] hover:border-[#00c2cb] hover:text-[#e8ecf4] transition-colors focus:outline-none">
                                <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Quick search...</span>
                                <kbd className="hidden sm:inline-block bg-[#1e2535] px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold border border-[#2d3748]">Ctrl K</kbd>
                            </button>
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-card-foreground hover:bg-accent relative transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <CommandPalette open={cmdOpen} setOpen={setCmdOpen} router={router} />
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
