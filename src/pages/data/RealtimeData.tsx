import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { QUALITY_META } from '@/lib/status'
import { tags, equipmentName, tagDisplayValue } from '@/services/mock'
import { useRealtimeValues } from '@/hooks/use-realtime'
import type { QualityCode } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const QUALITY_FILTERS: (QualityCode | '__all__')[] = ['__all__', 'GOOD', 'UNCERTAIN', 'BAD', 'STALE', 'COMM_LOST', 'NOT_CONFIGURED', 'OUT_OF_RANGE']

/** 实时数据（F3.2）：批量查询、按设备/工位过滤、质量码过滤、订阅变化 */
export default function RealtimeData() {
  const values = useRealtimeValues()
  const [keyword, setKeyword] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [quality, setQuality] = useState<QualityCode | '__all__'>('__all__')

  const rows = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return tags
      .map((t) => ({ tag: t, value: values.find((v) => v.tagId === t.tagId) }))
      .filter(({ tag, value }) =>
        (!k || tag.tagCode.toLowerCase().includes(k) || tag.tagName.includes(k))
        && (!equipmentId || tag.equipmentId === equipmentId)
        && (quality === '__all__' || value?.quality === quality),
      )
  }, [values, keyword, equipmentId, quality])

  const exportCsv = () => {
    const header = 'tagCode,tagName,value,quality,sourceTimestamp,serverTimestamp,equipment\n'
    const body = rows.map(({ tag, value }) =>
      [tag.tagCode, tag.tagName, String(value?.value ?? ''), value?.quality ?? '', value?.sourceTimestamp ?? '', value?.serverTimestamp ?? '', tag.equipmentId].join(','),
    ).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `realtime-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已导出 CSV（演示为快照导出，权限受 EXPORT 控制）')
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="实时数据"
          description="实时值缓存：tagId / value / quality / 双时间戳；缓存失效返回「无数据/过期」，不返回旧值冒充"
          actions={
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" /> 导出 CSV
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索点位…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">全部设备</option>
            {[...new Set(tags.map((t) => t.equipmentId))].map((id) => (
              <option key={id} value={id}>{equipmentName(id)}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={quality} onChange={(e) => setQuality(e.target.value as QualityCode | '__all__')}>
            {QUALITY_FILTERS.map((q) => <option key={q} value={q}>{q === '__all__' ? '全部质量码' : QUALITY_META[q].label}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-400">{rows.length} 个点位 · 2s 自动刷新</span>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">点位</th>
                <th className="px-5 py-3 font-medium">实时值</th>
                <th className="px-5 py-3 font-medium">数据类型 / 单位</th>
                <th className="px-5 py-3 font-medium">质量码</th>
                <th className="px-5 py-3 font-medium">sourceTimestamp</th>
                <th className="px-5 py-3 font-medium">serverTimestamp</th>
                <th className="px-5 py-3 font-medium">最后变化</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ tag, value }) => (
                <tr key={tag.tagId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{tag.tagName}</div>
                    <div className="font-mono text-xs text-slate-400">{tag.tagCode}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold tabular-nums">{value ? tagDisplayValue(value, tag) : '无数据'}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{tag.dataType}{tag.unit ? ` · ${tag.unit}` : ''}</td>
                  <td className="px-5 py-3">{value ? <StatusBadge meta={QUALITY_META[value.quality]} /> : <span className="text-xs text-slate-400">无数据</span>}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{value?.sourceTimestamp ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{value?.serverTimestamp ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{value?.lastChangedAt ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
