import { useEffect, useState } from 'react'
import { Cpu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { EQUIPMENT_STATUS_META, EQUIPMENT_TYPE_LABELS } from '@/lib/status'
import { deviceApi } from '@/services/mock'
import { lineName, stationName } from '@/services/mock/db'
import type { Equipment, EquipmentStatus } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const STATUS_FILTERS: { value: EquipmentStatus | '__all__'; label: string }[] = [
  { value: '__all__', label: '全部状态' },
  { value: 'ONLINE', label: '在线' },
  { value: 'DEGRADED', label: '降级' },
  { value: 'FAULT', label: '故障' },
  { value: 'OFFLINE', label: '离线' },
  { value: 'DISABLED', label: '未启用' },
]

/** 设备状态总览：卡片 + 状态分布，状态以颜色+文字同时呈现 */
export default function EquipmentStatus() {
  const [list, setList] = useState<Equipment[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<EquipmentStatus | '__all__'>('__all__')
  const [lineId, setLineId] = useState('')

  const load = () => {
    void deviceApi.listEquipments({ keyword, status: status === '__all__' ? undefined : status, lineId: lineId || undefined }).then(setList)
  }
  useEffect(load, [keyword, status, lineId])

  const distribution = (Object.keys(EQUIPMENT_STATUS_META) as EquipmentStatus[]).map((s) => ({
    status: s,
    count: list.filter((e) => e.status === s).length,
  }))

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader title="设备状态" description="全部接入设备的运行状态、控制模式与通信状态一览" /></StickyPageHead>

        {/* 状态分布 */}
        <div className="mt-6 flex flex-wrap gap-2">
          {distribution.map((d) => (
            <button
              key={d.status}
              onClick={() => setStatus(d.status)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                status === d.status ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${EQUIPMENT_STATUS_META[d.status].dot}`} />
              {EQUIPMENT_STATUS_META[d.status].label}
              <span className="font-semibold tabular-nums">{d.count}</span>
            </button>
          ))}
        </div>

        {/* 过滤 */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input className="w-64" placeholder="搜索编码 / 名称…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
          >
            <option value="">全部产线</option>
            <option value="L01">总装一线</option>
            <option value="L02">总装二线</option>
            <option value="L03">机加工线</option>
          </select>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as EquipmentStatus | '__all__')}
          >
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* 设备卡片 */}
        {list.length === 0 ? (
          <EmptyState icon={Cpu} title="没有匹配的设备" description="调整筛选条件后重试" />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((e) => (
              <div key={e.equipmentId} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${e.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : e.status === 'FAULT' || e.status === 'OFFLINE' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                      <Cpu className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <div className="font-medium">{e.equipmentName}</div>
                      <div className="text-xs text-slate-400">{e.equipmentCode} · {EQUIPMENT_TYPE_LABELS[e.equipmentType]}</div>
                    </div>
                  </div>
                  <StatusBadge meta={EQUIPMENT_STATUS_META[e.status]} />
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div>所属：{lineName(e.lineId)} / {stationName(e.stationId)}</div>
                  <div>控制模式：<span className="font-medium">{e.controlMode}</span> · 通信：{e.enabled ? e.endpoint : '未启用'}</div>
                  {e.currentWorkOrder && <div>当前工单：{e.currentWorkOrder} · {e.currentProduct}</div>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-center text-xs">
                  <div>
                    <div className="text-slate-400">今日产量</div>
                    <div className="mt-0.5 font-semibold tabular-nums">{e.outputToday}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">运行 / 停机</div>
                    <div className="mt-0.5 font-semibold tabular-nums">{e.runMinutesToday} / {e.downMinutesToday} 分</div>
                  </div>
                  <div>
                    <div className="text-slate-400">当前报警</div>
                    <div className={`mt-0.5 font-semibold tabular-nums ${e.currentAlarmCount > 0 ? 'text-red-500' : ''}`}>{e.currentAlarmCount}</div>
                  </div>
                </div>
                {e.lastStatusChangeAt && (
                  <div className="mt-2 text-[11px] text-slate-400">最近状态变化：{e.lastStatusChangeAt}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
