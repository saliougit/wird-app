import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, updateKhassidaBatch, deleteKhassidaBatch } from '../db'
import { formatDate } from '../utils/dates'
import Layout from '../components/Layout'
import ProgressRing from '../components/ProgressRing'
import { Plus, Trash, CheckCircle } from '@phosphor-icons/react'

export default function KhassidaBatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const batchId = parseInt(id)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const batch = useLiveQuery(() => db.khassidaBatches.get(batchId), [batchId])

  if (!batch) {
    return (
      <Layout title="Liste de Khassidas" back>
        <div className="p-4 text-center text-gray-400 py-16">Chargement...</div>
      </Layout>
    )
  }

  // Only count items that have a limit for the global progress
  const limitedItems = batch.khassidas.filter(k => k.targetCount)
  const totalTarget = limitedItems.reduce((s, k) => s + k.targetCount, 0)
  const totalDone = batch.khassidas.reduce((s, k) => s + k.currentCount, 0)
  const totalDoneLimited = limitedItems.reduce((s, k) => s + Math.min(k.currentCount, k.targetCount), 0)
  const percentage = totalTarget > 0 ? Math.round((totalDoneLimited / totalTarget) * 100) : null
  const allLimitedDone = limitedItems.length > 0 && limitedItems.every(k => k.currentCount >= k.targetCount)
  const unlimitedItems = batch.khassidas.filter(k => !k.targetCount)

  const handleIncrement = async (idx) => {
    const newKhassidas = [...batch.khassidas]
    const item = newKhassidas[idx]
    // Si pas de limite OU pas encore atteint la limite
    if (!item.targetCount || item.currentCount < item.targetCount) {
      newKhassidas[idx].currentCount++
      await updateKhassidaBatch(batchId, { khassidas: newKhassidas })
    }
  }

  const handleDecrement = async (idx) => {
    const newKhassidas = [...batch.khassidas]
    if (newKhassidas[idx].currentCount > 0) {
      newKhassidas[idx].currentCount--
      await updateKhassidaBatch(batchId, { khassidas: newKhassidas })
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
      return
    }
    await deleteKhassidaBatch(batchId)
    navigate('/khassidas', { replace: true })
  }

  return (
    <Layout title={batch.periodName} back actions={
      <button
        onClick={handleDelete}
        className={`btn-icon w-10 h-10 transition-colors ${showDeleteConfirm ? 'text-white bg-red-600' : 'text-red-400 hover:bg-red-50'}`}
      >
        <Trash size={20} weight="bold" />
      </button>
    }>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Header Card */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold to-gold-dark text-ivory">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80 font-body">Période</p>
              <p className="font-display text-lg font-bold">{formatDate(batch.startDate)} → {formatDate(batch.endDate)}</p>
              {percentage !== null && (
                <p className="text-sm text-ivory/90 mt-1">{totalDoneLimited} / {totalTarget} (avec limites)</p>
              )}
              {unlimitedItems.length > 0 && (
                <p className="text-sm text-ivory/80 mt-0.5">{totalDone} au total</p>
              )}
            </div>
            {percentage !== null ? (
              <ProgressRing percent={percentage} size={80} stroke={6} color="rgba(255,255,255,0.9)" bg="rgba(255,255,255,0.2)">
                <span className="text-sm font-bold text-ivory">{percentage}%</span>
              </ProgressRing>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <p className="font-display text-2xl font-bold text-ivory">{totalDone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Khassidas Grid */}
        <div className="grid grid-cols-1 gap-4">
          {batch.khassidas.map((kh, idx) => {
            const isLimited = !!kh.targetCount
            const isDone = isLimited && kh.currentCount >= kh.targetCount
            return (
              <div
                key={idx}
                className={`card rounded-2xl p-6 border-2 transition-all ${
                  isDone
                    ? 'bg-green-50 border-green-300'
                    : isLimited
                    ? 'bg-white border-purple-200'
                    : 'bg-white border-gold-light'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display text-xl font-bold text-green-deep">{kh.name}</p>
                      {!isLimited && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-dark bg-gold-pale rounded-full px-2 py-0.5">
                          ∞ Illimité
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {kh.currentCount}{isLimited ? ` / ${kh.targetCount}` : ' fois'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(idx)}
                      disabled={kh.currentCount === 0}
                      className="btn-icon bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 w-10 h-10 text-lg font-bold"
                    >
                      −
                    </button>

                    <div className={`w-16 text-center py-2 rounded-lg ${isDone ? 'bg-green-100' : isLimited ? 'bg-gradient-to-br from-purple-50 to-purple-100' : 'bg-gold-pale'}`}>
                      <p className={`font-display text-2xl font-bold ${isDone ? 'text-green-deep' : isLimited ? 'text-purple-700' : 'text-gold-dark'}`}>
                        {kh.currentCount}
                      </p>
                    </div>

                    <button
                      onClick={() => handleIncrement(idx)}
                      disabled={isDone}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow ${
                        isDone
                          ? 'bg-green-100 text-green-mid cursor-not-allowed opacity-60'
                          : isLimited
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gold text-green-deep hover:brightness-90'
                      }`}
                    >
                      {isDone ? <CheckCircle size={18} weight="fill" /> : <Plus size={18} weight="bold" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar — only for limited items */}
                {isLimited && kh.targetCount > 1 && (
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-green-mid' : 'bg-gradient-to-r from-purple-400 to-purple-600'}`}
                      style={{ width: `${Math.min((kh.currentCount / kh.targetCount) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Completion banner */}
        {allLimitedDone && limitedItems.length > 0 && (
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-mid to-green-deep text-ivory text-center">
            <p className="font-display text-2xl font-bold mb-2">✨ Bravo! ✨</p>
            <p className="text-sm">Toutes les Khassidas limitées sont terminées — Alhamdulillah!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
