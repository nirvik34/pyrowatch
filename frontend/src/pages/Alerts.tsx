import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'

interface CountyAlert {
    county: string
    lat: number
    lon: number
    fips: string
    risk_score: number
    risk_level: string
    alert_tier: string
}

interface AlertHistoryItem {
    timestamp: string
    incident: string
    risk_score: number
    fire_pixels: number
    temperature: number
    alert_tier: string
}

export default function Alerts() {
    const navigate = useNavigate()
    const [counties, setCounties] = useState<CountyAlert[]>([])
    const [incident, setIncident] = useState<string>('Dixie Fire')
    const [history, setHistory] = useState<AlertHistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.getAlerts('CA')
            .then((res: any) => {
                setCounties(res.data.counties)
                setIncident(res.data.incident || 'Dixie Fire')
                setLoading(false)
            })
            .catch(() => setLoading(false))

        api.getAlertHistory()
            .then((res: any) => setHistory(res.data.history))
            .catch(e => console.error("History error", e))
    }, [])

    const getStatusInfo = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'emergency': return { color: 'primary', icon: 'campaign', label: 'Emergency', borderColor: 'border-l-primary', statColor: 'text-primary', bg: 'bg-primary' };
            case 'warning': return { color: 'warning', icon: 'warning', label: 'Warning', borderColor: 'border-l-warning', statColor: 'text-warning', bg: 'bg-warning' };
            case 'watch': return { color: 'watch', icon: 'visibility', label: 'Watch', borderColor: 'border-l-watch', statColor: 'text-watch', bg: 'bg-watch' };
            default: return { color: 'clear', icon: 'check_circle', label: 'Clear', borderColor: 'border-l-clear', statColor: 'text-clear', bg: 'bg-clear' };
        }
    }

    const counts = {
        emergency: counties.filter(c => c.alert_tier === 'emergency').length,
        warning: counties.filter(c => c.alert_tier === 'warning').length,
        watch: counties.filter(c => c.alert_tier === 'watch').length,
        clear: counties.filter(c => c.alert_tier === 'none').length,
    }

    const stats = [
        { label: 'Emergency', count: counts.emergency, color: 'text-primary', bg: 'bg-primary', icon: 'campaign', desc: 'Immediate action required', borderColor: 'border-primary/30' },
        { label: 'Warning', count: counts.warning, color: 'text-warning', bg: 'bg-warning', icon: 'warning', desc: 'High probability of threat', borderColor: 'border-warning/30' },
        { label: 'Watch', count: counts.watch, color: 'text-watch', bg: 'bg-watch', icon: 'visibility', desc: 'Conditions favorable for fire', borderColor: 'border-watch/30' },
        { label: 'Clear', count: counts.clear, color: 'text-clear', bg: 'bg-clear', icon: 'check_circle', desc: 'Normal operations', borderColor: 'border-clear/30' },
    ]


    return (
        <div className="bg-background-light dark:bg-[#23110f] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display selection:bg-primary selection:text-white">
            <style>{`
        /* Custom scrollbar for industrial feel */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1a0b0a; 
        }
        ::-webkit-scrollbar-thumb {
          background: #4b2520; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #ff391f; 
        }
        .status-border-l {
          border-left-width: 6px;
        }
      `}</style>

            {/* Top Navbar */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 bg-[#23110f]/95 backdrop-blur-md px-6 py-3 shadow-lg">
                <div className="flex items-center gap-4 text-white">
                    <div className="size-6 text-primary">
                        <span className="material-symbols-outlined text-3xl">local_fire_department</span>
                    </div>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wider uppercase">PyroWatch AI</h2>
                </div>
                <div className="flex flex-1 justify-end gap-8">
                    <nav className="hidden md:flex items-center gap-1">
                        <button onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded text-sm font-medium leading-normal transition-colors">Dashboard</button>
                        <button className="text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded text-sm font-bold leading-normal transition-colors">Alerts</button>
                        <button onClick={() => navigate('/replay')} className="text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded text-sm font-medium leading-normal transition-colors">Map View</button>
                        <button className="text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded text-sm font-medium leading-normal transition-colors">Resources</button>
                        <button className="text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded text-sm font-medium leading-normal transition-colors">Settings</button>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex cursor-pointer items-center justify-center overflow-hidden rounded h-9 px-4 bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-bold leading-normal tracking-wide uppercase"
                        >
                            <span className="truncate">Logout</span>
                        </button>
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary/30"
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop")' }}
                        ></div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary/80 mb-1">
                            <span className="material-symbols-outlined text-sm">grid_view</span>
                            <span className="text-xs font-bold tracking-widest uppercase">Jurisdiction Monitoring</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-tight flex items-center gap-4">
                            County Alert Board: {incident}
                            {incident !== 'Dixie Fire' && (
                                <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded animate-pulse">LIVE</span>
                            )}
                        </h1>
                        <p className="text-slate-400 text-base font-normal max-w-2xl mt-1">Real-time risk assessment and automated status tracking for {incident} sector.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#2e1a17] border border-white/10 rounded hover:bg-white/5 text-slate-300 text-sm font-medium transition-colors">
                            <span className="material-symbols-outlined text-lg">download</span>
                            Export Report
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/50 rounded hover:bg-primary/30 text-primary text-sm font-bold transition-colors">
                            <span className="material-symbols-outlined text-lg">add_alert</span>
                            New Alert
                        </button>
                    </div>
                </div>

                {/* Status Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className={`flex flex-col gap-1 rounded bg-[#2e1a17] border ${stat.borderColor} p-5 relative overflow-hidden group`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className={`material-symbols-outlined text-6xl ${stat.color}`}>{stat.icon}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`size-2 rounded-full ${stat.bg} ${stat.label === 'Emergency' ? 'animate-pulse' : ''}`}></span>
                                <p className={`${stat.color} text-xs font-bold tracking-widest uppercase`}>{stat.label}</p>
                            </div>
                            <p className="text-white text-4xl font-black font-mono">{stat.count}</p>
                            <p className="text-slate-500 text-xs mt-1">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                {/* System Activity Log (History) */}
                <div className="bg-[#2e1a17] rounded border border-white/5 overflow-hidden shadow-lg">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">history</span>
                            System Activity Log
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Stream: Connected</span>
                        </div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                        {history.length > 0 ? history.map((h, i) => (
                            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-1.5 rounded bg-${h.alert_tier === 'emergency' ? 'primary' : 'warning'}/10 border border-${h.alert_tier === 'emergency' ? 'primary' : 'warning'}/20`}>
                                        <span className={`material-symbols-outlined text-base ${h.alert_tier === 'emergency' ? 'text-primary' : 'text-warning'}`}>
                                            {h.alert_tier === 'emergency' ? 'campaign' : 'warning'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white uppercase tracking-tight">{h.incident}</span>
                                            <span className="text-[10px] px-1 bg-white/5 text-slate-500 rounded border border-white/5 font-mono">R:{h.risk_score}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(h.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="material-symbols-outlined text-[10px] text-slate-500">thermostat</span>
                                        <span className="text-xs text-white font-mono">{h.temperature.toFixed(1)}°C</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[10px] text-slate-500">grid_guides</span>
                                        <span className="text-xs text-white font-mono">{h.fire_pixels} Hotspots</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-500 text-xs font-mono uppercase tracking-widest italic opacity-50">
                                No significant historical anomalies detected in current window.
                            </div>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 bg-[#2e1a17] p-4 rounded border border-white/5">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 bg-[#1a0b0a] border border-white/10 rounded leading-5 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                            placeholder="Search county code, name, or jurisdiction ID..."
                            type="text"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 hidden xl:block">Filters:</span>
                        <button className="bg-primary text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide border border-transparent shadow-sm shadow-primary/20">All Statuses</button>
                        <button className="bg-[#1a0b0a] hover:bg-white/5 text-slate-400 hover:text-white px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wide border border-white/10 transition-colors">High Risk (&gt;0.8)</button>
                        <button className="bg-[#1a0b0a] hover:bg-white/5 text-slate-400 hover:text-white px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wide border border-white/10 transition-colors">Wind Advisory</button>
                        <button className="bg-[#1a0b0a] hover:bg-white/5 text-slate-400 hover:text-white px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wide border border-white/10 transition-colors">Evac Zones</button>
                        <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                        <button className="text-slate-400 hover:text-primary transition-colors p-1" title="Grid View">
                            <span className="material-symbols-outlined">grid_view</span>
                        </button>
                        <button className="text-white p-1" title="List View">
                            <span className="material-symbols-outlined">view_list</span>
                        </button>
                    </div>
                </div>

                {/* Alert Cards List */}
                <div className="flex flex-col gap-4 pb-12">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono gap-4">
                            <span className="material-symbols-outlined text-5xl animate-spin text-primary">radar</span>
                            <p className="tracking-widest uppercase">Fetching Regional Risk Data...</p>
                        </div>
                    ) : counties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono gap-4 border border-dashed border-white/10 rounded-lg">
                            <span className="material-symbols-outlined text-4xl">info</span>
                            <p className="tracking-widest uppercase">No active alerts for this region</p>
                        </div>
                    ) : counties.map((county, idx) => {
                        const status = getStatusInfo(county.alert_tier);
                        const riskScore = county.risk_score.toFixed(3);

                        // Derived content based on risk
                        const message = county.alert_tier === 'emergency'
                            ? `CRITICAL: Immediate action required for ${county.county}.`
                            : county.alert_tier === 'warning'
                                ? `ATTENTION: Elevated risk detected in ${county.county}.`
                                : `Monitoring ${county.county} jurisdiction.`;

                        const subMessage = county.alert_tier === 'emergency'
                            ? 'Evacuation orders may be in effect. Check local authority updates.'
                            : 'Atmospheric conditions favorable for rapid fire spread.';

                        return (
                            <div
                                key={idx}
                                className={`group relative bg-[#2e1a17] hover:bg-white/[0.02] border-y border-r border-white/5 rounded-r status-border-l ${status.borderColor} transition-colors duration-200`}
                            >
                                <div className="flex flex-col lg:flex-row items-stretch">
                                    {/* Main Info */}
                                    <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className={`text-xl font-bold tracking-tight ${county.alert_tier === 'none' ? 'text-slate-300' : 'text-white'}`}>{county.county}</h3>
                                                    <span className={`bg-${status.color}/20 text-${status.color} border border-${status.color}/30 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider`}>
                                                        Sector {idx + 1}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-sm font-medium">Jurisdiction ID: <span className="font-mono text-slate-500">CA-{county.fips}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`block text-3xl font-black font-mono leading-none text-${status.color}`}>{riskScore}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest text-${status.color}/80`}>Risk Score</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 mt-1">
                                            <span className={`material-symbols-outlined mt-0.5 text-${status.color}`}>{status.icon}</span>
                                            <div>
                                                <p className={`${county.alert_tier === 'none' ? 'text-slate-300' : 'text-white'} font-semibold text-sm`}>{message}</p>
                                                <p className="text-slate-400 text-xs">{subMessage}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Telemetry Data (Dynamic simplified) */}
                                    <div className="w-full lg:w-96 bg-black/20 border-t lg:border-t-0 lg:border-l border-white/5 p-4 flex flex-col justify-center gap-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`flex items-center gap-2 ${county.alert_tier === 'none' ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-base">local_fire_department</span>
                                                Risk Level
                                            </span>
                                            <span className={`font-mono font-bold text-white uppercase`}>{county.risk_level}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`flex items-center gap-2 ${county.alert_tier === 'none' ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-base">location_on</span>
                                                Coordinates
                                            </span>
                                            <span className={`font-mono font-bold text-white`}>{county.lat.toFixed(2)}°, {county.lon.toFixed(2)}°</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`flex items-center gap-2 ${county.alert_tier === 'none' ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-base">thermostat</span>
                                                Status
                                            </span>
                                            <span className={`font-mono font-bold text-${status.color} uppercase`}>{status.label}</span>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="w-full lg:w-48 bg-black/40 border-t lg:border-t-0 lg:border-l border-white/5 p-4 flex flex-col justify-center gap-2">
                                        {county.alert_tier === 'emergency' && (
                                            <button
                                                onClick={() => {
                                                    const toast = document.createElement('div');
                                                    toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-8 py-4 rounded shadow-2xl font-black tracking-widest uppercase flex items-center gap-4 border-2 border-white/20 animate-bounce';
                                                    toast.innerHTML = `<span class="material-symbols-outlined">local_fire_department</span> DISPATCHING EMERGENCY UNITS TO ${county.county}`;
                                                    document.body.appendChild(toast);
                                                    setTimeout(() => toast.remove(), 4000);
                                                }}
                                                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>Dispatch</span>
                                                <span className="material-symbols-outlined text-base">near_me</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className={`w-full text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 ${county.alert_tier === 'emergency'
                                                ? 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-white/20'
                                                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                                }`}
                                        >
                                            <span>Map View</span>
                                            <span className="material-symbols-outlined text-base">map</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    )
}
