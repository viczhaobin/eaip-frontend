import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Factory } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EQUIPMENT_STATUS_META, WORKORDER_STATUS_META, ALARM_LEVEL_META } from '@/lib/status'
import { deviceApi, integrationApi, alarmApi, lineName } from '@/services/mock'
import type { AlarmEvent, Equipment, WorkOrder } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 产线监控（F4.3）：产线总览可视化 + 工位状态分布 + 计划达成 */
export default function LineMonitor() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [events, setEvents] = useState<AlarmEvent[]>([])
  const [lineId, setLineId] = useState('L01')

  useEffect(() => {
    void deviceApi.listEquipments({ lineId }).then(setEquipments)
    void integrationApi.listWorkOrders().then(setWorkOrders)
    void alarmApi.listEvents().then(setEvents)
  }, [lineId])

  const wo = workOrders.find((w) => w.status === 'IN_PROGRESS')
  const inLine = equipments
  const byStatus = (Object.keys(EQUIPMENT_STATUS_META) as (keyof typeof EQUIPMENT_STATUS_META)[]).map((s) => ({
    s, n: inLine.filter((e) => e.status === s).length,
  })).filter((x) => x.n > 0)

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="产线监控"
          description="产线总体状态、工位状态分布、当前工单与达成率、异常与停机；数据来源已标注"
          actions={
            <div className="flex gap-2">
              {['L01', 'L02', 'L03'].map((l) => (
                <button key={l} onClick={() => setLineId(l)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${lineId === l ? 'border-indigo-300 bg-indigo-50 font-medium text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {lineName(l)}
                </button>
              ))}
            </div>
          }
        /></StickyPageHead>

        {/* 产线状态条 */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold"><Factory className="h-4 w-4 text-indigo-500" /> {lineName(lineId)}</span>
            {wo && (
              <span className="text-xs text-slate-500">
                当前工单 <span className="font-mono font-medium text-slate-700">{wo.externalOrderCode}</span> · {wo.productName} ·
                计划 {wo.plannedQty} / 完成 <span className="font-semibold text-indigo-600">{wo.completedQty}</span>（
                良品 {wo.goodQty} · 不良 <span className="text-red-500">{wo.defectQty}</span>）
              </span>
            )}
          </div>
          {/* 工位状态分布条 */}
          <div className="mt-4 flex h-10 w-full overflow-hidden rounded-lg">
            {byStatus.map(({ s, n }) => (
              <div key={s} className={`flex items-center justify-center text-[11px] font-medium text-white ${EQUIPMENT_STATUS_META[s].dot}`}
                style={{ width: `${(n / Math.max(1, inLine.length)) * 100}%` }}>
                {n > 0 && `${EQUIPMENT_STATUS_META[s].label} ${n}`}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {byStatus.map(({ s, n }) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${EQUIPMENT_STATUS_META[s].dot}`} />
                {EQUIPMENT_STATUS_META[s].label} {n}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* 工单列表 */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">工单与计划</div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {workOrders.map((w) => {
                  const rate = w.plannedQty > 0 ? Math.round((w.completedQty / w.plannedQty) * 100) : 0
                  return (
                    <tr key={w.workOrderId}>
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs">{w.externalOrderCode} <span className="text-slate-400">v{w.version}</span></div>
                        <div className="mt-0.5 text-xs text-slate-500">{w.productName}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${rate >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, rate)}%` }} />
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">{rate}%（{w.completedQty}/{w.plannedQty}）</div>
                      </td>
                      <td className="px-5 py-3"><StatusBadge meta={WORKORDER_STATUS_META[w.status]} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-5 py-2 text-[11px] text-slate-400">计划口径以 MES 为准（来源 {wo?.sourceSystem ?? 'MES-PRD'}）</p>
          </div>

          {/* 当前异常 */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> 当前异常
            </div>
            <div className="divide-y divide-slate-50">
              {events.filter((e) => !['CLOSED', 'CANCELLED'].includes(e.status)).length === 0 ? (
                <div className="flex items-center gap-2 px-5 py-6 text-xs text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 当前无活动异常
                </div>
              ) : (
                events.filter((e) => !['CLOSED', 'CANCELLED'].includes(e.status)).map((e) => (
                  <div key={e.eventId} className="flex items-center gap-3 px-5 py-3">
                    <Badge variant="outline" className={ALARM_LEVEL_META[e.level].badge}>{ALARM_LEVEL_META[e.level].label}</Badge>
                    <span className="flex-1 text-xs">{e.description}</span>
                    <span className="text-[11px] text-slate-400">{e.occurredAt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
