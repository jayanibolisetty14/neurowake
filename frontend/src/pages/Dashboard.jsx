import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlarmClock, Trophy, Flame, Timer, PlayCircle, Sparkles } from 'lucide-react'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import RingModal from '../components/RingModal.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const { triggerDemoAlarm } = useOutletContext() || {}
  const [summary, setSummary] = useState(null)
  const [alarms, setAlarms] = useState([])
  const [demoRinging, setDemoRinging] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [s, a] = await Promise.all([
        client.get('/api/analytics/summary'),
        client.get('/api/alarms'),
      ])
      setSummary(s.data)
      setAlarms(a.data)
    } finally {
      setLoading(false)
    }
  }

  const nextAlarm = alarms.filter((a) => a.is_active).sort((a, b) => a.time.localeCompare(b.time))[0]

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Good to see you, {user?.username} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's how your wake-up habits are trending.</p>
        </div>
        <button
          onClick={() => setDemoRinging(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 transition-colors px-4 py-2.5 rounded-xl font-semibold text-sm"
        >
          <PlayCircle size={18} /> Try a demo wake-up challenge
        </button>
      </header>

      {loading ? (
        <p className="text-slate-400">Loading your dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Trophy} label="Habit Score" value={`${summary?.habit_score ?? 0}`} suffix="/100" accent="from-amber-500 to-orange-600" />
            <StatCard icon={AlarmClock} label="Active Alarms" value={alarms.filter((a) => a.is_active).length} accent="from-brand-500 to-brand-700" />
            <StatCard icon={Flame} label="Snoozes Logged" value={summary?.total_snoozes ?? 0} accent="from-rose-500 to-rose-700" />
            <StatCard icon={Timer} label="Avg. Solve Time" value={summary?.avg_time_to_solve ? `${summary.avg_time_to_solve}s` : '—'} accent="from-emerald-500 to-emerald-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">Habit Score Breakdown</h2>
              </div>
              <div className="space-y-4">
                <Bar label="Wake-Up Consistency (35%)" value={summary?.wake_up_consistency} />
                <Bar label="Challenge Completion (25%)" value={summary?.challenge_completion_rate} />
                <Bar label="Snooze Reduction (20%)" value={summary?.snooze_reduction} />
                <Bar label="Sleep Schedule Adherence (20%)" value={summary?.sleep_schedule_adherence} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <h2 className="font-display font-semibold text-lg mb-4">Next Alarm</h2>
              {nextAlarm ? (
                <div>
                  <p className="text-4xl font-display font-bold text-brand-300">{nextAlarm.time}</p>
                  <p className="text-slate-400 text-sm mt-1">{nextAlarm.label}</p>
                  <p className="text-xs text-slate-500 mt-3">{nextAlarm.days_of_week}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No active alarms. Head to the Alarms tab to create one.</p>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-brand-400" />
              <h2 className="font-display font-semibold text-lg">Personalized Recommendations</h2>
            </div>
            <ul className="space-y-2">
              {(summary?.recommendations || []).map((r, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-brand-400">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {demoRinging && (
        <RingModal
          alarm={{ id: null, label: 'Demo Alarm', sound: 'classic_beep' }}
          onResolved={() => {
            setDemoRinging(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, suffix, accent }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-display font-bold">
        {value}
        {suffix && <span className="text-sm text-slate-400 font-normal">{suffix}</span>}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}

function Bar({ label, value = 0 }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value ?? 0}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-700"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  )
}
