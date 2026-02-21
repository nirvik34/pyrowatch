import React, { useState } from 'react'

export default function App() {
  const [status] = useState('Phase 1 — Data Pipeline Ready ✅')

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔥</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ef4444', margin: 0 }}>
          PyroWatch AI
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          AI-Driven Wildfire Early Warning System
        </p>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>EnviroCast GEO Hackathon</p>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '2rem', maxWidth: '480px', width: '90%', textAlign: 'center' }}>
        <div style={{ color: '#22c55e', fontWeight: '600', fontSize: '1.1rem', marginBottom: '1rem' }}>
          ✅ {status}
        </div>
        <p style={{ color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
          Backend data pipeline is wired. Run{' '}
          <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#fb923c' }}>
            python scripts/verify_phase1.py
          </code>{' '}
          to confirm all checks pass, then move to Phase 2.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
          {[
            ['NASA FIRMS', 'Dixie Fire 2021'],
            ['NOAA Weather', 'Plumas County, CA'],
            ['LSTM Features', '10 engineered'],
            ['Featherless', 'Credits claimed'],
          ].map(([label, val]) => (
            <div key={label} style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ color: '#64748b' }}>{label}</div>
              <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
        {['Data ✅', 'ML 🔜', 'API 🔜', 'Dashboard 🔜', 'Demo 🔜'].map((phase, i) => (
          <div key={i} style={{
            padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '500',
            background: i === 0 ? '#166534' : '#1e293b',
            color: i === 0 ? '#86efac' : '#475569',
            border: `1px solid ${i === 0 ? '#166534' : '#334155'}`
          }}>
            {phase}
          </div>
        ))}
      </div>
    </div>
  )
}