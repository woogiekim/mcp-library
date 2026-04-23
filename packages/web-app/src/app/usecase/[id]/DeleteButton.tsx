'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/usecases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/usecases')
        router.refresh()
      } else {
        alert('삭제에 실패했습니다.')
        setDeleting(false)
        setConfirm(false)
      }
    } catch {
      alert('서버 연결 오류가 발생했습니다.')
      setDeleting(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-rose-400">정말 삭제할까요?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all disabled:opacity-50"
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-[#2A3042] hover:border-slate-500/50 transition-all"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-[#2A3042] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 3h8M4.5 3V2h3v1M5 5.5v3M7 5.5v3M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      삭제
    </button>
  )
}
