import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'

interface Frame {
    hour: number
    hour_label: string
    risk_score: number
    risk_level: string
    alert_tier: string
    fire_pixels: number
    temperature: number
    wind_speed: number
    humidity: number
}

interface ReplayData {
    fire_id: string
    fire_name: string
    total_frames: number
    alert_frame: number | null
    frames: Frame[]
}

export default function Replay() {
    const navigate = useNavigate()
    const [replay, setReplay] = useState<ReplayData | null>(null)
    const [frameIdx, setFrameIdx] = useState(0)
    const [playing, setPlaying] = useState(true)
    const [loading, setLoading] = useState(true)
    const [speed, setSpeed] = useState(1)

    const frame = replay?.frames[frameIdx] ?? null
    const progress = replay ? (frameIdx / (replay.total_frames - 1)) * 100 : 0

    useEffect(() => {
        api.getReplayFrames('dixie_2021')
            .then((res: { data: ReplayData }) => {
                setReplay(res.data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!playing || !replay) return
        const id = setInterval(() => {
            setFrameIdx(prev => (prev + 1) % replay.total_frames)
        }, 800 / speed)
        return () => clearInterval(id)
    }, [playing, replay, speed])

    return (
        <div className="bg-background-light dark:bg-[#23110f] text-slate-900 dark:text-slate-100 font-display overflow-hidden h-screen w-screen relative">
            <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #23110f; }
        ::-webkit-scrollbar-thumb { background: #4b2520; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #6b352e; }
        .map-pattern {
          background-color: #1a0d0c;
          background-image: 
            radial-gradient(circle at 50% 50%, #2a1512 0%, transparent 10%),
            linear-gradient(rgba(255, 57, 31, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 57, 31, 0.05) 1px, transparent 1px);
          background-size: 100px 100px, 40px 40px, 40px 40px;
        }
        .replay-scanlines {
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
          background-size: 100% 4px;
          pointer-events: none;
        }
      `}</style>

            {/* Full Screen Map Background */}
            <div className="absolute inset-0 z-0 map-pattern w-full h-full flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?q=80&w=2000&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Heatmap / Fire Zones Simulation - Intensity based on frame risk */}
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/20 blur-[80px] rounded-full transition-all duration-500"
                    style={{
                        width: `${(frame?.risk_score ?? 0.5) * 800}px`,
                        height: `${(frame?.risk_score ?? 0.5) * 600}px`,
                        opacity: (frame?.risk_score ?? 0.5) * 0.4
                    }}
                />

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 replay-scanlines z-10 opacity-30 pointer-events-none" />

                {/* Tactical Overlay */}
                <div className="absolute top-[30%] left-[55%] flex flex-col items-center group">
                    <div className="w-24 h-24 border border-primary/30 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                        <div className="w-20 h-20 border border-primary/20 border-dashed rounded-full" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(255,57,31,0.8)]" />
                    <div className="mt-14 bg-black/80 backdrop-blur-sm border-l-2 border-primary px-3 py-1 text-xs font-mono text-primary">
                        SECTOR 4<br />
                        <span className="text-white">RISK: {frame?.risk_level.toUpperCase() ?? 'ANALYZING'}</span>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-primary animate-spin">radar</span>
                    <p className="text-white font-mono tracking-widest text-lg animate-pulse">RECONSTRUCTING TIMELINE...</p>
                </div>
            )}

            {/* UI Layers */}
            <div className="absolute top-6 left-6 z-50">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="group flex items-center justify-center gap-3 bg-[#361b17]/90 hover:bg-[#361b17] border border-white/10 hover:border-primary/50 text-white px-5 py-3 rounded-lg backdrop-blur-md transition-all shadow-lg hover:shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-white/70 group-hover:text-primary transition-colors">arrow_back</span>
                    <span className="text-sm font-bold tracking-wider uppercase">Command Center</span>
                </button>
            </div>

            <div className="absolute top-6 right-6 z-40 flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Incident Replay</span>
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        {replay?.fire_name.toUpperCase() ?? 'NO DATA'}
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                    </span>
                </div>
            </div>

            {/* HUD */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
                {frame?.alert_tier !== 'none' && (
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/40 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(255,57,31,0.2)]">
                            <span className="relative flex h-3 w-3">
                                <span className={`${frame?.alert_tier === 'emergency' ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-primary opacity-75`} />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                            </span>
                            <span className="text-primary font-bold tracking-wider text-sm uppercase">{frame?.alert_tier} ALERT TRIGGERED</span>
                        </div>
                    </div>
                )}

                <div className="bg-[#1a0d0c]/85 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Risk Score</span>
                                <span className="text-sm font-mono text-white">{(frame?.risk_score ?? 0).toFixed(4)}</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Hotspots</span>
                                <span className="text-sm font-mono text-white font-bold">{frame?.fire_pixels ?? 0}px</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Relative Humidity</span>
                                <span className="text-sm font-mono text-white">{frame?.humidity ?? 0}%</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Simulation Step</span>
                            <span className="text-lg font-mono font-medium text-white tabular-nums tracking-tight">
                                {frame?.hour_label ?? 'T+00:00'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        {/* Timeline Scrubber */}
                        <div className="relative w-full h-8 flex flex-col justify-center">
                            <div
                                className="h-2 w-full bg-white/10 rounded-full relative cursor-pointer"
                                onClick={(e) => {
                                    if (!replay) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const pct = x / rect.width;
                                    setFrameIdx(Math.floor(pct * (replay.total_frames - 1)));
                                }}
                            >
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary/60 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                                <div
                                    className="absolute top-1/2 size-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] -translate-x-1/2 -translate-y-1/2 border-2 border-primary transition-all duration-300"
                                    style={{ left: `${progress}%` }}
                                />
                                {replay?.alert_frame != null && (
                                    <div
                                        className="absolute top-0 h-full w-1 bg-primary shadow-[0_0_10px_#ff391f]"
                                        style={{ left: `${(replay.alert_frame / (replay.total_frames - 1)) * 100}%` }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                                {[1, 4, 12].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSpeed(s)}
                                        className={`px-3 py-1 text-xs font-mono rounded transition-all ${speed === s ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white'}`}
                                    >
                                        {s}×
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setFrameIdx(prev => Math.max(0, prev - 1))}
                                    className="text-white/60 hover:text-white p-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-3xl">skip_previous</span>
                                </button>
                                <button
                                    onClick={() => setPlaying(!playing)}
                                    className="flex items-center justify-center size-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_20px_rgba(255,57,31,0.4)] transition-all hover:scale-105"
                                >
                                    <span className="material-symbols-outlined text-3xl fill-current">{playing ? 'pause' : 'play_arrow'}</span>
                                </button>
                                <button
                                    onClick={() => setFrameIdx(prev => (prev + 1) % (replay?.total_frames ?? 1))}
                                    className="text-white/60 hover:text-white p-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-3xl">skip_next</span>
                                </button>
                            </div>

                            <div className="text-right flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase font-bold">Frame Index</span>
                                <span className="text-sm font-mono text-white">{frameIdx + 1} / {replay?.total_frames ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative SVGs */}
            <div className="absolute bottom-6 left-6 pointer-events-none opacity-20 hidden md:block">
                <svg height="80" viewBox="0 0 200 80" width="200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,80 L0,30 L20,10 L100,10" fill="none" stroke="white" strokeWidth="1" />
                    <text fill="white" fontFamily="monospace" fontSize="8" x="25" y="25 font-bold uppercase">Telemetry Channel A</text>
                    <rect fill="white" height="2" width="2" x="0" y="60" />
                    <rect fill="white" height="2" width="2" x="0" y="70" />
                </svg>
            </div>
        </div>
    )
}

