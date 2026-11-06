import { useEffect, useState } from 'react'

/** 实时时钟（1s 刷新） */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export const fmtTime = (d: Date) => d.toTimeString().slice(0, 8)
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const shiftOf = (d: Date) => (d.getHours() >= 8 && d.getHours() < 20 ? '白班' : '夜班')
