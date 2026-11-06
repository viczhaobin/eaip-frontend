import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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

function series(base: number, amp: number, points = 48): { t: string; v: number }[] {
  return Array.from({ length: points }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    v: Number(Math.abs(base + Math.sin(i * 0.7 + base) * amp + Math.cos(i * 0.31) * amp * 0.6).toFixed(1)),
  }))
}

/** 运行监控（8.3）：全量监控指标 + 服务健康 */
export default function RuntimeMonitor() {
  const [services, setServices] = useState<ServiceHealth[]>([])

  useEffect(() => {
    void systemApi.listServiceHealth().then(setServices)
  }, [])

  const charts = [
    { title: '驱动连接数 / 错误率', data: series(11, 3), color: '#4f46e5', unit: '个' },
    { title: '采集成功率 %', data: series(99.2, 0.6), color: '#10b981', unit: '%' },
    { title: '采集队列长度', data: series(14, 9), color: '#f59e0b', unit: '' },
    { title: 'API 调用量 / 分钟', data: series(380, 120), color: '#0ea5e9', unit: '' },
    { title: 'P95 响应 ms', data: series(46, 14), color: '#8b5cf6', unit: 'ms' },
    { title: '历史写入速率（点/s）', data: series(1250, 260), color: '#ef4444', unit: '' },
  ]

  const down = services.filter((s) => s.status === 'DOWN').length
  const degraded = services.filter((s) => s.status === 'DEGRADED').length

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="运行监控"
          description="CPU/内存/磁盘/网络、驱动连接、设备在线率、采集质量、接口性能、消息积压、数据库与分站心跳；监控自身异常需独立健康状态"
        /></StickyPageHead>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="设备在线率" value="80%" sub="在线 8 / 启用 10" tone="accent" />
          <StatCard label="OPC 客户端连接" value="2" sub="订阅 18 个" tone="default" />
          <StatCard label="MQTT 消息积压" value="26" sub="AGV Broker 断开，本地队列缓存" tone="warning" />
          <StatCard label="服务健康" value={`${services.length - down - degraded}/${services.length}`} sub={`异常 ${down} · 降级 ${degraded}`} tone={down > 0 ? 'danger' : degraded > 0 ? 'warning' : 'success'} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((c) => (
            <div key={c.title} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">{c.title}</div>
              <div className="mt-2 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.data}>
                    <defs>
                      <linearGradient id={`rm-${c.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={c.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip />
                    <Area type="monotone" dataKey="v" stroke={c.color} fill={`url(#rm-${c.title})`} strokeWidth={1.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold">服务健康（含分站心跳与补传积压）</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div key={s.service} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">{s.service}</span>
                <StatusBadge meta={HEALTH_META[s.status]} />
              </div>
              <div className="mt-2 text-xs text-slate-500">{s.detail}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          其余监控项：数据库连接数/容量/慢查询、上报任务待发送量与失败量、分站心跳与补传积压、磁盘容量阈值预警（禁止无提示删除未过保留期数据）。告警阈值可在配置中心调整。
        </p>
      </div>
    </AppLayout>
  )
}
