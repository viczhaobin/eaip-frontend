import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Factory, Gauge, Hash, Timer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EQUIPMENT_STATUS_META, ALARM_LEVEL_META, ALARM_EVENT_STATUS_META } from '@/lib/status'
import { alarmApi, deviceApi, integrationApi } from '@/services/mock'
import { lineName, stationName } from '@/services/mock/db'
import type { AlarmEvent, Equipment, StationNode, WorkOrder } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 产线总览：总体状态 / 工单进度 / 站点在线 / 异常与停机 */
export default function LineOverview() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [events, setEvents] = useState<AlarmEvent[]>([])
  const [stations, setStations] = useState<StationNode[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])

  useEffect(() => {
    void deviceApi.listEquipments().then(setEquipments)
    void alarmApi.listEvents().then(setEvents)
    void deviceApi.listStations().then(setStations)
    void integrationApi.listWorkOrders().then(setWorkOrders)
  }, [])

  const online = equipments.filter((e) => e.status === 'ONLINE').length
  const enabled = equipments.filter((e) => e.enabled).length
  const activeAlarms = events.filter((e) => ['ACTIVE', 'ACKNOWLEDGED', 'PROCESSING', 'ESCALATED', 'REOPENED'].includes(e.status))
  const downEquipments = equipments.filter((e) => ['FAULT', 'OFFLINE'].includes(e.status))
  const wo = workOrders.find((w) => w.status === 'IN_PROGRESS')
  const achieveRate = wo && wo.plannedQty > 0 ? Math.round((wo.completedQty / wo.plannedQty) * 100) : 0

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader title="产线总览" description="产线总体状态、站点在线、工单进度与当前异常（演示数据）" /></StickyPageHead>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="设备在线率"
            value={enabled ? `${Math.round((online / enabled) * 100)}%` : '—'}
            sub={`在线 ${online} / 启用 ${enabled} 台`}
            icon={Factory}
            tone={online === enabled && enabled > 0 ? 'success' : 'warning'}
          />
          <StatCard
            label="在产工单"
            value={wo?.externalOrderCode ?? '—'}
            sub={wo ? `${wo.productName} · 计划 ${wo.plannedQty}，已完成 ${wo.completedQty}` : '当前无在产工单'}
            icon={Hash}
            tone="accent"
          />
          <StatCard
            label="计划达成率"
            value={wo ? `${achieveRate}%` : '—'}
            sub={wo ? `良品 ${wo.goodQty} · 不良 ${wo.defectQty}` : '—'}
            icon={Gauge}
            tone={achieveRate >= 80 ? 'success' : 'default'}
          />
          <StatCard
            label="活动异常"
            value={activeAlarms.length}
            sub={`L1 ${activeAlarms.filter((a) => a.level === 'L1').length} · L2 ${activeAlarms.filter((a) => a.level === 'L2').length} · L3+ ${activeAlarms.filter((a) => a.level === 'L3' || a.level === 'L4').length}`}
            icon={AlertTriangle}
            tone={activeAlarms.some((a) => a.level === 'L1') ? 'danger' : activeAlarms.length > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* 站点在线情况 */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold">总站 / 分站状态</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stations.map((s) => (
              <div key={s.stationId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.status === 'ONLINE' ? 'bg-emerald-500' : s.status === 'RECOVERING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[11px]">{s.stationKind}</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-400">{lineName(s.lineId)}{s.parentStationId ? ` · 上级：${stationName(s.parentStationId)}` : ''}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-slate-50 py-1.5">
                    <div className="text-slate-400">状态</div>
                    <div className={`mt-0.5 font-medium ${s.status === 'ONLINE' ? 'text-emerald-600' : s.status === 'RECOVERING' ? 'text-amber-600' : 'text-red-600'}`}>
                      {s.status === 'ONLINE' ? '在线' : s.status === 'RECOVERING' ? '补传中' : '离线'}
                    </div>
                  </div>
                  <div className="rounded bg-slate-50 py-1.5">
                    <div className="text-slate-400">补传积压</div>
                    <div className={`mt-0.5 font-medium ${s.queueBacklog > 100 ? 'text-amber-600' : ''}`}>{s.queueBacklog}</div>
                  </div>
                  <div className="rounded bg-slate-50 py-1.5">
                    <div className="text-slate-400">最近心跳</div>
                    <div className="mt-0.5 font-medium">{s.lastHeartbeatAt?.slice(11) ?? '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {/* 停机列表 */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <Timer className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold">设备停机 / 故障列表</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {downEquipments.length === 0 ? (
                  <tr><td className="px-5 py-8 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />全部设备正常
                  </td></tr>
                ) : downEquipments.map((e) => (
                  <tr key={e.equipmentId}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{e.equipmentName}</div>
                      <div className="text-xs text-slate-400">{e.equipmentCode} · {lineName(e.lineId)}</div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge meta={EQUIPMENT_STATUS_META[e.status]} /></td>
                    <td className="px-5 py-3 text-xs text-slate-400">今日停机 {e.downMinutesToday} 分钟</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 最近事件 */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <Activity className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold">最近事件</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {events.slice(0, 6).map((e) => (
                  <tr key={e.eventId}>
                    <td className="px-5 py-3">
                      <div className="text-xs text-slate-400">{e.occurredAt}</div>
                      <div className="mt-0.5 text-sm">{e.description}</div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge meta={ALARM_LEVEL_META[e.level]} /></td>
                    <td className="px-3 py-3"><StatusBadge meta={ALARM_EVENT_STATUS_META[e.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
