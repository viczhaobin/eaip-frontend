import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/common/page-header'
import { tags, historySeries } from '@/services/mock'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9']

/** 趋势分析（F3.5）：多点位同图、游标读数、报警区间叠加、质量断点 */
export default function Trends() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['TAG001', 'TAG006'])
  const [showAlarmSpan, setShowAlarmSpan] = useState(true)

  const series = useMemo(() => {
    const points = 80
    const base = historySeries(selectedIds[0] ?? 'TAG001', points)
    return base.map((p, i) => {
      const row: Record<string, string | number> = { t: p.t }
      selectedIds.forEach((id, idx) => {
        const s = historySeries(id, points)
        row[id] = s[i]?.v ?? 0
        if (idx === 0) row.q = s[i]?.q ?? 'GOOD'
      })
      return row
    })
  }, [selectedIds])

  const stats = selectedIds.map((id) => {
    const vs = series.map((r) => r[id] as number)
    return { id, min: Math.min(...vs), max: Math.max(...vs), avg: Number((vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(2)) }
  })

  const toggle = (id: string, on: boolean) => {
    setSelectedIds((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="趋势分析"
          description="多点位同图对比、最大/最小/平均值、报警区间与数据质量断点展示；支持 CSV/XLSX 导出（按权限）"
        /></StickyPageHead>

        {/* 点位选择 */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">选择对比点位（多选）</div>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            {tags.filter((t) => !t.enumMap && t.dataType !== 'BOOL').map((t) => (
              <label key={t.tagId} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50">
                <Checkbox checked={selectedIds.includes(t.tagId)} onCheckedChange={(v) => toggle(t.tagId, v === true)} />
                <span>{t.tagName} <span className="text-xs text-slate-400">{t.unit ?? ''}</span></span>
              </label>
            ))}
          </div>
        </div>

        {/* 统计 */}
        <div className="mt-4 flex flex-wrap gap-3">
          {stats.map((s, i) => (
            <div key={s.id} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs">
              <span className="font-medium" style={{ color: COLORS[i % COLORS.length] }}>
                {tags.find((t) => t.tagId === s.id)?.tagCode}
              </span>
              <span className="ml-2 text-slate-500">MIN {s.min} · MAX {s.max} · AVG {s.avg}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">近 80 分钟趋势</span>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <Checkbox checked={showAlarmSpan} onCheckedChange={(v) => setShowAlarmSpan(v === true)} />
              叠加报警区间（红色区域为 EVT001 发生时段）
            </label>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" fontSize={11} minTickGap={40} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                {showAlarmSpan && (
                  <ReferenceArea x1={series[20]?.t} x2={series[32]?.t} fill="#ef4444" fillOpacity={0.08} label="报警区间" />
                )}
                {selectedIds.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={id} name={tags.find((t) => t.tagId === id)?.tagCode ?? id}
                    stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[11px] text-slate-500">双 Y 轴（P1）：不同量纲点位可切换独立坐标轴</Badge>
            <Badge variant="outline" className="text-[11px] text-slate-500">工单/批次区间标记（P1）</Badge>
            <Badge variant="outline" className="text-[11px] text-slate-500">数据质量断点：UNCERTAIN/BAD 段不连线</Badge>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
