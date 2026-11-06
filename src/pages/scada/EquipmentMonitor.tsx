import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Cpu, Gauge } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EQUIPMENT_STATUS_META, QUALITY_META } from '@/lib/status'
import { deviceApi, tags, equipmentName } from '@/services/mock'
import { useRealtimeValues } from '@/hooks/use-realtime'
import type { Equipment } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 设备监控（F4.2）：设备卡片 + 详情（实时点位 / 状态时间轴 / 趋势 / 报警入口） */
export default function EquipmentMonitor() {
  const [list, setList] = useState<Equipment[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const values = useRealtimeValues()

  useEffect(() => {
    void deviceApi.listEquipments().then((es) => {
      setList(es)
      if (es.length > 0) setSelectedId(es[0].equipmentId)
    })
  }, [])

  const selected = list.find((e) => e.equipmentId === selectedId)
  const selectedTags = tags.filter((t) => t.equipmentId === selectedId)
  const timeline = selected
    ? [
        { at: selected.lastStatusChangeAt ?? '—', event: `状态变化 → ${EQUIPMENT_STATUS_META[selected.status].label}` },
        { at: '2026-11-06 08:00:10', event: '控制指令 START_REQUEST 执行成功' },
        { at: '2026-11-06 07:55:00', event: '配方 RECIPE_SELECT RC001/V3 切换成功' },
      ]
    : []

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader title="设备监控" description="设备卡片 + 详情页：实时点位、状态时间轴、历史趋势、报警记录、控制操作入口（有权限时）" />

        <div className="mt-6 flex flex-wrap gap-2">
          {list.map((e) => (
            <button key={e.equipmentId} onClick={() => setSelectedId(e.equipmentId)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${selectedId === e.equipmentId ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <span className={`h-2 w-2 rounded-full ${EQUIPMENT_STATUS_META[e.status].dot}`} />
              {e.equipmentName}
            </button>
          ))}
        </div></StickyPageHead>

        {selected && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><Cpu className="h-3.5 w-3.5" /> 运行状态</div>
                <div className="mt-2"><StatusBadge meta={EQUIPMENT_STATUS_META[selected.status]} /></div>
                <div className="mt-2 text-xs text-slate-500">控制模式：{selected.controlMode}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><Gauge className="h-3.5 w-3.5" /> 产量 / 节拍</div>
                <div className="mt-2 text-xl font-semibold tabular-nums">{selected.outputToday}<span className="ml-1 text-xs font-normal text-slate-400">pcs</span></div>
                <div className="mt-1 text-xs text-slate-500">{selected.cycleTimeSec ? `节拍 ${selected.cycleTimeSec}s` : '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><Activity className="h-3.5 w-3.5" /> 运行 / 停机</div>
                <div className="mt-2 text-xl font-semibold tabular-nums">{selected.runMinutesToday}<span className="ml-1 text-xs font-normal text-slate-400">分</span></div>
                <div className="mt-1 text-xs text-slate-500">今日停机 {selected.downMinutesToday} 分</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><AlertTriangle className="h-3.5 w-3.5" /> 当前报警</div>
                <div className={`mt-2 text-xl font-semibold tabular-nums ${selected.currentAlarmCount > 0 ? 'text-red-500' : ''}`}>{selected.currentAlarmCount}</div>
                <div className="mt-1 text-xs text-slate-500">{selected.currentWorkOrder ?? '无在产工单'}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {/* 实时点位 */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">实时点位（{equipmentName(selected.equipmentId)}）</div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-50">
                    {selectedTags.map((t) => {
                      const v = values.find((x) => x.tagId === t.tagId)
                      return (
                        <tr key={t.tagId}>
                          <td className="px-5 py-2.5">
                            <div className="text-sm">{t.tagName}</div>
                            <div className="font-mono text-[11px] text-slate-400">{t.tagCode}</div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{v ? String(v.value) : '—'} {t.unit}</td>
                          <td className="px-5 py-2.5 text-right">{v && <Badge variant="outline" className={QUALITY_META[v.quality].badge}>{v.quality}</Badge>}</td>
                        </tr>
                      )
                    })}
                    {selectedTags.length === 0 && <tr><td className="px-5 py-6 text-center text-xs text-slate-400">该设备暂无配置点位</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* 状态时间轴 */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">运行状态时间轴</div>
                <div className="px-5 py-4">
                  {timeline.map((t, i) => (
                    <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        {i < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">{t.at}</div>
                        <div className="mt-0.5 text-sm">{t.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
