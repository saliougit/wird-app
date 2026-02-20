import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createKhassidaBatch } from '../db'
import Layout from '../components/Layout'
import { Plus, X } from '@phosphor-icons/react'

export default function KhassidaBatchForm() {
  const navigate = useNavigate()
  const [periodName, setPeriodName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [khassidas, setKhassidas] = useState([{ name: '', targetCount: null, hasLimit: false }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAddKhassida = () => {
    setKhassidas([...khassidas, { name: '', targetCount: null, hasLimit: false }])
  }

  const handleRemoveKhassida = (idx) => {
    setKhassidas(khassidas.filter((_, i) => i !== idx))
  }

  const handleToggleLimit = (idx) => {
    const newKh = [...khassidas]
    newKh[idx].hasLimit = !newKh[idx].hasLimit
    if (!newKh[idx].hasLimit) newKh[idx].targetCount = null
    else if (!newKh[idx].targetCount) newKh[idx].targetCount = 1
    setKhassidas(newKh)
  }

  const handleSubmit = async () => {
    if (!periodName.trim()) { setError('Le nom de la période est obligatoire'); return }
    if (!startDate) { setError('La date de début est obligatoire'); return }
    if (!endDate) { setError('La date de fin est obligatoire'); return }
    if (khassidas.length === 0) { setError('Ajoutez au moins une Khassida'); return }
    if (khassidas.some(k => !k.name.trim())) { setError('Tous les noms de Khassida sont obligatoires'); return }
    if (khassidas.some(k => k.hasLimit && (!k.targetCount || k.targetCount < 1))) {
      setError('La limite doit être un nombre ≥ 1'); return
    }

    setSaving(true)
    try {
      const id = await createKhassidaBatch({
        periodName: periodName.trim(),
        startDate,
        endDate,
        khassidas: khassidas.map(k => ({
          name: k.name.trim(),
          targetCount: k.hasLimit ? parseInt(k.targetCount) : null,
          currentCount: 0
        }))
      })
      navigate(`/khassidas-batch/${id}`, { replace: true })
    } catch (e) {
      setError('Erreur lors de la création')
      setSaving(false)
    }
  }

  return (
    <Layout title="Nouvelle Liste de Khassidas" back>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Period Name */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold-pale to-white">
          <label className="label font-bold text-gold-dark mb-3">Nom de la période</label>
          <input
            className="input w-full rounded-xl border-2 border-gold-light text-lg"
            type="text"
            placeholder="ex: Ramadan 2026, Mouharram..."
            value={periodName}
            onChange={e => setPeriodName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-soft to-white">
            <label className="label font-bold text-green-deep mb-3">Début</label>
            <input
              className="input w-full rounded-xl border-2 border-green-200"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-red-50 to-white">
            <label className="label font-bold text-red-600 mb-3">Fin</label>
            <input
              className="input w-full rounded-xl border-2 border-red-200"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Khassidas List */}
        <div className="space-y-4">
          <p className="font-display text-lg text-green-deep font-bold">Khassidas à réciter</p>
          {khassidas.map((kh, idx) => (
            <div key={idx} className="card rounded-2xl p-5 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
              <div className="flex gap-3">
                <div className="flex-1 space-y-3">
                  <input
                    className="input w-full rounded-xl border-2 border-purple-200 placeholder-gray-400"
                    type="text"
                    placeholder="ex: Noor Darayni, Bishri..."
                    value={kh.name}
                    onChange={e => {
                      const newKh = [...khassidas]
                      newKh[idx].name = e.target.value
                      setKhassidas(newKh)
                    }}
                  />

                  {/* Limit toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleLimit(idx)}
                      className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                        kh.hasLimit
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-purple-600 border-purple-300'
                      }`}
                    >
                      {kh.hasLimit ? 'Limité' : '∞ Illimité'}
                    </button>

                    {kh.hasLimit && (
                      <div className="flex items-center gap-2">
                        <label className="label text-purple-700 mb-0 text-xs">×</label>
                        <input
                          className="input w-20 rounded-lg border-2 border-purple-200 text-center font-bold"
                          type="number"
                          min="1"
                          value={kh.targetCount || ''}
                          onChange={e => {
                            const newKh = [...khassidas]
                            newKh[idx].targetCount = parseInt(e.target.value) || 1
                            setKhassidas(newKh)
                          }}
                        />
                        <span className="text-xs text-purple-600 font-semibold">fois</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveKhassida(idx)}
                  className="btn-icon text-red-500 hover:bg-red-50 h-fit"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddKhassida}
            className="btn-secondary w-full rounded-xl py-3 font-bold flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Ajouter une Khassida
          </button>
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
