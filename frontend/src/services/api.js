

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})


if (import.meta.env.DEV) {
  client.interceptors.request.use(req => {
    console.log(`🔥 API →  ${req.method?.toUpperCase()} ${req.url}`)
    return req
  })
  client.interceptors.response.use(
    res => { console.log(`✅ API ← ${res.status} ${res.config.url}`); return res },
    err => { console.error(`❌ API ← ${err.response?.status} ${err.config?.url}`, err.message); return Promise.reject(err) }
  )
}




export const ping = () => client.get('/health')


export const getRiskMap = (region, date) =>
  client.get('/risk-map', { params: { region, date } })


export const getForecast = (lat, lon) =>
  client.get('/forecast', { params: { lat, lon, hours: 6 } })


export const getSituationReport = (riskData) =>
  client.post('/situation-report', riskData)


export const getReplayFrames = (fireId) =>
  client.get('/replay', { params: { fire_id: fireId } })


export const getAlerts = (region) =>
  client.get('/alerts', { params: { region } })