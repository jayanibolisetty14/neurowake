import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, AlarmClock, LineChart, Trophy, UserCircle2,
  ShieldCheck, LogOut, Menu, X, BellRing,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'
import RingModal from './RingModal.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/alarms', label: 'Alarms', icon: AlarmClock },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/habits', label: 'Habit Score', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ringingAlarm, setRingingAlarm] = useState(null)
  const checkedMinuteRef = useRef(null)

  // Client-side scheduler: polls every 15s and rings any active alarm whose
  // scheduled time matches the current minute (and hasn't rung this minute).
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: alarms } = await client.get('/api/alarms')
        const now = new Date()
        const hh = String(now.getHours()).padStart(2, '0')
        const mm = String(now.getMinutes()).padStart(2, '0')
        const nowKey = `${hh}:${mm}`
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const today = dayNames[now.getDay()]

        if (checkedMinuteRef.current === nowKey) return

        const due = alarms.find((a) => {
          if (!a.is_active) return false
          if (a.time !== nowKey) return false
          const days = (a.days_of_week || '').split(',').map((d) => d.trim())
          return days.includes(today) || a.alarm_type === 'one_time'
        })

        if (due && !ringingAlarm) {
          checkedMinuteRef.current = nowKey
          setRingingAlarm(due)
        }
      } catch (e) {
        // silent fail (e.g. offline)
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [ringingAlarm])

  return (
    <div className="min-h-screen flex bg-night-950">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 glass border-r border-white/5 p-5">
        <Brand />
        <nav className="mt-8 flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          {(user?.role === 'admin' || user?.role === 'wellness_coach') && (
            <NavItem to="/admin" label="Admin" icon={ShieldCheck} />
          )}
        </nav>
        <UserFooter user={user} logout={logout} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 glass flex items-center justify-between px-4 py-3 border-b border-white/5">
        <Brand compact />
        <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-200">
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 glass p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <Brand compact />
              <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-300">
                <X size={20} />
              </button>
            </div>
            <nav className="mt-8 flex-1 space-y-1" onClick={() => setMobileOpen(false)}>
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
              {(user?.role === 'admin' || user?.role === 'wellness_coach') && (
                <NavItem to="/admin" label="Admin" icon={ShieldCheck} />
              )}
            </nav>
            <UserFooter user={user} logout={logout} />
          </div>
        </div>
      )}

      <main className="flex-1 pt-16 md:pt-0 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet context={{ triggerDemoAlarm: () => setRingingAlarm({ id: null, label: 'Demo Alarm', sound: 'classic_beep' }) }} />
      </main>

      {ringingAlarm && (
        <RingModal
          alarm={ringingAlarm}
          onResolved={() => {
            setRingingAlarm(null)
          }}
        />
      )}
    </div>
  )
}

function Brand({ compact }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
        <BellRing size={18} className="text-white" />
      </div>
      {!compact && (
        <div>
          <p className="font-display font-bold text-lg leading-none">NeuroWake</p>
          <p className="text-[11px] text-slate-400 leading-none mt-1">Cognitive Alarm Platform</p>
        </div>
      )}
    </div>
  )
}

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-600/90 text-white shadow-glow'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

function UserFooter({ user, logout }) {
  return (
    <div className="mt-6 pt-4 border-t border-white/5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand-800 flex items-center justify-center text-sm font-semibold uppercase">
          {user?.username?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user?.username}</p>
          <p className="text-xs text-slate-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg py-2 transition-colors"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  )
}
