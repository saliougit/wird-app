import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDailyKamil } from '../db'
import Layout from '../components/Layout'
import { Plus } from '@phosphor-icons/react'

export default function KamilDailyForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [defaultJuzz, setDefaultJuzz] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire'); return }
    if (!startDate) { setError('La date de début est obligatoire'); return }
    if (!endDate) { setError('La date de fin est obligatoire'); return }
    if (new Date(endDate) < new Date(startDate)) { setError('La date de fin doit être après le début'); return }

    setSaving(true)
    try {
      const id = await createDailyKamil({
        name: name.trim(),
        startDate,
        endDate,
        defaultJuzz: parseInt(defaultJuzz),
        description: ''
      })
      navigate(`/kamils-daily/${id}`, { replace: true })
    } catch (e) {
      setError('Erreur lors de la création')
      setSaving(false)
    }
  }

  return (
    <Layout title="Nouveau Kamil Quotidien" back>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Name */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold-pale to-white">
          <label className="label font-bold text-gold-dark mb-3">Nom de la période</label>
          <input
            className="input w-full rounded-xl border-2 border-gold-light text-lg"
            type="text"
            placeholder="ex: Ramadan 2026, Mouharram..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-soft to-white">
            <label className="label font-bold text-green-deep mb-3">Date de début</label>
            <input
              className="input w-full rounded-xl border-2 border-green-200"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-red-50 to-white">
            <label className="label font-bold text-red-600 mb-3">Date de fin</label>
            <input
              className="input w-full rounded-xl border-2 border-red-200"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Default Juzz */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white">
          <label className="label font-bold text-blue-700 mb-3">Juzz par défaut</label>
          <select
            className="input w-full rounded-xl border-2 border-blue-200"
            value={defaultJuzz}
            onChange={e => setDefaultJuzz(e.target.value)}
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>Juzz {i + 1}</option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-2">Le Juzz par défaut pour chaque jour (modifiable au quotidien)</p>
        </div>

        {error && (
          <div className="card rounded-2xl p-4 bg-red-50 border-2 border-red-200 flex items-start gap-3 animate-slideUp">
            <span className="text-xl">⚠️</span>
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1 rounded-xl py-3 font-bold text-sm">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex-1 rounded-xl py-3 font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {saving ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
