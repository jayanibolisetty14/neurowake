import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BellRing, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, demoLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [demoing, setDemoing] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDemoLogin() {
    setError('')
    setDemoing(true)
    try {
      await demoLogin()
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Demo login failed. Please try again.')
    } finally {
      setDemoing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-glow">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 shadow-glow">
            <BellRing className="text-white" size={28} />
          </div>
          <h1 className="font-display font-bold text-2xl">NeuroWake</h1>
          <p className="text-sm text-slate-400">Wake up sharper, every day.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="your_username"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold transition-colors disabled:opacity-60"
          >
            <LogIn size={18} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoing}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-slate-200 hover:border-white/20 hover:text-white transition-colors disabled:opacity-60"
          >
            {demoing ? 'Starting demo…' : 'Skip login and demo'}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-6">
          New to NeuroWake?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
