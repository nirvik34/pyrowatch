import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="bg-background-dark text-slate-100 font-body min-h-screen flex flex-col overflow-x-hidden relative selection:bg-primary selection:text-white">

      {/* ── Fixed background layers ───────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px]" />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#080C10_90%)]" />
        {/* Ember particles */}
        <div className="ember-particle left-[10%] w-2 h-2" style={{ animationDuration: '15s', animationDelay: '0s' }} />
        <div className="ember-particle left-[25%] w-3 h-3" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="ember-particle left-[40%] w-1 h-1" style={{ animationDuration: '18s', animationDelay: '5s' }} />
        <div className="ember-particle left-[60%] w-2 h-2" style={{ animationDuration: '14s', animationDelay: '1s' }} />
        <div className="ember-particle left-[80%] w-4 h-4" style={{ animationDuration: '20s', animationDelay: '4s' }} />
        <div className="ember-particle left-[90%] w-2 h-2" style={{ animationDuration: '10s', animationDelay: '7s' }} />
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 scanlines opacity-30" />

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <header className="w-full border-b border-surface-border bg-background-dark/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
                local_fire_department
              </span>
              <div className="flex flex-col">
                <h1 className="font-display font-bold text-xl tracking-wider text-white leading-none">
                  PYROWATCH AI
                </h1>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest leading-none mt-1">
                  SYSTEM STATUS: ONLINE
                </span>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-8 font-mono text-sm text-slate-400">
              <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">
                LIVE MAP
              </button>
              <button onClick={() => navigate('/alerts')} className="hover:text-primary transition-colors">
                ALERTS
              </button>
              <button onClick={() => navigate('/replay')} className="hover:text-primary transition-colors">
                REPLAY
              </button>
              <div className="h-4 w-px bg-surface-border" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-xs text-emerald-500">GRID STABLE</span>
              </div>
            </nav>

            {/* Mobile menu icon */}
            <button className="md:hidden text-slate-300">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 py-16 sm:py-24 relative">
          <div className="max-w-5xl w-full flex flex-col gap-16">

            {/* ── Hero block ─────────────────────────────────────────────── */}
            <div className="text-center space-y-8 relative">
              {/* Glow blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />

              {/* Version badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-primary/30 bg-primary/10 text-primary font-mono text-xs tracking-wider mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                CRITICAL UPDATE: v1.0.4 DEPLOYED
              </div>

              {/* Title */}
              <h1 className="font-display font-bold text-6xl sm:text-7xl lg:text-8xl tracking-tight text-white uppercase leading-[0.9]">
                PyroWatch{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-t from-fire-red to-yellow-500">
                  AI
                </span>
              </h1>

              {/* Tagline */}
              <p className="font-mono text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto border-l-2 border-primary pl-4 text-left sm:text-center sm:border-l-0 sm:pl-0">
                // AI-DRIVEN WILDFIRE EARLY WARNING SYSTEM
                <br className="hidden sm:block" />
                <span className="text-slate-500 text-sm block mt-2">
                  DETECT THERMAL ANOMALIES. PREDICT SPREAD. DEPLOY RESOURCES.
                </span>
              </p>

              {/* CTAs */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group relative flex items-center justify-center gap-3
                             bg-gradient-to-r from-fire-red to-fire-orange hover:to-orange-500
                             text-white font-bold py-4 px-8 rounded transition-all duration-300
                             shadow-[0_0_20px_rgba(255,57,31,0.3)] hover:shadow-[0_0_30px_rgba(255,57,31,0.5)]
                             overflow-hidden w-full sm:w-auto"
                >
                  {/* Shimmer sweep on hover */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                   translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="font-mono text-lg tracking-wide">ENTER COMMAND CENTER</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>

                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-surface-dark border border-surface-border
                             hover:border-slate-500 text-slate-300 font-mono py-4 px-8 rounded
                             transition-colors w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  <span>VIEW DOCUMENTATION</span>
                </a>
              </div>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full">

              {/* Card: AUC */}
              <div className="bg-surface-dark border border-surface-border p-6 rounded relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-fire-red to-fire-orange opacity-60" />
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary text-4xl">query_stats</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Model Accuracy</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-white group-hover:text-primary transition-colors">
                      0.9727
                    </span>
                    <span className="text-emerald-500 text-xs font-mono">▲ TARGET MET</span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">AUC ROC SCORE</p>
                  <div className="w-full bg-surface-border h-1 mt-4 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-fire-red to-fire-orange h-full w-[97%] shadow-[0_0_10px_rgba(255,57,31,0.5)]" />
                  </div>
                </div>
              </div>

              {/* Card: Lead time */}
              <div className="bg-surface-dark border border-surface-border p-6 rounded relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-fire-red to-fire-orange opacity-60" />
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary text-4xl">timer</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Response Lead Time</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-white group-hover:text-primary transition-colors">
                      6 HRS
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">ADVANCE WARNING</p>
                  <div className="flex gap-1 mt-4">
                    {[1, 0.8, 0.6, 0.4].map((op, i) => (
                      <div key={i} className="h-1 w-full bg-primary rounded-full" style={{ opacity: op }} />
                    ))}
                    <div className="h-1 w-full bg-surface-border rounded-full" />
                  </div>
                </div>
              </div>

              {/* Card: Coverage */}
              <div className="bg-surface-dark border border-surface-border p-6 rounded relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-fire-red to-fire-orange opacity-60" />
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary text-4xl">radar</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Coverage Area</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-white group-hover:text-primary transition-colors">
                      5 ZONES
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">ACTIVELY MONITORED</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-slate-500 font-mono">LIVE SATELLITE FEED ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Capabilities ───────────────────────────────────────────── */}
            <div className="w-full pt-12 border-t border-surface-border/50">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
                <div>
                  <h2 className="font-display font-bold text-3xl text-white">SYSTEM CAPABILITIES</h2>
                  <p className="text-slate-400 mt-2 max-w-xl">
                    Integrated real-time thermal anomaly detection powered by NASA FIRMS satellite
                    data and predictive LSTM machine learning models.
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span className="px-2 py-1 bg-surface-border text-slate-300 text-xs font-mono rounded">
                    API: ONLINE
                  </span>
                  <span className="px-2 py-1 bg-surface-border text-slate-300 text-xs font-mono rounded">
                    MODEL: READY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: 'satellite_alt',
                    title: 'SATELLITE INTEGRATION',
                    desc: 'Multi-spectral feed analysis from NASA FIRMS VIIRS and Sentinel-2 satellites for sub-pixel heat detection across Plumas County.',
                  },
                  {
                    icon: 'psychology',
                    title: 'LSTM PREDICTION',
                    desc: 'Stacked LSTM neural network predicting fire spread 6 hours ahead based on wind, terrain, humidity, and vegetation dryness indices.',
                  },
                  {
                    icon: 'emergency_share',
                    title: 'INSTANT ALERTS',
                    desc: 'County-level tiered alerts — WATCH, WARNING, EMERGENCY — with Featherless Mistral-7B situation reports for incident commanders.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="bg-surface-dark/50 border border-surface-border p-5 rounded hover:bg-surface-dark transition-colors group"
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center mb-4 text-primary
                                    group-hover:bg-gradient-to-br group-hover:from-primary/30 group-hover:to-fire-orange/30
                                    group-hover:text-white transition-all">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-border bg-background-dark/95 backdrop-blur z-40">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

              <div className="flex flex-col items-center md:items-start gap-1">
                <div className="flex items-center gap-2 text-slate-300 font-display font-bold tracking-wider">
                  <span className="material-symbols-outlined text-primary text-sm">local_fire_department</span>
                  PYROWATCH AI
                </div>
                <p className="text-slate-500 text-xs font-mono">
                  EnviroCast GEO Hackathon · Dixie Fire Demo · Build v1.0.4
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-xs font-mono text-slate-400">
                <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">
                  Command Center
                </button>
                <span className="text-surface-border">/</span>
                <button onClick={() => navigate('/replay')} className="hover:text-primary transition-colors">
                  Fire Replay
                </button>
                <span className="text-surface-border">/</span>
                <button onClick={() => navigate('/alerts')} className="hover:text-primary transition-colors">
                  Alert Board
                </button>
                <span className="text-surface-border">/</span>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  API Docs
                </a>
              </div>

              <div className="text-slate-600 text-xs font-mono">© 2025 PYROWATCH AI</div>
            </div>
          </div>
        </footer>

      </div>

      {/* ── Injected keyframes (matches original HTML) ─────────────────────── */}
      <style>{`
        .ember-particle {
          position: absolute;
          background: radial-gradient(circle, rgba(255,87,34,0.6) 0%, rgba(255,57,31,0) 70%);
          border-radius: 50%;
          opacity: 0.6;
          animation: floatUp linear infinite;
          bottom: -10%;
        }
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0.5); opacity: 0;   }
          20%  { opacity: 0.8; }
          80%  { opacity: 0.4; }
          100% { transform: translateY(-10vh)  scale(1.2); opacity: 0;  }
        }
        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.1) 50%,
            rgba(0,0,0,0.1)
          );
          background-size: 100% 4px;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
