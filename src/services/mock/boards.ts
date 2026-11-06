/* 大屏看板专用 Mock 数据：线边库位 + AGV 车队（确定性种子 + 运行时漂移由页面驱动） */

/* ---------- 线边库存看板 ---------- */

export type InvStatus = 'OCCUPIED' | 'EMPTY' | 'FROZEN'

export interface InvCell {
  code: string
  status: InvStatus
  /** 有货：数量 / 批次 / 入库分钟 */
  qty?: number
  lotNo?: string
  minutes: number
  /** 补料动作横幅（替代常规内容） */
  action?: string
}

export interface InvColumn {
  name: string
  pick: boolean
  cells: InvCell[]
}

export interface InvLine {
  line: string
  product: string
  columns: InvColumn[]
}

/** 确定性伪随机 */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MATERIALS: [string, string, string, string][] = [
  ['电芯-A', '电芯-B-取料', 'Busbar-A', 'Busbar-B-取料'],
  ['电芯-A', '电芯-B-取料', '外壳-A', '外壳-B-取料'],
  ['线束-A', '线束-B-取料', 'Busbar-A', 'Busbar-B-取料'],
]

const LOTS = ['PO26063018008', 'POAH26067051', 'POAH26067052', 'POAH26070980', 'GFA620260519B', 'GFA820260518C', 'PO26063018003', 'PO26062817002']

export function buildInventory(): InvLine[] {
  const rand = mulberry32(20261106)
  const lines: InvLine[] = []
  for (let li = 0; li < 3; li++) {
    const columns: InvColumn[] = MATERIALS[li].map((name, ci) => {
      const pick = name.endsWith('-取料')
      const cells: InvCell[] = []
      for (let r = 0; r < 8; r++) {
        const code = `M1G${10 + li}${String.fromCharCode(65 + ci)}_${r + 1}${pick ? `Q:${120 + ((li + ci) % 2) * 10}` : ''}`
        const p = rand()
        if (p < 0.58) {
          cells.push({
            code,
            status: 'OCCUPIED',
            qty: 120 + Math.floor(rand() * 10),
            lotNo: LOTS[Math.floor(rand() * LOTS.length)] + '…',
            minutes: 60 + Math.floor(rand() * 340),
          })
        } else if (p < 0.86) {
          cells.push({ code, status: 'EMPTY', minutes: 0 })
        } else {
          cells.push({ code, status: 'FROZEN', minutes: 200 + Math.floor(rand() * 260) })
        }
      }
      // 少量补料动作横幅（取料列优先）
      const spot = Math.floor(rand() * 6)
      if (pick || rand() < 0.5) {
        cells[spot] = { ...cells[spot], action: rand() < 0.5 ? '补料：下达' : '补料：取料完成', qty: undefined, lotNo: undefined }
      }
      return { name, pick, cells }
    })
    lines.push({
      line: `L${li + 1}`,
      product: ['DJ267M1005', 'DJ267M1001', 'DJ267M1012'][li],
      columns,
    })
  }
  return lines
}

/* ---------- AGV 调度看板 ---------- */

export type AgvState = 'RUN_IDLE' | 'RUN_BUSY' | 'CHARGING' | 'ALARM' | 'OFF'

export const AGV_STATE_META: Record<AgvState, { label: string; color: string }> = {
  RUN_IDLE: { label: '运行中-无任务', color: '#22d3ee' },
  RUN_BUSY: { label: '运行中-有任务', color: '#f59e0b' },
  CHARGING: { label: '充电中', color: '#4ade80' },
  ALARM: { label: '报警', color: '#f43f5e' },
  OFF: { label: '关机', color: '#9ca3af' },
}

export interface AgvUnit {
  id: string
  state: AgvState
  x: number
  y: number
  task?: string
  battery: number
}

export function buildFleet(): AgvUnit[] {
  const rand = mulberry32(8842)
  const fleet: AgvUnit[] = []
  for (let i = 1; i <= 22; i++) {
    const r = rand()
    const state: AgvState = r < 0.34 ? 'RUN_IDLE' : r < 0.74 ? 'RUN_BUSY' : r < 0.86 ? 'CHARGING' : r < 0.93 ? 'ALARM' : 'OFF'
    fleet.push({
      id: `AGV-${i}`,
      state,
      x: 6 + rand() * 88,
      y: 20 + rand() * 68,
      task: state === 'RUN_BUSY' ? ['电芯', 'Busbar', '外壳', '线束'][Math.floor(rand() * 4)] : undefined,
      battery: 25 + Math.floor(rand() * 75),
    })
  }
  return fleet
}

/** 前道补料情况：按产线聚合有任务的 AGV */
export function feedingLines(fleet: AgvUnit[]): { line: string; text: string }[] {
  const busy = fleet.filter((a) => a.state === 'RUN_BUSY' && a.task)
  const lines: { line: string; text: string }[] = []
  for (let i = 5; i >= 1; i--) {
    const assigned = busy.filter((_, idx) => idx % 5 === (i - 1) % 5).map((a) => `${a.id}(${a.task})`)
    lines.push({ line: `L${i}`, text: assigned.join('，') })
  }
  return lines
}
