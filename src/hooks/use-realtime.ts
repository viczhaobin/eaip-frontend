import { useEffect, useState } from 'react'
import { getRealtimeValues, subscribeRealtime, tickRealtime } from '@/services/mock'
import type { TagValue } from '@/types/domain'

/** 实时值订阅：2s 模拟漂移 + 订阅推送，组件卸载自动清理 */
export function useRealtimeValues(tagIds?: string[]): TagValue[] {
  const [values, setValues] = useState<TagValue[]>([])
  useEffect(() => {
    let alive = true
    const refresh = () => {
      void getRealtimeValues(tagIds).then((v) => {
        if (alive) setValues(v)
      })
    }
    refresh()
    const timer = setInterval(tickRealtime, 2000)
    const unsub = subscribeRealtime(refresh)
    return () => {
      alive = false
      clearInterval(timer)
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tagIds 以 join 后字符串为稳定依赖
  }, [tagIds?.join(',')])
  return values
}
