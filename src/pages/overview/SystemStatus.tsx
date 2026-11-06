import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Cpu, Database, HardDrive, Network } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { StatusBadge } from '@/components/common/status-badge'
import { systemApi } from '@/services/mock'
import type { ServiceHealth } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const HEALTH_META = {
  UP: { label: '正常', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DEGRADED: { label: '降级', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  DOWN: { label: '不可用', badge: 'bg-red-50 text-red-700 border-red-200' },
} as const

/** 生成一条稳定的伪随机指标曲线 */
function metricSeries(base: number, amp: number, points = 40): { t: string; v: number }[] {
  return Array.from({ length: points }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    v: Number((base + Math.sin(i * 0.8 + base) * amp + Math.cos(i * 0.37) * amp * 0.5).toFixed(1)),
  }))
}

/** 系统运行状态：资源指标 + 服务健康（规格书 8.3 运行监控） */
export default function SystemStatus() {
  const [services, setServices] = useState<ServiceHealth[]>([])

  useEffect(() => {
    void systemApi.listServiceHealth().then(setServices)
  }, [])

  const cpu = metricSeries(38, 14)
  const mem = metricSeries(55, 8)
  const disk = metricSeries(62, 2)
  const net = metricSeries(45, 20)

  const metrics = [
    { title: 'CPU 使用率', data: cpu, icon: Cpu, color: '#4f46e5', latest: `${cpu[cpu.length - 1].v}%` },
    { title: '内存使用率', data: mem, icon: Database, color: '#0ea5e9', latest: `${mem[mem.length - 1].v}%` },
    { title: '磁盘使用率', data: disk, icon: HardDrive, color: '#f59e0b', latest: `${disk[disk.length - 1].v}%` },
    { title: '网络吞吐 (MB/s)', data: net, icon: Network, color: '#10b981', latest: `${net[net.length - 1].v}` },
  ]

  const downCount = services.filter((s) => s.status === 'DOWN').length
  const degradedCount = services.filter((s) => s.status === 'DEGRADED').length

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader title="系统运行状态" description="平台资源占用与服务健康度（演示数据，告警阈值可在配置中心调整）" /></StickyPageHead>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="服务总数" value={services.length} sub={`异常 ${downCount} · 降级 ${degradedCount}`} icon={Cpu} tone={downCount > 0 ? 'danger' : degradedCount > 0 ? 'warning' : 'success'} />
          <StatCard label="设备在线率" value="80%" sub="在线 8 / 启用 10 台" icon={Network} tone="accent" />
          <StatCard label="采集成功率" value="99.2%" sub="平均延迟 210ms · 队列 16" icon={Database} tone="success" />
          <StatCard label="API P95" value="45ms" sub="今日调用 55,720 次" icon={HardDrive} tone="default" />
        </div>

        {/* 资源曲线 */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {metrics.map((m) => (
            <div key={m.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <m.icon className="h-4 w-4 text-slate-300" /> {m.title}
                </span>
                <span className="text-lg font-semibold tabular-nums">{m.latest}</span>
              </div>
              <div className="mt-3 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.data}>
                    <defs>
                      <linearGradient id={`g-${m.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={m.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="v" stroke={m.color} fill={`url(#g-${m.title})`} strokeWidth={1.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* 服务健康 */}
        <h2 className="mt-8 text-sm font-semibold">服务健康检查</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div key={s.service} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">{s.service}</span>
                <StatusBadge meta={HEALTH_META[s.status]} />
              </div>
              <div className="mt-2 text-xs text-slate-500">{s.detail}</div>
              <div className="mt-2 text-[11px] text-slate-400">运行时长 {s.uptimeHours.toFixed(1)} 小时</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
