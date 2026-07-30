import React, { useEffect, useState } from 'react'
import { RefreshCcw, Trophy } from 'lucide-react'
import client from '../api/client.js'

export default function Habits() {
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await client.get('/api/habits/score')
    setScore(data)
    setLoading(false)
  }

  async function recalc() {
    setRecalculating(true)
    const { data } = await client.post('/api/habits/recalculate')
    setScore(data)
    setRecalculating(false)
  }

  const tier = (total) => {
    if (total >= 85) return { label: 'Elite Riser', color: 'text-emerald-300' }
    if (total >= 65) return { label: 'Consistent Waker', color: 'text-brand-300' }
    if (total >= 40) return { label: 'Building Momentum', color: 'text-amber-300' }
    return { label: 'Needs Attention', color: 'text-rose-300' }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Habit Score</h1>
          <p className="text-slate-400 text-sm mt-1">
            Weighted model: Wake-Up Consistency (35%) + Challenge Completion (25%) + Snooze Reduction (20%) + Sleep Adherence (20%)
          </p>
        </div>
        <button
          onClick={recalc}
          disabled={recalculating}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 transition-colors px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          <RefreshCcw size={16} className={recalculating ? 'animate-spin' : ''} /> Recalculate
        </button>
      </header>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-8 border border-white/10 flex flex-col items-center justify-center lg:col-span-1">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#6366f1" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${(score?.total_score ?? 0) * 3.27} 1000`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Trophy className="text-amber-400 mb-1" size={22} />
                <p className="text-3xl font-display font-bold">{score?.total_score ?? 0}</p>
              </div>
            </div>
            <p className={`mt-4 font-semibold ${tier(score?.total_score ?? 0).color}`}>{tier(score?.total_score ?? 0).label}</p>
          </div>

          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10 space-y-5">
            <ScoreRow label="Wake-Up Consistency" weight="35%" value={score?.wake_up_consistency} />
            <ScoreRow label="Challenge Completion Success" weight="25%" value={score?.challenge_completion} />
            <ScoreRow label="Snooze Reduction" weight="20%" value={score?.snooze_reduction} />
            <ScoreRow label="Sleep Schedule Adherence" weight="20%" value={score?.sleep_schedule_adherence} />
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreRow({ label, weight, value = 0 }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-200">{label} <span className="text-slate-500 text-xs">({weight})</span></span>
        <span className="text-slate-300">{value ?? 0}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300 transition-all duration-700"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  )
}
