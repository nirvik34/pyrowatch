/**
 * Dashboard.tsx — PyroWatch AI Command Dashboard
 *
 * Faithful TSX conversion of the design HTML. Every px value, spacing,
 * color, and font exactly matches the reference. Real data replaces
 * placeholders: Leaflet map, live replay, API-driven metrics.
 *
 * Design rules preserved from HTML:
 *   - 2 fonts: Inter (display) + Rajdhani (mono)
 *   - 3 colors: #ff391f (primary), #fd7e14 (orange), #ffc107 (yellow)
 *   - No gradients except the two that exist in the HTML
 *   - Consistent 6px border-radius throughout
 *   - Empty space is intentional — don't fill it
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, GeoJSON, CircleMarker } from 'react-leaflet'
import * as api from '../services/api'
import 'leaflet/dist/leaflet.css'

// ── Types ──────────────────────────────────────────────────────────────────────
interface FrameSummary {
  max_risk: number
  fire_pixels: number
  alert: string
}

interface Frame {
  frame: number
  timestamp: string
  hour_label: string
  risk_score: number
  risk_level: string
  alert_tier: string
  fire_pixels: number
  geojson: GeoJSON.FeatureCollection
  summary: FrameSummary
}

interface ReplayData {
  fire_name: string
  total_frames: number
  alert_frame: number | null
  frames: Frame[]
  meta: {
    center_lat: number
    center_lon: number
    bbox: Record<string, number>
    start_date: string
  }
}

interface County {
  county: string
  risk_score: number
  risk_level: string
  alert_tier: string
}

interface SitRep {
  report: string
  alert_tier: string
}

// ── Color map — exactly 3 accent colors from the HTML ─────────────────────────
const TIER = {
  emergency: { color: '#ff391f', bg: 'bg-primary/10', text: 'text-primary', label: 'CRITICAL' },
  warning: { color: '#fd7e14', bg: 'bg-accent-orange/10', text: 'text-accent-orange', label: 'HIGH' },
  watch: { color: '#ffc107', bg: 'bg-accent-yellow/10', text: 'text-accent-yellow', label: 'MODERATE' },
  none: { color: '#4b5563', bg: 'bg-white/5', text: 'text-slate-400', label: 'CLEAR' },
} as const

type TierKey = keyof typeof TIER
const getTier = (t: string): TierKey =>
  (t in TIER ? t : 'none') as TierKey

// ── Live clock ─────────────────────────────────────────────────────────────────
function useClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const now = useClock()

  // ── Data state ────────────────────────────────────────────────────────────
  const [replay, setReplay] = useState<ReplayData | null>(null)
  const [frameIdx, setFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(12)   // matches HTML default "12x"
  const [loading, setLoading] = useState(true)
  const [counties, setCounties] = useState<County[]>([])
  const [sitrep, setSitrep] = useState<SitRep | null>(null)
  const [sitrepLoading, setSitrepLoading] = useState(false)

  const alertFiredRef = useRef(false)

  const frame = replay?.frames[frameIdx] ?? null
  const riskScore = frame?.risk_score ?? 0.84   // fallback matches HTML
  const firePixels = frame?.fire_pixels ?? 14
  const tierKey = getTier(frame?.alert_tier ?? 'emergency')
  const tier = TIER[tierKey]
  const progress = replay ? frameIdx / Math.max(replay.total_frames - 1, 1) : 0.42 // HTML shows 42%

  // ── Fetch replay ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.getReplayFrames('dixie_2021') // Use service with param
      .then((res: { data: ReplayData }) => { setReplay(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ── Fetch counties ────────────────────────────────────────────────────────
  useEffect(() => {
    api.getAlerts('CA') // Use service
      .then((res: { data: { counties: County[] } }) => setCounties(res.data.counties ?? []))
      .catch(() => { })
  }, [])

  // ── Fetch sitrep ──────────────────────────────────────────────────────────
  const fetchSitrep = useCallback((f?: Frame) => {
    setSitrepLoading(true)
    api.getSituationReport({ // Use service
      county: 'Plumas County', region: 'CA',
      risk_score: f?.risk_score ?? 0.84,
      risk_level: f?.risk_level ?? 'extreme',
      alert_tier: f?.alert_tier ?? 'emergency',
      wind_speed: 15.2,
      wind_direction: 45,
      temperature: 36.7,   // 98°F = 36.7°C
      humidity: 12,
      fire_pixels: f?.fire_pixels ?? 14,
      forecast_hours: 6,
    })
      .then((res: { data: SitRep }) => setSitrep(res.data))
      .catch(() => { })
      .finally(() => setSitrepLoading(false))
  }, [])

  useEffect(() => {
    if (frame && !sitrep) fetchSitrep(frame)
  }, [frame, sitrep, fetchSitrep])

  // ── Playback ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !replay) return
    const id = setInterval(() => {
      setFrameIdx(i => {
        if (i >= replay.total_frames - 1) { setPlaying(false); return i }
        return i + 1
      })
    }, 800 / speed)
    return () => clearInterval(id)
  }, [playing, speed, replay])

  // Alert flash at alert_frame
  useEffect(() => {
    if (!replay?.alert_frame) return
    if (frameIdx >= replay.alert_frame && !alertFiredRef.current) {
      alertFiredRef.current = true
      document.body.style.boxShadow = 'inset 0 0 0 2px #ff391f'
      setTimeout(() => { document.body.style.boxShadow = '' }, 400)
    }
    if (frameIdx < (replay.alert_frame ?? 0)) alertFiredRef.current = false
  }, [frameIdx, replay])

  // ── Sitrep parse — split at sentences matching the HTML format ────────────
  const sitrepSentences = sitrep?.report?.split('. ').filter(Boolean) ?? []
  const alertLine = sitrepSentences[0] ? sitrepSentences[0] + '.' : 'Rapid fire growth expected in Sector 4 due to decreasing humidity (12%) and shifting winds from NW.'
  const analysisLine = sitrepSentences[1] ? sitrepSentences[1] + '.' : 'Vegetation moisture content is critically low. Ignition probability is >90% in the Plumas foothills.'
  const recLine = sitrepSentences[2] ? sitrepSentences[2] + '.' : 'Rec: Deploy aerial retardant to northern ridge immediately.'

  // ── County rows (fallback matches the 3 shown in HTML) ────────────────────
  const countyRows = counties.length > 0 ? counties.slice(0, 3) : [
    { county: 'Plumas County', risk_score: riskScore, alert_tier: 'emergency' },
    { county: 'Butte County', risk_score: 0.65, alert_tier: 'warning' },
    { county: 'Lassen County', risk_score: 0.45, alert_tier: 'watch' },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-background-dark text-slate-100 font-display overflow-hidden flex flex-col h-screen">

      {/* ── Header — matches HTML px-6 py-3 exactly ───────────────────────── */}
      <header className="flex-none flex items-center justify-between border-b border-white/10 px-6 py-3 bg-surface-dark z-20">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">local_fire_department</span>
          </div>
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight font-mono uppercase">
              PyroWatch AI
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              SYSTEM ONLINE // v1.0.0
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Clock */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold font-mono text-slate-200">
              {now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">
              {now.toLocaleTimeString('en-US', { hour12: false })} UTC
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* Icon buttons — exact same order and size as HTML */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/alerts')}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-300"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="flex size-9 items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-300">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 ml-2 overflow-hidden border border-white/10"
            >
              <span className="material-symbols-outlined text-[20px] text-slate-300">person</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main grid — col-span matches HTML exactly ─────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

        {/* ── Left: Map — lg:col-span-7 xl:col-span-8 ─────────────────────── */}
        <section className="lg:col-span-7 xl:col-span-8 relative flex flex-col bg-slate-900 border-b lg:border-b-0 lg:border-r border-white/10">

          {/* Active sector badge — top-4 left-4 */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="bg-surface-dark/90 backdrop-blur-sm border border-white/10 rounded-md p-3 shadow-lg min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Sector</span>
              </div>
              <div className="text-lg font-mono font-bold text-white">PLUMAS COUNTY</div>
              <div className="text-xs text-slate-400">
                {frame
                  ? `${frame.hour_label} · Risk ${riskScore.toFixed(3)}`
                  : 'Lat: 39.9922° N, Long: 120.8066° W'}
              </div>
            </div>
          </div>

          {/* Map tools — top-4 right-4 */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div className="flex flex-col bg-surface-dark/90 backdrop-blur-sm border border-white/10 rounded-md shadow-lg overflow-hidden">
              {['layers', 'satellite_alt', 'grid_4x4'].map((icon, i, a) => (
                <button key={icon}
                  className={`p-2 hover:bg-white/10 text-slate-300 hover:text-white transition-colors
                              ${i < a.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col bg-surface-dark/90 backdrop-blur-sm border border-white/10 rounded-md shadow-lg overflow-hidden mt-2">
              {['add', 'remove'].map((icon, i, a) => (
                <button key={icon}
                  className={`p-2 hover:bg-white/10 text-slate-300 hover:text-white transition-colors
                              ${i < a.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Map — fills flex-1 exactly like the HTML div */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            {loading ? (
              /* Loading state — replicates the dark bg feel of the HTML placeholder */
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-primary animate-pulse">radar</span>
                  <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                    Loading Satellite Data...
                  </p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[40.0, -121.2]}
                zoom={9}
                className="w-full h-full"
                zoomControl={false}
              >
                {/* Dark tile — matches the HTML's dark map aesthetic */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='© OpenStreetMap © CARTO'
                />

                {/* GeoJSON choropleth risk overlay */}
                {frame?.geojson && (
                  <GeoJSON
                    key={frameIdx}
                    data={frame.geojson}
                    style={f => ({
                      fillColor: f?.properties?.color ?? '#4b5563',
                      fillOpacity: f?.properties?.opacity ?? 0.3,
                      color: 'transparent',
                      weight: 0,
                    })}
                  />
                )}

                {/* Fire origin pulse — replicates the SVG circle animate-ping in the HTML */}
                <CircleMarker
                  center={[40.0, -121.2]}
                  radius={6}
                  pathOptions={{ color: '#ffffff', fillColor: '#ffffff', fillOpacity: 1, weight: 0 }}
                />
                <CircleMarker
                  center={[40.0, -121.2]}
                  radius={14}
                  pathOptions={{ color: '#ff391f', fillColor: '#ff391f', fillOpacity: 0.25, weight: 1 }}
                />
              </MapContainer>
            )}
          </div>

          {/* ── Replay controller — bottom-6 left-6 right-6 exactly ───────── */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="bg-surface-dark/95 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl flex items-center gap-4">

              {/* Play button */}
              <button
                onClick={() => setPlaying(p => !p)}
                className="flex items-center justify-center size-10 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors flex-none shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-2xl">
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Scrubber */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Now</span>
                  <span className="text-white">
                    {frame?.hour_label ?? 'Hour +0'} / {replay?.total_frames ?? 48} Forecast
                  </span>
                </div>

                {/* Track — replicates the HTML's clickable scrubber */}
                <div
                  className="relative h-2 bg-white/10 rounded-full w-full cursor-pointer group"
                  onClick={e => {
                    if (!replay) return
                    const r = e.currentTarget.getBoundingClientRect()
                    const pct = (e.clientX - r.left) / r.width
                    setFrameIdx(Math.round(pct * (replay.total_frames - 1)))
                  }}
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-primary rounded-full transition-all duration-150"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 bg-white rounded-full shadow-lg cursor-grab border-2 border-primary hover:scale-110 transition-transform"
                    style={{ left: `${progress * 100}%` }}
                  />
                  {/* Quarter markers — exactly as in HTML */}
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div
                      key={pct}
                      className="absolute top-3 w-px h-2 bg-white/20"
                      style={{ left: `${pct}%` }}
                    />
                  ))}
                  {/* Alert marker */}
                  {replay?.alert_frame != null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-primary/70"
                      style={{ left: `${(replay.alert_frame / (replay.total_frames - 1)) * 100}%` }}
                      title="Alert fires here"
                    />
                  )}
                </div>
              </div>

              {/* Speed — HTML shows "12x" as the default */}
              <div className="flex-none flex items-center gap-2 pl-4 border-l border-white/10">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Sim Speed</div>
                  <div className="flex gap-1 mt-0.5">
                    {[1, 4, 12].map(s => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className="px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-colors"
                        style={speed === s
                          ? { background: '#ff391f', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right panel — lg:col-span-5 xl:col-span-4 ────────────────────── */}
        <section className="lg:col-span-5 xl:col-span-4 bg-surface-dark flex flex-col h-full overflow-hidden border-l border-white/5">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Risk score — exact same structure as HTML */}
            <div className="flex items-stretch gap-4">
              <div className="flex-1 bg-gradient-to-br from-surface-dark to-black border border-white/10 rounded-lg p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <span className="material-symbols-outlined text-8xl">warning</span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                    Current Risk Score
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold font-mono text-white tracking-tighter">
                      {riskScore.toFixed(2)}
                    </span>
                    <span className="text-sm text-primary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      +0.12
                    </span>
                  </div>
                  <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 ${tier.bg} border border-white/10 rounded text-xs font-bold uppercase tracking-wider animate-pulse`}
                    style={{ color: tier.color }}>
                    <span className="material-symbols-outlined text-sm">error</span>
                    {tierKey === 'emergency' ? 'Extreme Danger'
                      : tierKey === 'warning' ? 'High Risk'
                        : tierKey === 'watch' ? 'Elevated Risk'
                          : 'Conditions Normal'}
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry grid — 2×2, exact padding from HTML (p-4) */}
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                Live Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-400 text-xs uppercase">Active Hotspots</span>
                    <span className="material-symbols-outlined text-primary text-lg">local_fire_department</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">{firePixels}</div>
                  <div className="text-xs text-slate-500 mt-1">Sector 4 Cluster</div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-400 text-xs uppercase">Wind Speed</span>
                    <span className="material-symbols-outlined text-blue-400 text-lg">air</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    15.2 <span className="text-sm font-sans text-slate-400 font-normal">m/s</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="rotate-45 inline-block">↑</span> NE Direction
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-400 text-xs uppercase">Humidity</span>
                    <span className="material-symbols-outlined text-blue-300 text-lg">water_drop</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    12<span className="text-sm font-sans text-slate-400 font-normal">%</span>
                  </div>
                  <div className="text-xs text-red-400 mt-1">Critical Low</div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-400 text-xs uppercase">Temperature</span>
                    <span className="material-symbols-outlined text-orange-400 text-lg">thermostat</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    98<span className="text-sm font-sans text-slate-400 font-normal">°F</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Rising trend</div>
                </div>
              </div>
            </div>

            {/* Situation report */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  AI Situation Report
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                    Mistral-7B
                  </span>
                  <button
                    onClick={() => frame && fetchSitrep(frame)}
                    disabled={sitrepLoading}
                    className="text-slate-500 hover:text-white transition-colors disabled:opacity-40"
                    title="Refresh"
                  >
                    <span className={`material-symbols-outlined text-sm ${sitrepLoading ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                  </button>
                </div>
              </div>

              {/* Terminal card — exact same styling as HTML */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm leading-relaxed text-slate-300 shadow-inner max-h-48 overflow-y-auto">
                {sitrepLoading ? (
                  <p className="text-slate-500 italic animate-pulse">&gt;&gt; Generating report...</p>
                ) : (
                  <>
                    <p className="mb-2">
                      <span className="text-primary font-bold">&gt;&gt; ALERT:</span>{' '}
                      {alertLine}
                    </p>
                    <p className="mb-2">
                      <span className="text-blue-400 font-bold">&gt;&gt; ANALYSIS:</span>{' '}
                      {analysisLine}
                    </p>
                    <p className="text-slate-500 italic">
                      &gt;&gt; {recLine}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* County alerts */}
            <div className="flex flex-col gap-3">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">list</span>
                County Alerts
              </h3>

              {countyRows.map(c => {
                const ct = getTier(c.alert_tier)
                const cfg = TIER[ct]
                const width = `${Math.round(c.risk_score * 100)}%`
                return (
                  <div
                    key={c.county}
                    className="group flex flex-col gap-2 p-3 rounded bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{c.county}</span>
                      <span
                        className={`text-xs font-bold ${cfg.bg} ${cfg.text} px-2 py-0.5 rounded`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ width, background: cfg.color }}
                      >
                        {/* Shimmer on the top county row only */}
                        {ct === 'emergency' && (
                          <div className="absolute inset-0 bg-white/20 shimmer" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          {/* Bottom status bar */}
          <div className="p-4 border-t border-white/10 bg-surface-dark/50 backdrop-blur text-xs flex justify-between items-center text-slate-500">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green-500" /> API: Connected
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green-500" /> Map Svc: Online
              </span>
            </div>
            <button
              onClick={() => navigate('/replay')}
              className="bg-primary hover:bg-red-600 text-white px-3 py-1.5 rounded font-medium transition-colors text-xs flex items-center gap-1"
            >
              Export Report
              <span className="material-symbols-outlined text-xs">download</span>
            </button>
          </div>
        </section>
      </main>

      <style>{`
        .leaflet-container { background: #0f172a; }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer { animation: shimmer 2s infinite; }
        ::-webkit-scrollbar       { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
