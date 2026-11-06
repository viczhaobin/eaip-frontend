import { useMemo, useState } from 'react'
import { LineChart, PenLine, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { QUALITY_META } from '@/lib/status'
import { equipments, tags, equipmentName, tagDisplayValue } from '@/services/mock'
import { useRealtimeValues } from '@/hooks/use-realtime'
import { historySeries } from '@/services/mock'
import AppLayout from '@/components/layout/AppLayout'
import { CartesianGrid, Line, LineChart as RLineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 实时监控（F1.2.3）：按产线/站点/设备/点位分组，受控写入入口（默认只读） */
export default function Monitor() {
  const values = useRealtimeValues()
  const [lineId, setLineId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [trendTagId, setTrendTagId] = useState<string | null>(null)
  const [writeTagId, setWriteTagId] = useState<string | null>(null)
  const [writeValue, setWriteValue] = useState('')
  const [writeReason, setWriteReason] = useState('')

  const equipmentInLine = useMemo(
    () => equipments.filter((e) => !lineId || e.lineId === lineId),
    [lineId],
  )

  const rows = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return tags
      .filter((t) => (!equipmentId || t.equipmentId === equipmentId) && (!lineId || equipments.find((e) => e.equipmentId === t.equipmentId)?.lineId === lineId))
      .filter((t) => !k || t.tagCode.toLowerCase().includes(k) || t.tagName.includes(k))
      .map((t) => ({ tag: t, value: values.find((v) => v.tagId === t.tagId) }))
  }, [values, keyword, equipmentId, lineId])

  const writeTag = tags.find((t) => t.tagId === writeTagId)
  const writeEq = writeTag ? equipments.find((e) => e.equipmentId === writeTag.equipmentId) : undefined
  const canWrite = !!writeTag && (writeTag.accessMode === 'WRITE' || writeTag.accessMode === 'READ_WRITE')
    && writeTag.writeWhitelist && writeEq && writeEq.enabled && !['FAULT', 'OFFLINE'].includes(writeEq.status) && writeEq.controlMode === '自动'

  const submitWrite = () => {
    if (!writeTag) return
    const num = Number(writeValue)
    if (Number.isNaN(num)) {
      toast.error('写入值必须是数字')
      return
    }
    if (writeTag.writeAllowedRange && (num < writeTag.writeAllowedRange.min || num > writeTag.writeAllowedRange.max)) {
      toast.error(`超出允许值范围 ${writeTag.writeAllowedRange.min} ~ ${writeTag.writeAllowedRange.max}，PLC 侧将拒绝`)
      return
    }
    if (!writeReason.trim()) {
      toast.error('高风险操作必须填写操作说明，写入审计日志')
      return
    }
    toast.success('写入指令已下发（模拟）', { description: `${writeTag.tagCode} ← ${writeValue}，commandId 已生成并记录审计` })
    setWriteTagId(null)
    setWriteValue('')
    setWriteReason('')
  }

  const trendTag = tags.find((t) => t.tagId === trendTagId)
  const trendData = trendTagId ? historySeries(trendTagId, 60) : []

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="实时监控"
          description="实时值、质量码与双时间戳；对有写权限的点位提供受控写入入口，默认只读"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={lineId} onChange={(e) => { setLineId(e.target.value); setEquipmentId('') }}>
            <option value="">全部产线</option>
            <option value="L01">总装一线</option>
            <option value="L02">总装二线</option>
            <option value="L03">机加工线</option>
          </select>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">全部设备</option>
            {equipmentInLine.map((e) => <option key={e.equipmentId} value={e.equipmentId}>{e.equipmentName}</option>)}
          </select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索点位…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">点位</th>
                <th className="px-5 py-3 font-medium">当前值</th>
                <th className="px-5 py-3 font-medium">质量码</th>
                <th className="px-5 py-3 font-medium">采集周期</th>
                <th className="px-5 py-3 font-medium">源时间 / 接收时间</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ tag, value }) => (
                <tr key={tag.tagId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{tag.tagName}</div>
                    <div className="font-mono text-xs text-slate-400">{tag.tagCode} · {equipmentName(tag.equipmentId)}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-base font-semibold tabular-nums ${value && value.quality !== 'GOOD' ? QUALITY_META[value.quality].text : ''}`}>
                      {value ? tagDisplayValue(value, tag) : '—'}
                    </span>
                    {tag.unit && <span className="ml-1 text-xs text-slate-400">{tag.unit}</span>}
                  </td>
                  <td className="px-5 py-3">{value ? <StatusBadge meta={QUALITY_META[value.quality]} /> : '—'}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{tag.scanIntervalMs}ms</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {value ? <>{value.sourceTimestamp}<div className="mt-0.5 text-[11px]">{value.serverTimestamp}</div></> : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline" onClick={() => setTrendTagId(tag.tagId)}>
                        <LineChart className="h-3.5 w-3.5" /> 趋势
                      </button>
                      {(tag.accessMode === 'WRITE' || tag.accessMode === 'READ_WRITE') && (
                        <button className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline" onClick={() => { setWriteTagId(tag.tagId); setWriteValue(''); setWriteReason('') }}>
                          <PenLine className="h-3.5 w-3.5" /> 写入
                        </button>
                      )}
                    </div>
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
            <DialogTitle>趋势：{trendTag?.tagName}（{trendTag?.tagCode}）</DialogTitle>
            <DialogDescription>近 60 分钟 · 支持历史查询与导出（见 工业数据 / 历史数据）</DialogDescription>
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
        </DialogContent>
      </Dialog>

      {/* 受控写入：高风险操作二次确认 */}
      <Dialog open={!!writeTag} onOpenChange={(o) => !o && setWriteTagId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>受控写入：{writeTag?.tagName}（{writeTag?.tagCode}）</DialogTitle>
            <DialogDescription>
              目标设备：{writeEq ? equipmentName(writeEq.equipmentId) : '—'} · 当前状态：{writeEq?.status} · 控制模式：{writeEq?.controlMode}
            </DialogDescription>
          </DialogHeader>
          {!canWrite && writeTag && (
            <div className="rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">
              当前条件不允许下发写入：
              {!writeTag.writeWhitelist && <div className="mt-1 text-xs">· 点位未配置写入白名单</div>}
              {writeEq && !writeEq.enabled && <div className="mt-1 text-xs">· 设备未启用</div>}
              {writeEq && ['FAULT', 'OFFLINE'].includes(writeEq.status) && <div className="mt-1 text-xs">· 设备处于 {writeEq.status} 状态</div>}
              {writeEq && writeEq.controlMode !== '自动' && <div className="mt-1 text-xs">· 设备处于{writeEq.controlMode}模式，平台阻止远程写操作</div>}
            </div>
          )}
          {canWrite && writeTag && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800">
                高风险操作：平台将生成 commandId 并写入审计日志；PLC 按自身联锁判断是否执行，网络断开时不会伪装为已执行。
                允许值范围 {writeTag.writeAllowedRange?.min} ~ {writeTag.writeAllowedRange?.max}。
              </div>
              <div>
                <div className="text-xs text-slate-500">写入值</div>
                <Input className="mt-1.5" type="number" value={writeValue} onChange={(e) => setWriteValue(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-500">操作说明（必填，计入审计） <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={writeReason} onChange={(e) => setWriteReason(e.target.value)} placeholder="例如：换型后按工艺单调整转速" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWriteTagId(null)}>取消</Button>
            {canWrite && <Button className="bg-amber-600 hover:bg-amber-700" onClick={submitWrite}>确认写入</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
