import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createKhassida, createKhassidaBatch } from '../db'
import Layout from '../components/Layout'
import { Star, Moon, Heart, Circle, Plus, X, ListBullets } from '@phosphor-icons/react'

const CATEGORIES = [
  { key: 'khassida', label: 'Khassida', Icon: Star },
  { key: 'wird',     label: 'Wird',     Icon: Moon },
  { key: 'duaa',     label: 'Duaa',     Icon: Heart },
  { key: 'autre',    label: 'Autre',    Icon: Circle },
]

const RECURRENCES = [
  { key: 'none',    label: 'Une seule fois' },
  { key: 'daily',   label: 'Quotidien' },
  { key: 'weekly',  label: 'Hebdomadaire' },
  { key: 'monthly', label: 'Mensuel' },
]

export default function KhassidaForm() {
  const navigate = useNavigate()

  // Mode: 'regular' | 'batch'
  const [mode, setMode] = useState('regular')

  // Regular fields
  const [category, setCategory] = useState('khassida')
  const [name, setName] = useState('')
  const [targetTotal, setTargetTotal] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [deadline, setDeadline] = useState('')
  const [reminderTime, setReminderTime] = useState('20:00')
  const [notes, setNotes] = useState('')

  // Batch fields
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
    setError('')
    setSaving(true)
    try {
      if (mode === 'regular') {
        if (!name.trim()) { setError('Le nom est obligatoire'); setSaving(false); return }
        const id = await createKhassida({
          category,
          name: name.trim(),
          targetTotal: targetTotal ? parseInt(targetTotal) : null,
          recurrence,
          deadline: deadline || null,
          reminderTime,
          notes: notes.trim(),
        })
        navigate(`/khassidas/${id}`, { replace: true })
      } else {
        if (!periodName.trim()) { setError('Le nom de la période est obligatoire'); setSaving(false); return }
        if (!startDate) { setError('La date de début est obligatoire'); setSaving(false); return }
        if (!endDate) { setError('La date de fin est obligatoire'); setSaving(false); return }
        if (khassidas.length === 0) { setError('Ajoutez au moins une Khassida'); setSaving(false); return }
        if (khassidas.some(k => !k.name.trim())) { setError('Tous les noms sont obligatoires'); setSaving(false); return }
        const id = await createKhassidaBatch({
          periodName: periodName.trim(),
          startDate,
          endDate,
          khassidas: khassidas.map(k => ({
            name: k.name.trim(),
            targetCount: k.hasLimit ? parseInt(k.targetCount) : null,
            currentCount: 0,
          })),
        })
        navigate(`/khassidas-batch/${id}`, { replace: true })
      }
    } catch (e) {
      setError('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  return (
    <Layout title="Nouveau Wird / Khassida" back>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Mode selector */}
        <div>
          <label className="label font-bold text-green-deep mb-4 block">Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('regular')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                mode === 'regular'
                  ? 'border-gold bg-gradient-to-br from-gold-pale to-white shadow-lg ring-2 ring-gold/30'
                  : 'border-ivory-darker bg-white hover:shadow-md'
              }`}
            >
              <Star size={26} weight={mode === 'regular' ? 'fill' : 'regular'} className={mode === 'regular' ? 'text-gold-dark' : 'text-gray-400'} />
              <p className={`font-bold text-sm mt-2 ${mode === 'regular' ? 'text-gold-dark' : 'text-gray-700'}`}>Régulier</p>
              <p className="text-xs text-gray-500 mt-0.5">Khassida, Wird, Duaa</p>
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                mode === 'batch'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-white shadow-lg ring-2 ring-purple-200'
                  : 'border-ivory-darker bg-white hover:shadow-md'
              }`}
            >
              <ListBullets size={26} weight={mode === 'batch' ? 'fill' : 'regular'} className={mode === 'batch' ? 'text-purple-600' : 'text-gray-400'} />
              <p className={`font-bold text-sm mt-2 ${mode === 'batch' ? 'text-purple-700' : 'text-gray-700'}`}>Liste (Période)</p>
              <p className="text-xs text-gray-500 mt-0.5">Plusieurs sur une période</p>
            </button>
          </div>
        </div>

        {/* ====== MODE REGULAR ====== */}
        {mode === 'regular' && (
          <>
            {/* Category */}
            <div>
              <label className="label font-bold text-green-deep mb-4 block">Catégorie</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all transform hover:scale-105 ${
                      category === key
                        ? 'border-green-mid bg-gradient-to-br from-green-100 to-green-50 shadow-lg'
                        : 'border-ivory-darker bg-white hover:shadow-md'
                    }`}
                  >
                    <Icon
                      size={24}
                      weight={category === key ? 'fill' : 'regular'}
                      className={`mx-auto ${category === key ? 'text-green-deep' : 'text-gray-400'}`}
                    />
                    <p className={`text-xs font-bold mt-2 ${category === key ? 'text-green-deep' : 'text-gray-600'}`}>
                      {label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold-pale to-white">
              <label className="label font-bold text-gold-dark mb-3">Nom</label>
              <input
                className="input w-full rounded-xl border-2 border-gold-light focus:border-gold-dark text-lg"
                type="text"
                placeholder="ex: Jawharatul Kamal × 11..."
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="card rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-white">
              <label className="label font-bold text-purple-700 mb-3">Objectif (optionnel)</label>
              <input
                className="input w-full rounded-xl border-2 border-purple-200 focus:border-purple-400 text-lg"
                type="number"
                min="1"
                placeholder="ex: 11, 100, 7..."
                value={targetTotal}
                onChange={e => setTargetTotal(e.target.value)}
              />
              <p className="text-xs text-purple-600 mt-2">Laissez vide pour un suivi sans limite</p>
            </div>

            <div>
              <label className="label font-bold text-green-deep mb-4 block">Récurrence</label>
              <div className="grid grid-cols-2 gap-3">
                {RECURRENCES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRecurrence(key)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                      recurrence === key
                        ? 'bg-green-deep text-white border-green-deep shadow-md'
                        : 'border-ivory-darker bg-white text-gray-600 hover:border-green-mid'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card rounded-2xl p-6 bg-gradient-to-br from-red-50 to-white">
              <label className="label font-bold text-red-600 mb-3">Date limite (optionnel)</label>
              <input
                className="input w-full rounded-xl border-2 border-red-200 focus:border-red-400 font-bold"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-50 to-white">
              <label className="label font-bold text-green-deep mb-3">Notes (optionnel)</label>
              <textarea
                className="input w-full resize-none rounded-xl border-2 border-green-200 focus:border-green-400"
                rows={3}
                placeholder="Contexte, source, intention..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </>
        )}

        {/* ====== MODE BATCH ====== */}
        {mode === 'batch' && (
          <>
            <div className="card rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-200">
              <label className="label font-bold text-purple-700 mb-3">Nom de la période</label>
              <input
                className="input w-full rounded-xl border-2 border-purple-200 text-lg"
                type="text"
                placeholder="ex: Ramadan 2026, Mouharram..."
                value={periodName}
                onChange={e => setPeriodName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card rounded-2xl p-5 bg-gradient-to-br from-green-soft to-white">
                <label className="label font-bold text-green-deep mb-3">Début</label>
                <input
                  className="input w-full rounded-xl border-2 border-green-200"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="card rounded-2xl p-5 bg-gradient-to-br from-red-50 to-white">
                <label className="label font-bold text-red-600 mb-3">Fin</label>
                <input
                  className="input w-full rounded-xl border-2 border-red-200"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

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
                            <button
                              type="button"
                              onClick={() => {
                                const newKh = [...khassidas]
                                if (newKh[idx].targetCount > 1) newKh[idx].targetCount--
                                setKhassidas(newKh)
                              }}
                              className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-lg flex items-center justify-center hover:bg-purple-200 disabled:opacity-30"
                              disabled={kh.targetCount <= 1}
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold text-purple-700 text-base">{kh.targetCount}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newKh = [...khassidas]
                                newKh[idx].targetCount++
                                setKhassidas(newKh)
                              }}
                              className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center hover:bg-purple-700"
                            >
                              +
                            </button>
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
          </>
        )}

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
            className="btn-primary flex-1 rounded-xl py-3 font-bold text-sm shadow-lg hover:shadow-xl transition-all"
          >
            {saving ? '⏳ Création...' : '✓ Créer'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
