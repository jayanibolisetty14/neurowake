import React, { useEffect, useState } from 'react'
import { Users, Activity, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Admin() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [s, u] = await Promise.all([
        client.get('/api/admin/stats'),
        client.get('/api/admin/users'),
      ])
      setStats(s.data)
      setUsers(u.data)
    } catch (e) {
      setError('You do not have permission to view this page.')
    }
  }

  if (user?.role !== 'admin' && user?.role !== 'wellness_coach') {
    return (
      <div className="glass rounded-2xl p-8 border border-white/10 flex items-center gap-3 text-slate-300">
        <ShieldAlert className="text-rose-400" /> This area is restricted to Administrators and Wellness Coaches.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide analytics and user management.</p>
      </header>

      {error && <p className="text-rose-400">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile icon={Users} label="Total Users" value={stats.total_users} />
          <Tile icon={Activity} label="Total Alarms" value={stats.total_alarms} />
          <Tile icon={CheckCircle2} label="Correct Attempts" value={`${stats.correct_attempts}/${stats.total_attempts}`} />
          <Tile icon={TrendingUp} label="Avg. Habit Score" value={stats.average_habit_score} />
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-white/10 overflow-x-auto">
        <h2 className="font-display font-semibold text-lg mb-4">Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-white/10">
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Difficulty</th>
              <th className="py-2 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="py-2 pr-4">{u.username}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4 capitalize">{u.role.replace('_', ' ')}</td>
                <td className="py-2 pr-4 capitalize">{u.current_difficulty}</td>
                <td className="py-2 pr-4">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10">
      <Icon size={20} className="text-brand-400 mb-2" />
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}
