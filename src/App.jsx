import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { db } from './db'
import { initReminders } from './utils/notifications'
import BottomNav from './components/Layout'
import Dashboard from './pages/Dashboard'
import KamilList from './pages/KamilList'
import KamilForm from './pages/KamilForm'
import KamilDetail from './pages/KamilDetail'
import KamilDailyForm from './pages/KamilDailyForm'
import KamilDailyDetail from './pages/KamilDailyDetail'
import KhassidaList from './pages/KhassidaList'
import KhassidaForm from './pages/KhassidaForm'
import KhassidaDetail from './pages/KhassidaDetail'
import KhassidaBatchForm from './pages/KhassidaBatchForm'
import KhassidaBatchDetail from './pages/KhassidaBatchDetail'
import Settings from './pages/Settings'

export default function App() {
  useEffect(() => {
    // Init reminders on app open
    const init = async () => {
      const [kamils, khassidas] = await Promise.all([
        db.kamils.toArray(),
        db.khassidas.toArray(),
      ])
      initReminders(kamils, khassidas)
    }
    init()
  }, [])

  return (
    <HashRouter>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Kamils */}
        <Route path="/kamils" element={<KamilList />} />
        <Route path="/kamils/new" element={<KamilForm />} />
        <Route path="/kamils/:id" element={<KamilDetail />} />
        <Route path="/kamils-daily/new" element={<KamilDailyForm />} />
        <Route path="/kamils-daily/:id" element={<KamilDailyDetail />} />

        {/* Khassidas / Wirds */}
        <Route path="/khassidas" element={<KhassidaList />} />
        <Route path="/khassidas/new" element={<KhassidaForm />} />
        <Route path="/khassidas/:id" element={<KhassidaDetail />} />
        <Route path="/khassidas-batch/new" element={<KhassidaBatchForm />} />
        <Route path="/khassidas-batch/:id" element={<KhassidaBatchDetail />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  )
}
