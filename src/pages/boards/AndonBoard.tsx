import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { BoardHeader, BoardStage } from '@/components/board/stage'
import { useClock } from '@/components/board/clock'
import { alarmApi, deviceApi } from '@/services/mock'
import type { AlarmEvent, Equipment } from '@/types/domain'

/* 设备状态 → 安灯瓦片状态 */
const TILE_META: Record<string, { cls: string; label: string; text: string }> = {
  run: { cls: 'border-emerald-400/70 bg-emerald-400/15', label: '运行', text: 'text-emerald-300' },
  idle: { cls: 'border-sky-400/70 bg-sky-400/15', label: '空闲/换型', text: 'text-sky-300' },
  warn: { cls: 'border-amber-400/70 bg-amber-400/15', label: '预警', text: 'text-amber-300' },
  fault: { cls: 'border-rose-500/80 bg-rose-500/20', label: '故障/安全', text: 'text-rose-400' },
  off: { cls: 'border-slate-500/50 bg-slate-500/10', label: '离线', text: 'text-slate-400' },
}

function tileOf(e: Equipment): string {
  if (!e.enabled) return 'off'
  if (e.status === 'ONLINE') return 'run'
  if (e.status === 'DEGRADED') return 'warn'
  if (e.status === 'FAULT') return 'fault'
  if (e.status === 'OFFLINE') return 'off'
  return 'idle'
}

const LEVEL_BADGE: Record<string, string> = {
  L1: 'bg-amber-400/20 text-amber-300',
  L2: 'bg-rose-500/25 text-rose-300',
  L3: 'bg-rose-500 text-white',
  L4: 'bg-slate-500/40 text-slate-300',
}

function fmtDur(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** 迷你仪表盘（SVG 弧形） */
function Gauge({ value, name, color }: { value: number; name: string; color: string }) {
  const r = 40
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="88" viewBox="0 0 120 88">
        <circle cx="60" cy="64" r={r} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="10"
          strokeDasharray={`${arc} ${c}`} strokeLinecap="round" transform="rotate(135 60 64)" />
        <circle cx="60" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(arc * value) / 100} ${c}`} strokeLinecap="round"
          transform="rotate(135 60 64)" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x="60" y="60" textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700" fontFamily="monospace">
          {value.toFixed(1)}%
        </text>
      </svg>
      <div className="mt-1 text-sm text-slate-400">{name}</div>
    </div>
  )
}

/** ANDON 看板（基于 linkline preview/dashboard.html 风格实现） */
export default function AndonBoard() {
  const now = useClock()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [alarms, setAlarms] = useState<AlarmEvent[]>([])
  const [output, setOutput] = useState(342)

  useEffect(() => {
    void deviceApi.listEquipments().then(setEquipments)
    void alarmApi.listEvents().then((es) => setAlarms(es.filter((e) => !['CLOSED', 'CANCELLED', 'RECOVERED'].includes(e.status))))
  }, [])

  // 模拟实时：节拍抖动 + 产量缓增
  useEffect(() => {
    const t = setInterval(() => {
      setEquipments((prev) =>
        prev.map((e) =>
          e.status === 'ONLINE' && e.cycleTimeSec
            ? { ...e, cycleTimeSec: Math.max(30, Math.min(59, e.cycleTimeSec + Math.round((Math.random() - 0.5) * 4))) }
            : e,
        ),
      )
      if (Math.random() < 0.5) setOutput((v) => v + 1)
    }, 2000)
    return () => clearInterval(t)
  }, [])

  const tiles = equipments.filter((e) => e.enabled)
  const rate = ((output / 480) * 100).toFixed(1)
  const kpis = [
    { label: '计划产量', value: '480', unit: '件', sub: '工单 WO20261106001' },
    { label: '实际产量', value: String(output), unit: '件', sub: '良品 339 / 不良 3' },
    { label: '达成率', value: rate, unit: '%', sub: '时序进度 68.5%', accent: true },
    { label: 'OEE', value: '78.0', unit: '%', sub: '目标 ≥ 75%', accent: true },
    { label: '当班异常', value: String(alarms.length), unit: '条', sub: `未关闭 ${alarms.length} 条`, bad: true },
    { label: 'MTTR', value: '12.4', unit: 'min', sub: 'MTTA 2.1 min' },
  ]

  const cycleData = useMemo(
    () => tiles.filter((e) => e.cycleTimeSec).map((e) => ({ name: e.equipmentCode, cycle: e.cycleTimeSec ?? 0, limit: 60 })),
    [tiles],
  )
  const wipData = [
    { name: '上线缓存', v: 7 }, { name: '上料段', v: 8 }, { name: '装配段', v: 6 },
    { name: '检测段', v: 4 }, { name: '返修支线', v: 2 }, { name: '下线缓存', v: 4 },
  ]

  // 滚动墙：复制一份实现无缝滚动
  const rows = alarms.length > 4 ? [...alarms, ...alarms] : alarms

  return (
    <BoardStage>
      <div className="flex h-full flex-col gap-4 px-8 pb-6 pt-4">
        <BoardHeader title="总装一线 · ANDON 看板" subtitle="线边采集与集成平台 · 实时安灯" now={now} />

        {/* KPI 条 */}
        <div className="grid flex-none grid-cols-6 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-cyan-400/15 bg-cyan-950/40 px-5 py-3 backdrop-blur">
              <div className="text-sm text-slate-400">{k.label}</div>
              <div className={`num mt-1 text-[42px] font-bold leading-none ${k.bad ? 'text-rose-400' : k.accent ? 'text-cyan-300' : 'text-white'}`}>
                {k.value}
                <span className="ml-1 text-lg font-normal text-slate-400">{k.unit}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[1.05fr_1fr] gap-4">
          {/* 线体状态墙 */}
          <div className="col-span-8 flex flex-col rounded-xl border border-cyan-400/15 bg-cyan-950/40 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-100">线体状态总览</h3>
              <span className="text-xs text-slate-400">主线 · {tiles.length} 台设备 · 在制 27/40</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-2 gap-3">
              {tiles.map((e) => {
                const m = TILE_META[tileOf(e)]
                return (
                  <div key={e.equipmentId} className={`flex flex-col justify-between rounded-lg border px-3 py-2 ${m.cls}`}>
                    <div>
                      <div className="text-lg font-bold">{e.equipmentName}</div>
                      <div className="text-xs opacity-80">{e.equipmentCode} · {e.controlMode}</div>
                    </div>
                    <div>
                      <div className={`text-base font-semibold ${m.text}`}>{m.label}</div>
                      <div className="num text-lg font-bold">
                        {e.cycleTimeSec ? `${e.cycleTimeSec}s` : '—'}
                        <span className="ml-1 text-xs font-normal opacity-70">/ 60s</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex gap-5 text-xs text-slate-400">
              {(['run', 'idle', 'warn', 'fault', 'off'] as const).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <i className={`h-2.5 w-2.5 rounded-sm ${TILE_META[k].cls.split(' ')[1]}`} />
                  {TILE_META[k].label}
                </span>
              ))}
              <span className="ml-auto">颜色 + 文字双呈现 · 闪烁 = 异常升级中（L2+）</span>
            </div>
          </div>

          {/* OEE */}
          <div className="col-span-4 flex flex-col rounded-xl border border-cyan-400/15 bg-cyan-950/40 p-4 backdrop-blur">
            <h3 className="mb-1 text-lg font-semibold text-cyan-100">OEE <span className="ml-2 text-xs font-normal text-slate-400">当班 · 每 5min 汇总</span></h3>
            <div className="num text-center text-[54px] font-bold leading-none text-cyan-300 [text-shadow:0_0_16px_rgba(34,211,238,.5)]">
              78.0<span className="text-2xl">%</span>
            </div>
            <div className="mt-2 flex flex-1 items-center justify-around">
              <Gauge value={85.2} name="时间开动率" color="#2563eb" />
              <Gauge value={92.4} name="性能开动率" color="#0891b2" />
              <Gauge value={99.1} name="良品率" color="#7c3aed" />
            </div>
          </div>

          {/* 工位节拍 */}
          <div className="col-span-5 flex flex-col rounded-xl border border-cyan-400/15 bg-cyan-950/40 p-4 backdrop-blur">
            <h3 className="mb-1 text-lg font-semibold text-cyan-100">设备节拍 <span className="ml-2 text-xs font-normal text-slate-400">上限 60s · 超限标红</span></h3>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(203,213,225,.7)', fontSize: 12 }} axisLine={{ stroke: 'rgba(148,163,184,.3)' }} />
                  <YAxis tick={{ fill: 'rgba(203,213,225,.7)', fontSize: 12 }} axisLine={false} domain={[0, 90]} />
                  <ReferenceLine y={60} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: '上限 60s', fill: '#fbbf24', fontSize: 12 }} />
                  <Bar dataKey="cycle" radius={[4, 4, 0, 0]}>
                    {cycleData.map((d) => (
                      <Cell key={d.name} fill={d.cycle > d.limit ? '#f43f5e' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 安灯异常滚动墙 */}
          <div className="col-span-4 flex flex-col rounded-xl border border-cyan-400/15 bg-cyan-950/40 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-100">安灯异常</h3>
              <span className="text-xs text-rose-300">未关闭 {alarms.length} 条</span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className="animate-[scroll-up_20s_linear_infinite]">
                {rows.map((a, i) => (
                  <div key={`${a.eventId}-${i}`} className="flex items-center gap-3 border-b border-slate-700/40 py-2.5 text-sm">
                    <span className={`h-6 w-1 rounded ${a.level === 'L1' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${LEVEL_BADGE[a.level]}`}>{a.level}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {a.source} · {a.alarmCode}
                      <span className="ml-2 text-xs text-slate-500">{a.description}</span>
                    </span>
                    <span className={`num text-base font-bold ${a.level === 'L1' ? 'text-amber-300' : 'text-rose-400'}`}>
                      {fmtDur(now.getTime() - new Date(a.occurredAt.replace(' ', 'T')).getTime())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <style>{`@keyframes scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }`}</style>
          </div>

          {/* 在制品分布 */}
          <div className="col-span-3 flex flex-col rounded-xl border border-cyan-400/15 bg-cyan-950/40 p-4 backdrop-blur">
            <h3 className="mb-1 text-lg font-semibold text-cyan-100">在制品分布</h3>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wipData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'rgba(203,213,225,.7)', fontSize: 12 }} axisLine={false} domain={[0, 10]} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'rgba(203,213,225,.7)', fontSize: 12 }} axisLine={{ stroke: 'rgba(148,163,184,.3)' }} />
                  <Bar dataKey="v" radius={[0, 4, 4, 0]} barSize={14}>
                    {wipData.map((d) => (
                      <Cell key={d.name} fill={d.v >= 8 ? '#fbbf24' : '#0891b2'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </BoardStage>
  )
}
