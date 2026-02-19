import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createKhassida } from '../db'
import Layout from '../components/Layout'
import { Star, Moon, Heart, Circle } from '@phosphor-icons/react'

const CATEGORIES = [
  { key: 'khassida', label: 'Khassida',  Icon: Star },
  { key: 'wird',     label: 'Wird',       Icon: Moon },
  { key: 'duaa',    label: 'Duaa',       Icon: Heart },
  { key: 'autre',    label: 'Autre',      Icon: Circle },
]

const RECURRENCES = [
  { key: 'none',    label: 'Une seule fois' },
  { key: 'daily',   label: 'Quotidien' },
  { key: 'weekly',  label: 'Hebdomadaire' },
  { key: 'monthly', label: 'Mensuel' },
]

export default function KhassidaForm() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('khassida')
  const [name, setName] = useState('')
  const [targetTotal, setTargetTotal] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [deadline, setDeadline] = useState('')
  const [reminderTime, setReminderTime] = useState('20:00')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire'); return }
    setSaving(true)
    try {
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
    } catch (e) {
      setError('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  return (
    <Layout title="Nouveau Wird / Khassida" back>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Category */}
        <div>
          <label className="label font-bold text-green-deep mb-4 block">Choisir une catégorie</label>
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

        {/* Name */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold-pale to-white">
          <label className="label font-bold text-gold-dark mb-3">Nom</label>
          <input
            className="input w-full rounded-xl border-2 border-gold-light focus:border-gold-dark text-lg"
            type="text"
            placeholder="ex: Jawharatul Kamal × 11..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Target */}
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

        {/* Recurrence */}
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

        {/* Deadline */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-red-50 to-white">
          <label className="label font-bold text-red-600 mb-3">Date limite (optionnel)</label>
          <input
            className="input w-full rounded-xl border-2 border-red-200 focus:border-red-400 font-bold"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <p className="text-xs text-red-600 mt-2">Alerte si la date est dépassée</p>
        </div>

        {/* Reminder time */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white">
          <label className="label font-bold text-blue-700 mb-3">Heure de rappel</label>
          <input
            className="input w-full rounded-xl border-2 border-blue-200 focus:border-blue-400 text-center font-bold text-lg"
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
          />
        </div>

        {/* Notes */}
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
