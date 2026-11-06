import { useMemo, useState } from 'react'
import { LineChart, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { QUALITY_META } from '@/lib/status'
import { tags, equipmentName, tagDisplayValue } from '@/services/mock'
import { useRealtimeValues } from '@/hooks/use-realtime'
import { historySeries } from '@/services/mock'
import AppLayout from '@/components/layout/AppLayout'
import { Line, LineChart as RLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 实时数据总览：关键点位实时值 + 质量状态（实时漂移模拟） */
export default function RealtimeData() {
  const values = useRealtimeValues()
  const [keyword, setKeyword] = useState('')
  const [trendTagId, setTrendTagId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return tags
      .filter((t) => !k || t.tagCode.toLowerCase().includes(k) || t.tagName.includes(k))
      .map((t) => ({ tag: t, value: values.find((v) => v.tagId === t.tagId) }))
  }, [values, keyword])

  const trendTag = tags.find((t) => t.tagId === trendTagId)
  const trendData = trendTagId ? historySeries(trendTagId, 60) : []

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="实时数据"
          description="关键点位实时值、质量码与更新时间（2s 自动刷新，模拟数据漂移）"
        />

        <div className="mt-6 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索点位编码 / 名称…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <span className="text-xs text-slate-400">质量码非 GOOD 时明确提示，不以缓存旧值冒充实时值</span>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">点位</th>
                <th className="px-5 py-3 font-medium">当前值</th>
                <th className="px-5 py-3 font-medium">质量码</th>
                <th className="px-5 py-3 font-medium">源时间 / 接收时间</th>
                <th className="px-5 py-3 font-medium">所属设备</th>
                <th className="px-5 py-3 font-medium text-right">操作</th>
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
                    <span className={`text-lg font-semibold tabular-nums ${value && value.quality !== 'GOOD' ? QUALITY_META[value.quality].text : ''}`}>
                      {value ? tagDisplayValue(value, tag) : '—'}
                    </span>
                    {tag.unit && <span className="ml-1 text-xs text-slate-400">{tag.unit}</span>}
                  </td>
                  <td className="px-5 py-3">{value ? <StatusBadge meta={QUALITY_META[value.quality]} /> : '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {value ? (
                      <>
                        <div>{value.sourceTimestamp}</div>
                        <div className="mt-0.5 text-[11px]">{value.serverTimestamp}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{equipmentName(tag.equipmentId)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline" onClick={() => setTrendTagId(tag.tagId)}>
                      <LineChart className="h-3.5 w-3.5" /> 趋势
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 趋势弹窗 */}
      <Dialog open={!!trendTag} onOpenChange={(o) => !o && setTrendTagId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>近 60 分钟趋势：{trendTag?.tagName}（{trendTag?.tagCode}）</DialogTitle>
          </DialogHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RLineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" fontSize={11} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                {trendTag?.minValue != null && <ReferenceLine y={trendTag.minValue} stroke="#94a3b8" strokeDasharray="4 4" />}
                {trendTag?.maxValue != null && <ReferenceLine y={trendTag.maxValue} stroke="#94a3b8" strokeDasharray="4 4" />}
                <Line type="monotone" dataKey="v" stroke="#4f46e5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </RLineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400">灰线为配置上下限；UNCERTAIN 点在历史查询中显示为质量断点</p>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
