import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import client from '../api/client.js'

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe']

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [challengeHistory, setChallengeHistory] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [s, ch] = await Promise.all([
      client.get('/api/analytics/summary'),
      client.get('/api/challenges/history?limit=50'),
    ])
    setSummary(s.data)
    setHistory(
      s.data.score_history.map((h) => ({
        date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.total_score,
      }))
    )
    setChallengeHistory(ch.data)
  }

  async function downloadCsv() {
    const res = await client.get('/api/reports/export/csv', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'habit_report.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const pieData = summary
    ? [
        { name: 'Wake Consistency', value: summary.wake_up_consistency },
        { name: 'Challenge Completion', value: summary.challenge_completion_rate },
        { name: 'Snooze Reduction', value: summary.snooze_reduction },
        { name: 'Sleep Adherence', value: summary.sleep_schedule_adherence },
      ]
    : []

  const typeCounts = challengeHistory.reduce((acc, c) => {
    acc[c.challenge_type] = (acc[c.challenge_type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics & Insights</h1>
          <p className="text-slate-400 text-sm mt-1">Behavioral analytics from your wake-up and challenge history.</p>
        </div>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-2 border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-xl text-sm text-slate-200"
        >
          <Download size={16} /> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h2 className="font-display font-semibold text-lg mb-4">Habit Score Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#161f38', border: 'none', borderRadius: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10">
          <h2 className="font-display font-semibold text-lg mb-4">Score Composition</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ background: '#161f38', border: 'none', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricTile label="Total Alarms" value={summary?.total_alarms ?? 0} />
        <MetricTile label="Total Challenge Attempts" value={summary?.total_attempts ?? 0} />
        <MetricTile label="Total Snoozes" value={summary?.total_snoozes ?? 0} />
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="font-display font-semibold text-lg mb-4">Challenge Types Practiced</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeCounts).length === 0 && <p className="text-slate-400 text-sm">No challenge attempts yet.</p>}
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="px-4 py-3 rounded-xl bg-white/5 text-sm">
              <p className="capitalize font-medium">{type}</p>
              <p className="text-slate-400">{count} attempts</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10 overflow-x-auto">
        <h2 className="font-display font-semibold text-lg mb-4">Recent Challenge History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-white/10">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Difficulty</th>
              <th className="py-2 pr-4">Result</th>
              <th className="py-2 pr-4">Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {challengeHistory.slice(0, 15).map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-2 pr-4">{new Date(c.created_at).toLocaleString()}</td>
                <td className="py-2 pr-4 capitalize">{c.challenge_type}</td>
                <td className="py-2 pr-4 capitalize">{c.difficulty}</td>
                <td className="py-2 pr-4">
                  {c.is_correct === true && <span className="text-emerald-400">Correct</span>}
                  {c.is_correct === false && <span className="text-rose-400">Incorrect</span>}
                  {c.is_correct === null && <span className="text-slate-500">Pending</span>}
                </td>
                <td className="py-2 pr-4">{c.time_to_solve_seconds ? c.time_to_solve_seconds.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10">
      <p className="text-3xl font-display font-bold">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}
