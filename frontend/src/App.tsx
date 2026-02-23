import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

// Placeholder pages — replace with real components in Phase 4
const ComingSoon = ({ page }: { page: string }) => (
  <div className="bg-background-dark min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <p className="text-slate-500 font-mono text-sm">ROUTE: /{page}</p>
      <h1 className="font-display font-bold text-4xl text-white">{page.toUpperCase()}</h1>
      <p className="text-slate-400 font-mono">Coming in Phase 4</p>
      <a href="/" className="inline-block mt-4 text-primary font-mono text-sm hover:underline">
        ← Back to Landing
      </a>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/replay" element={<ComingSoon page="replay" />} />
        <Route path="/alerts" element={<ComingSoon page="alerts" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
