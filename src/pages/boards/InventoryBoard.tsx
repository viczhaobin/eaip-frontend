import { useEffect, useState } from 'react'
import { BoardHeader, BoardStage } from '@/components/board/stage'
import { useClock } from '@/components/board/clock'
import { buildInventory, type InvCell, type InvLine } from '@/services/mock/boards'

const CELL_STYLE: Record<InvCell['status'], string> = {
  OCCUPIED: 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/25 to-emerald-900/40 text-emerald-100',
  EMPTY: 'border-rose-500/50 bg-gradient-to-br from-rose-600/25 to-rose-950/50 text-rose-200',
  FROZEN: 'border-amber-400/60 bg-gradient-to-br from-amber-500/25 to-amber-900/40 text-amber-100',
}

function Cell({ cell }: { cell: InvCell }) {
  if (cell.action) {
    return (
      <div className="flex h-[86px] items-center rounded-md border border-rose-400/70 bg-gradient-to-br from-rose-500/50 to-rose-800/60 px-3">
        <span className="text-lg font-bold tracking-wide text-rose-100">{cell.action}</span>
      </div>
    )
  }
  return (
    <div className={`h-[86px] rounded-md border px-3 py-1.5 ${CELL_STYLE[cell.status]}`}>
      <div className="flex items-baseline justify-between">
        <span className="num text-[15px] font-bold">{cell.code}</span>
        {cell.qty != null && <span className="text-xs text-slate-300">Q:{cell.qty}</span>}
      </div>
      {cell.status === 'OCCUPIED' && (
        <>
          <div className="num mt-0.5 truncate text-[13px] text-slate-200">{cell.lotNo}</div>
          <div className="num mt-1 text-[15px] text-slate-300">{cell.minutes}min</div>
        </>
      )}
      {cell.status === 'FROZEN' && <div className="num mt-1 text-[15px] text-amber-200/80">{cell.minutes}min</div>}
    </div>
  )
}

/** 线边库存看板（中转库位信息看板布局：产线 × 物料列 × 库位格） */
export default function InventoryBoard() {
  const now = useClock()
  const [lines, setLines] = useState<InvLine[]>(() => buildInventory())

  // 实时模拟：库龄增长 + 偶发状态翻转
  useEffect(() => {
    const t = setInterval(() => {
      setLines((prev) => {
        const next = prev.map((l) => ({
          ...l,
          columns: l.columns.map((c) => ({
            ...c,
            cells: c.cells.map((cell) =>
              cell.action ? cell : { ...cell, minutes: cell.status === 'EMPTY' ? 0 : cell.minutes + 1 },
            ),
          })),
        }))
        // 随机翻转 1~2 个格子的状态
        const li = Math.floor(Math.random() * next.length)
        const ci = Math.floor(Math.random() * 4)
        const ri = Math.floor(Math.random() * 8)
        const cell = next[li].columns[ci].cells[ri]
        if (!cell.action) {
          cell.status = cell.status === 'EMPTY' ? 'OCCUPIED' : cell.status === 'OCCUPIED' && Math.random() < 0.15 ? 'FROZEN' : 'EMPTY'
          if (cell.status === 'OCCUPIED') {
            cell.qty = 120 + Math.floor(Math.random() * 10)
            cell.lotNo = `PO26${Math.floor(100000 + Math.random() * 899999)}…`
            cell.minutes = 1
          }
        }
        return next
      })
    }, 10000)
    return () => clearInterval(t)
  }, [])

  const counts = (s: InvCell['status']) =>
    lines.reduce((n, l) => n + l.columns.reduce((m, c) => m + c.cells.filter((x) => x.status === s && !x.action).length, 0), 0)

  return (
    <BoardStage>
      <div className="flex h-full flex-col px-8 pb-5 pt-4">
        <BoardHeader title="线边中转库位信息看板" subtitle="M1 中转库 · 实时库位状态" now={now}>
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-200">
              手动选择 <span className="text-[10px]">▼</span>
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-200">
              线体：L1-L3 <span className="text-[10px]">▼</span>
            </span>
          </div>
        </BoardHeader>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 gap-5">
          {lines.map((l) => (
            <div key={l.line} className="flex min-h-0 flex-col rounded-2xl border border-cyan-400/25 bg-cyan-950/50 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-2xl font-bold tracking-widest text-white">{l.line}</span>
                <span className="num rounded-md bg-emerald-500/20 px-4 py-1 text-lg font-bold text-emerald-300 ring-1 ring-emerald-400/40">
                  在制：{l.product}
                </span>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-4 gap-2.5">
                {l.columns.map((c) => (
                  <div key={c.name} className="flex min-h-0 flex-col gap-2">
                    <div
                      className={`flex h-9 flex-none items-center justify-center rounded-md text-[15px] font-bold ${
                        c.pick ? 'bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50' : 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40'
                      }`}
                    >
                      {c.name}
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                      {c.cells.map((cell) => (
                        <Cell key={cell.code} cell={cell} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部图例 + 统计 */}
        <div className="mt-4 flex flex-none items-center justify-between px-4 text-base text-slate-300">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2">
              <i className="h-4 w-4 rounded-sm bg-gradient-to-br from-emerald-400/70 to-emerald-700/70" /> 解冻（有货物）{counts('OCCUPIED')}
            </span>
            <span className="flex items-center gap-2">
              <i className="h-4 w-4 rounded-sm bg-gradient-to-br from-rose-500/70 to-rose-800/70" /> 空闲 {counts('EMPTY')}
            </span>
            <span className="flex items-center gap-2">
              <i className="h-4 w-4 rounded-sm bg-gradient-to-br from-amber-400/70 to-amber-700/70" /> 冻结 {counts('FROZEN')}
            </span>
            <span className="text-slate-500">Q 数量 · min 库龄</span>
          </div>
          <div className="num text-sm text-slate-500">冻结库位不参与出库 · 补料动作由 AGV 调度看板联动</div>
        </div>
      </div>
    </BoardStage>
  )
}
