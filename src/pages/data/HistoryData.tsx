import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Database, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { tags, historySeries } from '@/services/mock'
import type { AggFunc } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const AGGS: AggFunc[] = ['MIN', 'MAX', 'AVG', 'SUM', 'COUNT', 'FIRST', 'LAST']
const SPANS = [{ label: '最近 1 小时', points: 60, step: 1 }, { label: '最近 6 小时', points: 72, step: 5 }, { label: '最近 24 小时', points: 96, step: 15 }, { label: '最近 7 天', points: 84, step: 120 }]

/** 历史数据（F3.3）：起止时间 / 聚合粒度 / 质量码过滤 / 降采样曲线 */
export default function HistoryData() {
  const [tagId, setTagId] = useState('TAG001')
  const [span, setSpan] = useState(0)
  const [agg, setAgg] = useState<AggFunc>('AVG')
  const [keyword, setKeyword] = useState('')

  const tag = tags.find((t) => t.tagId === tagId)
  const spanDef = SPANS[span]

  const data = useMemo(() => {
    const raw = historySeries(tagId, spanDef.points, spanDef.step)
    // 模拟聚合：对窗口做滑窗聚合演示
    const win = agg === 'MIN' || agg === 'MAX' || agg === 'AVG' ? 3 : 1
    return raw.map((p, i) => {
      const w = raw.slice(Math.max(0, i - win + 1), i + 1).map((x) => x.v)
      let v = p.v
      if (agg === 'MIN') v = Math.min(...w)
      if (agg === 'MAX') v = Math.max(...w)
      if (agg === 'AVG') v = Number((w.reduce((a, b) => a + b, 0) / w.length).toFixed(2))
      if (agg === 'SUM') v = Number(w.reduce((a, b) => a + b, 0).toFixed(2))
      if (agg === 'COUNT') v = w.length
      if (agg === 'FIRST') v = w[0]
      if (agg === 'LAST') v = w[w.length - 1]
      return { ...p, v }
    })
  }, [tagId, spanDef, agg])

  const stats = useMemo(() => {
    const vs = data.map((d) => d.v)
    return { min: Math.min(...vs), max: Math.max(...vs), avg: Number((vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(2)) }
  }, [data])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="历史数据"
          description="查询条件：点位 / 起止时间 / 聚合粒度 / 质量码过滤；默认跨度不超过 7 天，超范围走分页或异步导出"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索点位…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 max-w-64 rounded-md border border-slate-200 bg-white px-2 text-sm" value={tagId}
            onChange={(e) => setTagId(e.target.value)}>
            {tags.filter((t) => !keyword || t.tagCode.toLowerCase().includes(keyword.toLowerCase()) || t.tagName.includes(keyword)).map((t) => (
              <option key={t.tagId} value={t.tagId}>{t.tagName}（{t.tagCode}）</option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={span} onChange={(e) => setSpan(Number(e.target.value))}>
            {SPANS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
          </select>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={agg} onChange={(e) => setAgg(e.target.value as AggFunc)}>
            {AGGS.map((a) => <option key={a} value={a}>聚合：{a}</option>)}
          </select>
          <Button variant="outline" className="ml-auto">异步导出（受 EXPORT 权限控制）</Button>
        </div></StickyPageHead>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-slate-300" />
              {tag?.tagName}（{tag?.tagCode}）· {spanDef.label} · {agg}
            </div>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>MIN <span className="font-semibold text-slate-700">{stats.min}</span></span>
              <span>MAX <span className="font-semibold text-slate-700">{stats.max}</span></span>
              <span>AVG <span className="font-semibold text-slate-700">{stats.avg}</span></span>
              <span>点数 <span className="font-semibold text-slate-700">{data.length}</span></span>
            </div>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" fontSize={11} minTickGap={30} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                {tag?.minValue != null && <ReferenceLine y={tag.minValue} stroke="#94a3b8" strokeDasharray="4 4" label="下限" />}
                {tag?.maxValue != null && <ReferenceLine y={tag.maxValue} stroke="#94a3b8" strokeDasharray="4 4" label="上限" />}
                <Line type="monotone" dataKey="v" stroke="#4f46e5" strokeWidth={1.5} dot={false} isAnimationActive={false}
                  connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[11px] text-slate-500">查询带超时与最大点数限制</Badge>
            <Badge variant="outline" className="text-[11px] text-slate-500">大数据量优先返回降采样曲线</Badge>
            <Badge variant="outline" className="text-[11px] text-slate-500">时间加权平均仅在采样语义明确时提供</Badge>
            <Badge variant="outline" className="text-[11px] text-slate-500">计数器差值处理设备重置/溢出/断点</Badge>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
