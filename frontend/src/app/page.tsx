"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-500">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-background flex items-center justify-center rounded-lg shadow-lg border border-border/40 overflow-hidden">
              <img src="/logos/verentis_logo.png" alt="Verentis Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-axiom-text"><span className="text-primary font-black uppercase">Verentis</span></h2>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            <a className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors text-axiom-text/80" href="#">Solutions</a>
            <a className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors text-axiom-text/80" href="#">Technology</a>
            <a className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors text-axiom-text/80" href="#">Intelligence</a>
            <a className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors text-axiom-text/80" href="#">Compliance</a>
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-bold text-axiom-text hover:text-primary transition-colors">Client Login</Link>
            <Link href="/dashboard/analysis" className="px-6 py-3 text-xs font-black uppercase tracking-widest bg-primary text-white hover:bg-blue-600 transition-all rounded-sm shadow-md">Enterprise Access</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative pt-24 pb-32 overflow-hidden bg-background">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none text-axiom-text">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/20 grid-mesh opacity-50"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-transparent via-background to-background"></div>
          </div>
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="flex flex-col gap-10">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 shadow-sm w-fit">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-axiom-muted">Forensic Node v11.4 Active</span>
                </div>
                <h1 className="text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-axiom-text">
                  Next-Gen <br />
                  <span className="text-primary">Forensic</span> <br />
                  Verification
                </h1>
                <p className="text-lg text-axiom-muted max-w-lg leading-relaxed font-light">
                  High-fidelity document authentication powered by neural-spectral analysis. Secure your institutional workflow with 99.9% forensic accuracy.
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/dashboard/analysis" className="px-10 py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl rounded-sm">Start Forensic Audit</Link>
                  <button className="group flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-primary">
                    <span className="w-12 h-px bg-primary/30 group-hover:w-16 transition-all"></span>
                    View Technology Stack
                  </button>
                </div>
              </div>
              <div className="relative group">
                <div className="relative w-full aspect-[4/5] bg-secondary/20 rounded-[2.5rem] border border-border/40 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-secondary/10"></div>
                  <div className="absolute inset-0 laser-grid opacity-30"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[75%] bg-background/20 border border-border/40 glass-panel rounded-2xl shadow-2xl flex items-center justify-center transform rotate-[-2deg] perspective-[1000px] z-10">
                    <div className="w-3/4 h-3/4 bg-white dark:bg-slate-100 shadow-xl rounded-sm p-8 relative overflow-hidden flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="w-24 h-4 bg-slate-100 rounded"></div>
                          <div className="w-16 h-3 bg-slate-50 rounded"></div>
                        </div>
                        <div className="w-12 h-16 bg-slate-50 border border-slate-100 rounded-sm"></div>
                      </div>
                      <div className="space-y-2 pt-4">
                        <div className="w-full h-2 bg-slate-50 rounded"></div>
                        <div className="w-full h-2 bg-slate-50 rounded"></div>
                        <div className="w-4/5 h-2 bg-slate-50 rounded"></div>
                      </div>
                      <div className="mt-auto flex justify-between">
                        <div className="w-20 h-2 bg-slate-100 rounded"></div>
                        <div className="w-10 h-10 border-2 border-primary/20 rounded flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary/40 text-xl">qr_code_2</span>
                        </div>
                      </div>
                      <div className="scanning-line"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-10 left-10 glass-panel px-6 py-4 rounded-xl border border-border/40 shadow-xl z-20">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Optical Clarity</p>
                    <p className="text-xl font-bold text-axiom-text tracking-tight uppercase">High Fidelity</p>
                  </div>
                  <div className="absolute top-10 right-10 glass-panel px-6 py-4 rounded-xl border border-border/40 shadow-xl z-20">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Authenticity Score</p>
                    <p className="text-2xl font-bold text-axiom-text tracking-tighter">99.98%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-y border-border/20 bg-secondary/10">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-[10px] font-black text-axiom-muted uppercase tracking-[0.3em] text-center mb-12">Trusted by global financial & government institutions</p>
            <div className="flex flex-wrap justify-center items-center gap-16 opacity-50 grayscale hover:grayscale-0 transition-all font-display">
              {[
                { label: "FEDERAL TRUST", icon: "account_balance" },
                { label: "GOV DEFENSE", icon: "shield_person" },
                { label: "GLOBAL BANK", icon: "payments" },
                { label: "TREASURY OPS", icon: "assured_workload" },
                { label: "RESERVE CAP", icon: "account_balance_wallet" }
              ].map(brand => (
                <div key={brand.label} className="flex items-center gap-3 font-bold text-axiom-text text-xl">
                  <span className="material-symbols-outlined text-primary text-3xl">{brand.icon}</span>
                  <span className="tracking-tighter">{brand.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-32 bg-background">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="col-span-1 space-y-6">
                <div className="w-12 h-1 bg-primary"></div>
                <h2 className="text-3xl font-bold tracking-tight text-axiom-text uppercase">Core Forensic <br />Technology Stack</h2>
                <p className="text-axiom-muted font-light leading-relaxed">The architecture behind the world's most advanced document verification engine, built for scale, speed, and precision.</p>
              </div>
              <div className="col-span-2 grid md:grid-cols-3 gap-6">
                {[
                  { title: "YOLOv11 Edge", desc: "Real-time object detection and feature extraction at sub-millisecond speeds using the latest neural vision models.", icon: "visibility" },
                  { title: "FastAPI Core", desc: "Asynchronous high-performance interface for high-concurrency enterprise requests with sub-10ms overhead.", icon: "bolt" },
                  { title: "Celery Mesh", desc: "Distributed task queue managing complex forensic pipelines across global worker nodes with full redundancy.", icon: "layers" }
                ].map(item => (
                  <div key={item.title} className="p-8 bg-secondary/30 rounded-2xl border border-border/40 hover:border-primary/50 transition-all group">
                    <div className="w-12 h-12 bg-background rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">{item.icon}</span>
                    </div>
                    <h4 className="font-bold text-axiom-text mb-2">{item.title}</h4>
                    <p className="text-xs text-axiom-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Explainability Pipeline */}
        <section className="py-32 bg-secondary/20 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-axiom-text">AI Explainability Pipeline</h2>
              <p className="text-axiom-muted font-light text-lg">Detailed forensic breakdown of every verification step for total audit transparency.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { num: "01", title: "Normalization", desc: "Correcting perspective, lens distortion, and illumination variance to baseline standards using adaptive histogram equalization.", icon: "filter_center_focus" },
                { num: "02", title: "ELA Analysis", desc: "Error Level Analysis to detect pixel-level resaving and digital manipulation artifacts in high-frequency image areas.", icon: "contrast" },
                { num: "03", title: "Structural Ext.", desc: "Mapping physical document geometry, font metrics, and layout against sovereign master templates for micro-deviations.", icon: "account_tree" },
                { num: "04", title: "Semantic Parsing", desc: "Cross-referencing OCR data and entity relationships with deep-web and official sovereign registry repositories.", icon: "description" }
              ].map(step => (
                <div key={step.num} className="bg-background p-10 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
                  <span className="absolute top-4 right-4 text-5xl font-black text-axiom-text/5 group-hover:text-primary/10 transition-colors">{step.num}</span>
                  <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 text-primary">
                    <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                  </div>
                  <h4 className="font-bold text-axiom-text mb-4 text-lg">{step.title}</h4>
                  <p className="text-sm text-axiom-muted leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real-time Threat Intelligence Network */}
        <section className="py-32 bg-background overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="relative">
                <div className="aspect-square bg-slate-950 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl border-4 border-slate-900">
                  <div className="absolute inset-0 opacity-30 grid-mesh"></div>
                  <div className="relative w-full h-full border border-primary/20 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900/50">
                    <span className="material-symbols-outlined text-primary/10 text-[350px] absolute pointer-events-none">public</span>
                    <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                    <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-6 left-6 right-6 p-5 glass-panel !bg-slate-900/80 border-white/5 text-white rounded-xl">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-3">
                        <span className="text-primary flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Live Threat Stream</span>
                        <span className="text-red-400">Critical Alerts: 14</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-2">
                          <span className="text-slate-200">UK - Passport Chip Tamper</span>
                          <span className="text-slate-500">2s ago</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-2">
                          <span className="text-slate-200">IND - Aadhaar QR Forgery</span>
                          <span className="text-slate-500">14s ago</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-200">USA - DL DL14 Batch Anomaly</span>
                          <span className="text-slate-500">42s ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight text-axiom-text">Real-time Threat</h2>
                  <h2 className="text-4xl font-black tracking-tight text-primary">Intelligence Network</h2>
                </div>
                <p className="text-lg text-axiom-muted font-light leading-relaxed">
                  Axiom’s global sensor network identifies emerging document fraud trends before they reach your institution. Benefit from collective security intelligence updated every 60 seconds.
                </p>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center text-primary shrink-0 transition-colors">
                      <span className="material-symbols-outlined text-2xl">map</span>
                    </div>
                    <div>
                      <p className="font-bold text-axiom-text">Geographic Fraud Mapping</p>
                      <p className="text-sm text-axiom-muted">Identify high-risk corridors and specific document types targeted by organized networks in real-time across 140+ countries.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center text-primary shrink-0 transition-colors">
                      <span className="material-symbols-outlined text-2xl">auto_graph</span>
                    </div>
                    <div>
                      <p className="font-bold text-axiom-text">Predictive Risk Scoring</p>
                      <p className="text-sm text-axiom-muted">Adjust verification friction levels dynamically based on current global threat levels and regional attack vectors.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Specialized Modules */}
        <section className="py-32 bg-secondary/10 relative">
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-axiom-text">Specialized Modules</h2>
              <p className="text-axiom-muted font-light text-lg">Bespoke forensic logic tailored for complex international document standards.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { title: "Identity & Aadhaar", desc: "Validated for Indian UIDAI substrates with sub-micron holographic verification and biometric cross-referencing.", checks: ["QR V3 SECURE VALIDATION", "DEMOGRAPHIC CROSS-CHECK", "SUBSTRATE SPECTRAL ANALYSIS"], icon: "fingerprint" },
                { title: "Passport & Travel", desc: "ICAO Doc 9303 compliant processing for 190+ sovereign travel documents with UV/IR image alignment.", checks: ["NFC CHIP CLONING DETECTION", "MRZ COMPLIANCE V2", "VISA STAMP OVERLAY ANALYSIS"], icon: "public" },
                { title: "Financial Securities", desc: "Neural ink-level analysis for bank statements, negotiable instruments, and wealth certificates.", checks: ["SUB-PIXEL INK SPATTER ANALYSIS", "BANKING API INTEGRATION", "TRANSACTION LOG RECONCILIATION"], icon: "payments" }
              ].map(module => (
                <div key={module.title} className="group p-10 border border-border/40 bg-background hover:border-primary/40 hover:shadow-xl transition-all duration-500 rounded-3xl">
                  <div className="w-16 h-16 bg-secondary/20 border border-border/40 shadow-sm rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary transition-all">
                    <span className="material-symbols-outlined text-primary group-hover:text-white text-4xl">{module.icon}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 text-axiom-text">{module.title}</h3>
                  <p className="text-axiom-muted leading-relaxed mb-6 text-sm">{module.desc}</p>
                  <div className="space-y-2 mb-8 border-t border-border/10 pt-6">
                    {module.checks.map(check => (
                      <div key={check} className="flex items-center gap-2 text-[11px] font-bold text-axiom-muted uppercase">
                        <span className="material-symbols-outlined text-sm text-primary">check_circle</span> {check}
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3 text-[11px] font-black uppercase tracking-widest border border-border/40 rounded-lg hover:bg-secondary/20 transition-colors">Module Specs</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Verentis? Section */}
        <section className="py-24 bg-background border-t border-border/10">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="w-16 h-1 bg-primary"></div>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-axiom-text">Why Verentis?</h2>
                <div className="space-y-6 text-lg text-axiom-muted font-light leading-relaxed">
                  <p>
                    <span className="text-primary font-bold">Verentis</span> represents trust, verification, and intelligence.
                    The name is inspired by the idea of <span className="text-axiom-text font-medium">“veracity”</span> and <span className="text-axiom-text font-medium">“authenticity,”</span> symbolizing a system built to detect fraud, validate documents, and ensure data integrity with precision and reliability.
                  </p>
                  <p>
                    Verentis stands for secure verification, intelligent fraud detection, and transparent document analysis — delivering confidence in every processed document.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="p-10 bg-secondary/10 rounded-[2.5rem] border border-border/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                  <div className="relative z-10 grid grid-cols-2 gap-4">
                    {[
                      { label: "Veracity", icon: "verified" },
                      { label: "Intelligence", icon: "psychology" },
                      { label: "Trust", icon: "gpp_good" },
                      { label: "Reliability", icon: "security" }
                    ].map(item => (
                      <div key={item.label} className="p-6 bg-background border border-border/40 rounded-2xl flex flex-col items-center gap-3 group-hover:border-primary/30 transition-all">
                        <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-axiom-muted">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-8">
            <div className="bg-axiom-text/5 dark:bg-axiom-text rounded-[2.5rem] p-16 lg:p-24 relative overflow-hidden flex flex-col items-center text-center shadow-2xl border border-border/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40"></div>
              <div className="relative z-10 max-w-3xl space-y-10">
                <h2 className="text-4xl lg:text-6xl font-black text-axiom-text dark:text-white leading-tight">Ready to eliminate <br />document risk?</h2>
                <p className="text-xl text-axiom-muted dark:text-slate-400 font-light">Schedule a technical walkthrough of the Axiom Forensic Engine with our engineering team.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
                  <Link href="/dashboard/analysis" className="px-12 py-6 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl rounded-sm">Request Enterprise Trial</Link>
                  <button className="px-12 py-6 border border-border/40 dark:border-white/20 text-axiom-text dark:text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-axiom-text/10 transition-all rounded-sm">Technical Documentation</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t border-border/40 pt-24 pb-12 transition-colors">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-background flex items-center justify-center rounded-lg border border-border/40 overflow-hidden">
                  <img src="/logos/verentis_logo.png" alt="Verentis Logo" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-axiom-text uppercase tracking-widest text-primary">Verentis</h2>
              </div>
              <p className="text-axiom-muted text-sm leading-relaxed max-w-sm">
                Building a future of immutable digital trust through laboratory-grade forensic analysis and high-fidelity neural verification systems.
              </p>
              <div className="flex gap-4">
                <button className="w-10 h-10 rounded-lg border border-border/40 flex items-center justify-center hover:border-primary hover:text-primary transition-colors bg-secondary/20">
                  <span className="material-symbols-outlined text-xl">share</span>
                </button>
                <button className="w-10 h-10 rounded-lg border border-border/40 flex items-center justify-center hover:border-primary hover:text-primary transition-colors bg-secondary/20">
                  <span className="material-symbols-outlined text-xl">language</span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-axiom-text mb-8">Platform</h4>
              <ul className="space-y-4 text-sm text-axiom-muted">
                <li><a className="hover:text-primary transition-colors" href="#">Forensic Core</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Axiom API</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Explainability</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Modules</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-axiom-text mb-8">Resources</h4>
              <ul className="space-y-4 text-sm text-axiom-muted">
                <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Case Studies</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Security Center</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Whitepapers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-axiom-text mb-8">Corporate</h4>
              <ul className="space-y-4 text-sm text-axiom-muted">
                <li><a className="hover:text-primary transition-colors" href="#">About Axiom</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Compliance</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-axiom-muted">© 2024 Verentis Forensic Systems. A Division of Axiom Global.</p>
            <div className="flex gap-8">
              <a className="text-[10px] font-black uppercase tracking-widest text-axiom-muted hover:text-primary" href="#">Status: Operational</a>
              <a className="text-[10px] font-black uppercase tracking-widest text-axiom-muted hover:text-primary" href="#">Service Level Agreement</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
