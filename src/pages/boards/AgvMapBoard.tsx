import { useEffect, useState } from 'react'
import { BoardHeader, BoardStage } from '@/components/board/stage'
import { useClock, fmtTime, fmtDate } from '@/components/board/clock'
import { AGV_STATE_META, buildFleet, feedingLines, type AgvUnit } from '@/services/mock/boards'

/** AGV 图标（倒三角定位标，按状态着色） */
function AgvMarker({ agv }: { agv: AgvUnit }) {
  const color = AGV_STATE_META[agv.state].color
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${agv.x}%`, top: `${agv.y}%` }}>
      <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-[0_0_5px_currentColor]" style={{ color }}>
        <path d="M10 18 L2 5 Q10 0 18 5 Z" fill={color} opacity="0.9" />
      </svg>
      <div
        className="num absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded px-1 text-[11px] font-bold text-amber-200"
        style={{ textShadow: '0 1px 3px #000' }}
      >
        {agv.id}
        {agv.task ? `(${agv.task})` : ''}
      </div>
    </div>
  )
}

/** 货架装饰条 */
function Racks({ rows, cols, vertical }: { rows: number; cols: number; vertical?: boolean }) {
  return (
    <div className={vertical ? 'flex gap-[6px]' : 'flex flex-col gap-[6px]'}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={vertical ? 'flex flex-col gap-[6px]' : 'flex gap-[6px]'}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`rounded-[2px] bg-cyan-500/25 ${vertical ? 'h-7 w-[7px]' : 'h-[7px] w-12'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

const ZONE_LINES = ['Line05', 'Line04', 'Line03', 'Line02', 'Line01']

/** AGV 调度看板（实时位置地图 + 前道补料 + 车队状态） */
export default function AgvMapBoard() {
  const now = useClock()
  const [fleet, setFleet] = useState<AgvUnit[]>(() => buildFleet())
  const [listOpen, setListOpen] = useState(false)

  // 模拟行驶：运行态 AGV 缓慢漂移，充电/关机静止
  useEffect(() => {
    const t = setInterval(() => {
      setFleet((prev) =>
        prev.map((a) => {
          if (a.state !== 'RUN_IDLE' && a.state !== 'RUN_BUSY') return a
          return {
            ...a,
            x: Math.min(94, Math.max(5, a.x + (Math.random() - 0.5) * 2.4)),
            y: Math.min(90, Math.max(16, a.y + (Math.random() - 0.5) * 1.6)),
          }
        }),
      )
    }, 2000)
    return () => clearInterval(t)
  }, [])

  const feedings = feedingLines(fleet)
  const stateCount = (s: AgvUnit['state']) => fleet.filter((a) => a.state === s).length

  return (
    <BoardStage>
      <div className="flex h-full flex-col px-8 pb-4 pt-4">
        <BoardHeader title="AGV 实时调度看板" subtitle="M1 车间 · 位置由 RCS 订阅推送" now={now}>
          <span className="num rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-lg text-cyan-100">
            {fmtDate(now)} {fmtTime(now)}
          </span>
        </BoardHeader>

        <div className="relative mt-3 min-h-0 flex-1 rounded-2xl border border-cyan-400/25 bg-[#071224]/80 p-5 backdrop-blur">
          {/* 左上/右上货架区 */}
          <div className="absolute left-6 top-5 flex gap-8">
            <Racks rows={6} cols={2} vertical />
            <Racks rows={7} cols={3} />
          </div>
          <div className="absolute right-6 top-5">
            <Racks rows={8} cols={4} />
          </div>

          {/* 前道补料情况 */}
          <div className="absolute left-1/2 top-5 w-[560px] -translate-x-1/2 rounded-xl border border-cyan-400/30 bg-slate-900/80 px-6 py-4">
            <div className="mb-2 text-center text-lg font-bold tracking-widest text-cyan-300">前道补料情况</div>
            <div className="space-y-1.5 text-[15px]">
              {feedings.map((f) => (
                <div key={f.line} className="flex gap-3">
                  <span className="w-9 font-bold text-amber-300">• {f.line}:</span>
                  <span className={f.text ? 'text-amber-300' : 'text-slate-500'}>{f.text || '暂无补料任务'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 产线库区（Line05 → Line01） */}
          <div className="absolute bottom-16 left-8 right-8 top-[240px] grid grid-cols-[1fr_1fr_130px_1fr_1fr] gap-4">
            {ZONE_LINES.map((line) => (
              <div key={line} className="relative rounded-lg border border-dashed border-slate-600/60">
                <span className="num absolute left-2 top-1 text-sm font-bold text-cyan-300/80">{line}</span>
                <div className="absolute inset-x-3 bottom-2 top-8 flex justify-between">
                  <Racks rows={3} cols={5} />
                  <Racks rows={4} cols={2} vertical />
                </div>
              </div>
            ))}
            {/* 中央通道货架 */}
            <div className="flex items-stretch justify-center">
              <Racks rows={12} cols={1} vertical />
            </div>
          </div>

          {/* AGV 定位标 */}
          {fleet.map((a) => (
            <AgvMarker key={a.id} agv={a} />
          ))}

          {/* 左侧 AGV 列表抽屉 */}
          <button
            className="absolute left-0 top-1/2 flex h-28 w-9 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-cyan-400/40 bg-cyan-500/15 text-sm font-bold text-cyan-200"
            onClick={() => setListOpen((v) => !v)}
          >
            <span className="[writing-mode:vertical-lr]">AGV 列表</span>
          </button>
          {listOpen && (
            <div className="absolute bottom-4 left-10 top-1/2 z-10 w-64 -translate-y-1/2 overflow-y-auto rounded-xl border border-cyan-400/30 bg-slate-900/95 p-3">
              <div className="mb-2 text-sm font-bold text-cyan-200">车队状态（{fleet.length} 台）</div>
              {fleet.map((a) => (
                <div key={a.id} className="flex items-center gap-2 border-b border-slate-800 py-1.5 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: AGV_STATE_META[a.state].color }} />
                  <span className="num w-16 font-semibold">{a.id}</span>
                  <span className="flex-1 text-xs text-slate-400">{AGV_STATE_META[a.state].label}</span>
                  <span className="num text-xs text-slate-500">{a.battery}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部图例 + 统计 */}
        <div className="mt-3 flex flex-none items-center justify-between px-6">
          <div className="flex items-center gap-7 text-[15px] text-slate-300">
            {(Object.keys(AGV_STATE_META) as AgvUnit['state'][]).map((s) => (
              <span key={s} className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 20 20">
                  <path d="M10 18 L2 5 Q10 0 18 5 Z" fill={AGV_STATE_META[s].color} />
                </svg>
                {AGV_STATE_META[s].label}
                <span className="num text-slate-500">{stateCount(s)}</span>
              </span>
            ))}
          </div>
          <div className="num text-sm text-slate-500">运行 {stateCount('RUN_IDLE') + stateCount('RUN_BUSY')} · 充电 {stateCount('CHARGING')} · 异常 {stateCount('ALARM') + stateCount('OFF')}</div>
        </div>
      </div>
    </BoardStage>
  )
}
