import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart as RPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { ALARM_LEVEL_META } from '@/lib/status'
import { alarmApi, deviceApi } from '@/services/mock'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const LEVEL_COLORS = { L1: '#ef4444', L2: '#f97316', L3: '#f59e0b', L4: '#94a3b8' }

/** 异常分析（F5.6）：次数、响应/处理时长、TOP 分布、MTTR/MTBF（口径需项目确认） */
export default function Analysis() {
  const [stats, setStats] = useState<{ total: number; active: number; closed: number; byLevel: { level: 'L1' | 'L2' | 'L3' | 'L4'; count: number }[] } | null>(null)
  const [equipCount, setEquipCount] = useState(0)

  useEffect(() => {
    void alarmApi.stats().then(setStats)
    void deviceApi.listEquipments().then((es) => setEquipCount(es.length))
  }, [])

  const byLevel = stats?.byLevel ?? []
  const avgResponseMin = 3.2
  const avgHandleMin = 42
  const mttr = '38 分钟'
  const mtbf = '126 小时'

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="异常分析"
          description="事件发生次数、持续时间、首次/平均响应、超时率与重复发生率分布；MTTR/MTBF 统计口径由客户确认"
        /></StickyPageHead>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="事件总数" value={stats?.total ?? 0} sub={`活动 ${stats?.active ?? 0} · 已关闭 ${stats?.closed ?? 0}`} tone="default" />
          <StatCard label="平均首次响应" value={`${avgResponseMin} 分钟`} sub="L1 目标：立即 · L2 目标：5 分钟" tone={avgResponseMin <= 5 ? 'success' : 'warning'} />
          <StatCard label="平均处理时长" value={`${avgHandleMin} 分钟`} sub="超时率 8% · 重复发生率 5%" tone="default" />
          <StatCard label="MTTR / MTBF" value={mttr} sub={`MTBF ${mtbf} · 维修开始/恢复边界按客户口径`} tone="accent" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* 按等级分布 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">按等级分布</div>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={byLevel} dataKey="count" nameKey="level" innerRadius={55} outerRadius={85}
                    label={({ level, count }) => `${ALARM_LEVEL_META[level as 'L1'].label.split(' ')[0]}：${count}`}>
                    {byLevel.map((d) => <Cell key={d.level} fill={LEVEL_COLORS[d.level]} />)}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 按设备分布 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">TOP 设备异常次数</div>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'EQ003 气密检测仪', n: 2 },
                  { name: 'EQ006 贴标 CNC', n: 3 },
                  { name: 'EQ009 老线 PLC', n: 1 },
                  { name: 'EQ001 上料 PLC', n: 1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={10} tick={false} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="n" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
              <div>EQ003 气密检测仪 · EQ006 贴标 CNC · EQ009 老线 PLC · EQ001 上料 PLC</div>
            </div>
          </div>
        </div>

        {/* 按班次/产线 */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold">按班次分布（近 7 天）</div>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { shift: '早班', L1: 1, L2: 3, L3: 4 },
                { shift: '中班', L1: 0, L2: 2, L3: 3 },
                { shift: '晚班', L1: 0, L2: 1, L3: 2 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="shift" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="L1" stackId="a" fill={LEVEL_COLORS.L1} />
                <Bar dataKey="L2" stackId="a" fill={LEVEL_COLORS.L2} />
                <Bar dataKey="L3" stackId="a" fill={LEVEL_COLORS.L3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            共接入设备 {equipCount} 台；指标还支持按工位、产线分布与 TOP 异常类型/原因（示例数据）。
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
