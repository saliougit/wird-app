import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { db } from './db'
import { initReminders } from './utils/notifications'
import BottomNav from './components/Layout'
import Dashboard from './pages/Dashboard'
import KamilList from './pages/KamilList'
import KamilForm from './pages/KamilForm'
import KamilDetail from './pages/KamilDetail'
import KhassidaList from './pages/KhassidaList'
import KhassidaForm from './pages/KhassidaForm'
import KhassidaDetail from './pages/KhassidaDetail'
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

        {/* Khassidas / Wirds */}
        <Route path="/khassidas" element={<KhassidaList />} />
        <Route path="/khassidas/new" element={<KhassidaForm />} />
        <Route path="/khassidas/:id" element={<KhassidaDetail />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  )
}
