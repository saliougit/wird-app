import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createKamil, createDailyKamil } from '../db'
import { today, suggestEndDate } from '../utils/dates'
import Layout from '../components/Layout'
import { BookOpen, Users, CalendarBlank, Info } from '@phosphor-icons/react'

const JUZZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1)

const JUZZ_TIPS = {
  1:  'Al-Fatiha → Al-Baqarah 141',
  2:  'Al-Baqarah 142–252',
  3:  'Al-Baqarah 253 → Al-Imran 92',
  4:  'Al-Imran 93 → An-Nisa 23',
  5:  'An-Nisa 24–147',
  6:  'An-Nisa 148 → Al-Maïda 81',
  7:  'Al-Maïda 82 → Al-Anam 110',
  8:  'Al-Anam 111 → Al-Araf 87',
  9:  'Al-Araf 88 → Al-Anfal 40',
  10: 'Al-Anfal 41 → At-Tawba 92',
  11: 'At-Tawba 93 → Hud 5',
  12: 'Hud 6 → Yusuf 52',
  13: 'Yusuf 53 → Ibrahim',
  14: 'Al-Hijr → An-Nahl',
  15: 'Al-Isra → Al-Kahf 74',
  16: 'Al-Kahf 75 → Ta-Ha',
  17: 'Al-Anbiya → Al-Hajj',
  18: 'Al-Muminun → Al-Furqan 20',
  19: 'Al-Furqan 21 → An-Naml 55',
  20: 'An-Naml 56 → Al-Ankabut 45',
  21: 'Al-Ankabut 46 → Al-Ahzab 30',
  22: 'Al-Ahzab 31 → Ya-Sin 27',
  23: 'Ya-Sin 28 → Az-Zumar 31',
  24: 'Az-Zumar 32 → Fussilat 46',
  25: 'Fussilat 47 → Al-Jathiya',
  26: 'Al-Ahqaf → Ad-Dhariyat 30',
  27: 'Ad-Dhariyat 31 → Al-Hadid',
  28: 'Al-Mujadila → At-Tahrim',
  29: 'Al-Mulk → Al-Mursalat',
  30: 'An-Naba → An-Nas',
}

export default function KamilForm() {
  const navigate = useNavigate()
  const [type, setType] = useState('personnel')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(suggestEndDate(today(), 30))
  const [assignedJuzz, setAssignedJuzz] = useState([])
  const [defaultJuzz, setDefaultJuzz] = useState(1)
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
      setError('Sélectionnez au moins un Juzz assigné'); return
    }
    setSaving(true)
    try {
      if (type === 'quotidien') {
        const id = await createDailyKamil({
          name: name.trim(),
          startDate: startDate || null,
          endDate: endDate || null,
          defaultJuzz,
          description: '',
        })
        navigate(`/kamils-daily/${id}`, { replace: true })
      } else {
        const id = await createKamil({
          name: name.trim(),
          type,
          startDate: startDate || null,
          endDate: endDate || null,
          assignedJuzz: type === 'collectif' ? assignedJuzz : [],
          notes: notes.trim(),
        })
        navigate(`/kamils/${id}`, { replace: true })
      }
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
          <div className="grid grid-cols-3 gap-3">
            <TypeCard
              selected={type === 'personnel'}
              onClick={() => setType('personnel')}
              Icon={BookOpen}
              label="Personnel"
              desc="30 Juzz seul"
            />
            <TypeCard
              selected={type === 'collectif'}
              onClick={() => setType('collectif')}
              Icon={Users}
              label="Collectif"
              desc="Juzz assignés"
            />
            <TypeCard
              selected={type === 'quotidien'}
              onClick={() => setType('quotidien')}
              Icon={CalendarBlank}
              label="Quotidien"
              desc="1 Juzz par jour"
              color="gold"
            />
          </div>
        </div>

        {/* Name */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-50 to-white">
          <label className="label font-bold text-green-deep mb-3">Nom du Kamil</label>
          <input
            className="input w-full rounded-xl border-2 border-green-light focus:border-green-mid text-lg"
            type="text"
            placeholder={
              type === 'collectif' ? 'ex: Kamil Ansar Ramadan' :
              type === 'quotidien' ? 'ex: Ramadan 2026, Mouharram...' :
              'ex: Kamil Ramadan 2025'
            }
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
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

        {/* Juzz assignés — collectif */}
        {type === 'collectif' && (
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <label className="label font-bold text-blue-700">Juzz assignés</label>
              <span className="badge bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
                {assignedJuzz.length} sélectionné{assignedJuzz.length !== 1 ? 's' : ''}
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
                  title={JUZZ_TIPS[n]}
                  className={`text-sm font-bold rounded-lg border-2 transition-all h-12 flex items-center justify-center ${
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

        {/* Juzz par défaut — quotidien (single select) */}
        {type === 'quotidien' && (
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold-pale to-white border border-gold-light animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <label className="label font-bold text-gold-dark">Juzz récité chaque jour</label>
              <span className="badge bg-gold/20 text-gold-dark font-bold px-3 py-1 rounded-full">
                Juzz {defaultJuzz}
              </span>
            </div>
            <p className="text-xs text-gold-dark/80 mb-4 bg-gold-pale p-3 rounded-xl border border-gold-light flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" weight="fill" />
              Ce Juzz sera récité chaque jour par défaut — tu peux le changer au quotidien
            </p>
            <div className="grid grid-cols-6 gap-2">
              {JUZZ_NUMBERS.map(n => (
                <button
                  key={n}
                  onClick={() => setDefaultJuzz(n)}
                  title={JUZZ_TIPS[n]}
                  className={`text-sm font-bold rounded-lg border-2 transition-all h-12 flex items-center justify-center ${
                    defaultJuzz === n
                      ? 'bg-gold text-green-deep border-gold-dark shadow-md scale-105'
                      : 'border-gold-light bg-white text-gold-dark hover:border-gold'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes — pas pour quotidien */}
        {type !== 'quotidien' && (
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

function TypeCard({ selected, onClick, Icon, label, desc, color }) {
  const selectedStyles = color === 'gold'
    ? 'border-gold bg-gradient-to-br from-gold-pale to-white shadow-lg ring-2 ring-gold/40'
    : 'border-green-mid bg-gradient-to-br from-green-100 to-green-50 shadow-lg ring-2 ring-green-300'

  const iconColor = color === 'gold'
    ? (selected ? 'text-gold-dark' : 'text-gray-400')
    : (selected ? 'text-green-deep' : 'text-gray-400')

  const textColor = color === 'gold'
    ? (selected ? 'text-gold-dark' : 'text-gray-700')
    : (selected ? 'text-green-deep' : 'text-gray-700')

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 text-left transition-all transform hover:scale-105 ${
        selected ? selectedStyles : 'border-ivory-darker bg-white hover:shadow-md'
      }`}
    >
      <Icon
        size={26}
        weight={selected ? 'fill' : 'regular'}
        className={iconColor}
      />
      <p className={`font-bold text-sm mt-2 ${textColor}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </button>
  )
}
