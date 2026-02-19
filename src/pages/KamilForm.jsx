import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createKamil } from '../db'
import { today, suggestEndDate } from '../utils/dates'
import Layout from '../components/Layout'
import { BookOpen, Users, CalendarBlank, Info } from '@phosphor-icons/react'

const JUZZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1)

export default function KamilForm() {
  const navigate = useNavigate()
  const [type, setType] = useState('personnel')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(suggestEndDate(today(), 30))
  const [assignedJuzz, setAssignedJuzz] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleStartDateChange = (val) => {
    setStartDate(val)
    setEndDate(suggestEndDate(val, 30))
  }

  const toggleJuzz = (n) => {
    setAssignedJuzz(prev =>
      prev.includes(n) ? prev.filter(j => j !== n) : [...prev, n].sort((a, b) => a - b)
    )
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire'); return }
    if (type === 'collectif' && assignedJuzz.length === 0) {
      setError('Sélectionnez au moins un Juzz assigné')
      return
    }
    setSaving(true)
    try {
      const id = await createKamil({
        name: name.trim(),
        type,
        startDate: startDate || null,
        endDate: endDate || null,
        assignedJuzz: type === 'collectif' ? assignedJuzz : [],
        notes: notes.trim(),
      })
      navigate(`/kamils/${id}`, { replace: true })
    } catch (e) {
      setError('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  return (
    <Layout title="Nouveau Kamil" back>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Type selector */}
        <div>
          <label className="label font-bold text-green-deep mb-4 block">Choisir un type de Kamil</label>
          <div className="grid grid-cols-2 gap-4">
            <TypeCard
              selected={type === 'personnel'}
              onClick={() => setType('personnel')}
              Icon={BookOpen}
              label="Personnel"
              desc="30 Juzz sur une période"
            />
            <TypeCard
              selected={type === 'collectif'}
              onClick={() => setType('collectif')}
              Icon={Users}
              label="Collectif"
              desc="Juzz assignés, deadline"
            />
          </div>
        </div>

        {/* Name */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-50 to-white">
          <label className="label font-bold text-green-deep mb-3">Nom du Kamil</label>
          <input
            className="input w-full rounded-xl border-2 border-green-light focus:border-green-mid text-lg"
            type="text"
            placeholder={type === 'collectif' ? 'ex: Kamil Ansar Ramadan' : 'ex: Kamil Ramadan 2025'}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card rounded-2xl p-5 bg-gradient-to-br from-gold-pale to-white">
            <label className="label font-bold text-gold-dark mb-3">Début</label>
            <input
              className="input w-full rounded-lg border-2 border-gold-light focus:border-gold-dark font-bold"
              type="date"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="card rounded-2xl p-5 bg-gradient-to-br from-gold-pale to-white">
            <label className="label font-bold text-gold-dark mb-3">Fin</label>
            <input
              className="input w-full rounded-lg border-2 border-gold-light focus:border-gold-dark font-bold"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Juzz assignés (collectif uniquement) */}
        {type === 'collectif' && (
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <label className="label font-bold text-blue-700">
                Juzz assignés
              </label>
              <span className="badge bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
                {assignedJuzz.length}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm text-blue-700 bg-blue-100 p-3 rounded-xl border border-blue-200">
              <Info size={18} className="shrink-0" weight="fill" />
              <span>Sélectionnez les Juzz de ce Kamil</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {JUZZ_NUMBERS.map(n => (
                <button
                  key={n}
                  onClick={() => toggleJuzz(n)}
                  className={`juzz-cell text-sm font-bold rounded-lg border-2 transition-all h-12 flex items-center justify-center ${
                    assignedJuzz.includes(n)
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                      : 'border-blue-200 bg-white text-blue-600 hover:border-blue-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {assignedJuzz.length > 0 && (
              <p className="text-xs text-blue-600 mt-4 font-bold bg-blue-50 p-2 rounded-lg">
                ✓ Juzz: {assignedJuzz.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-white">
          <label className="label font-bold text-purple-700 mb-3">Notes (optionnel)</label>
          <textarea
            className="input w-full resize-none rounded-xl border-2 border-purple-200 focus:border-purple-400"
            rows={3}
            placeholder="Contexte, groupe, mosquée..."
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

        {/* Actions */}
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

function TypeCard({ selected, onClick, Icon, label, desc }) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-105 ${
        selected
          ? 'border-green-mid bg-gradient-to-br from-green-100 to-green-50 shadow-lg ring-2 ring-green-300'
          : 'border-ivory-darker bg-white hover:shadow-md'
      }`}
    >
      <Icon
        size={28}
        weight={selected ? 'fill' : 'regular'}
        className={selected ? 'text-green-deep' : 'text-gray-400'}
      />
      <p className={`font-bold text-sm mt-3 ${selected ? 'text-green-deep' : 'text-gray-700'}`}>
        {label}
      </p>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </button>
  )
}
