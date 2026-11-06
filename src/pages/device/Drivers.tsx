import { useEffect, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/page-header'
import { deviceApi } from '@/services/mock'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/status'
import type { Driver } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 驱动管理（F1.1.2）：目录、启停、健康度 */
export default function Drivers() {
  const [list, setList] = useState<Driver[]>([])

  const load = () => void deviceApi.listDrivers().then(setList)
  useEffect(load, [])

  const toggle = async (d: Driver) => {
    try {
      await deviceApi.setDriverStatus(d.driverId, d.status !== 'RUNNING')
      toast.success(d.status === 'RUNNING' ? `驱动「${d.name}」已停止，不影响其他驱动实例` : `驱动「${d.name}」已启动`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败')
    }
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="驱动管理"
          description="协议驱动目录与运行健康；驱动包需签名校验，生产环境禁止任意执行未审核插件"
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => (
            <div key={d.driverId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">v{d.version} · 安装于 {d.installedAt}</div>
                </div>
                <Badge variant="outline" className={d.status === 'RUNNING' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                  {d.status === 'RUNNING' ? '运行中' : '已停止'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.applicableTypes.map((t) => (
                  <Badge key={t} variant="outline" className="text-[11px] text-slate-500">{EQUIPMENT_TYPE_LABELS[t]}</Badge>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-center text-xs">
                <div>
                  <div className="text-slate-400">连接数</div>
                  <div className="mt-0.5 font-semibold tabular-nums">{d.connections}</div>
                </div>
                <div>
                  <div className="text-slate-400">错误数</div>
                  <div className={`mt-0.5 font-semibold tabular-nums ${d.errorCount > 0 ? 'text-amber-600' : ''}`}>{d.errorCount}</div>
                </div>
                <div>
                  <div className="text-slate-400">运行时长</div>
                  <div className="mt-0.5 font-semibold tabular-nums">{d.uptimeHours > 0 ? `${d.uptimeHours.toFixed(0)}h` : '—'}</div>
                </div>
              </div>
              {d.lastHeartbeatAt && <div className="mt-2 text-[11px] text-slate-400">最近心跳 {d.lastHeartbeatAt}</div>}

              <div className="mt-4">
                <Button
                  variant="outline" size="sm" className="w-full gap-1.5"
                  onClick={() => toggle(d)}
                >
                  {d.status === 'RUNNING' ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {d.status === 'RUNNING' ? '停止驱动实例' : '启动驱动实例'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          首期内置：Modbus TCP / Modbus RTU / OPC UA Client / Siemens S7 / MQTT Client。OPC DA 仅通过 Windows 兼容代理适配，不作为跨平台核心协议。
        </p>
      </div>
    </AppLayout>
  )
}
