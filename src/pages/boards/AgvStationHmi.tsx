import { useEffect, useRef, useState } from 'react'
import { fmtTime } from '@/components/board/clock'

type Scene = 'run' | 'calling' | 'handover' | 'alarm'

const LAMP: Record<Scene, { color: string; text: string; flash?: boolean }> = {
  run: { color: '#22c55e', text: '运行' },
  calling: { color: '#f59e0b', text: '叫料中' },
  handover: { color: '#3b82f6', text: '接驳中' },
  alarm: { color: '#e11d48', text: '异常待处理', flash: true },
}

interface Material {
  code: string
  name: string
  stock: number
  capacity: number
  lowAt: number
}

const INITIAL_MATERIALS: Material[] = [
  { code: 'M-CELL-96', name: '电芯', stock: 12, capacity: 24, lowAt: 8 },
  { code: 'M-BUSBAR', name: 'Busbar', stock: 5, capacity: 12, lowAt: 4 },
  { code: 'M-HOUSING', name: '外壳', stock: 9, capacity: 16, lowAt: 5 },
  { code: 'M-HARNESS', name: '线束', stock: 3, capacity: 10, lowAt: 4 },
]

/** 物料 AGV 调度工位 HMI（基于 linkline preview/hmi.html 风格实现，浅色工位终端） */
export default function AgvStationHmi() {
  const [now, setNow] = useState(() => new Date())
  const [scene, setScene] = useState<Scene>('run')
  const [sn, setSn] = useState('VT76A2506120341')
  const [cycle, setCycle] = useState(37)
  const [materials, setMaterials] = useState(INITIAL_MATERIALS)
  const [callingMat, setCallingMat] = useState<string | null>(null)
  const [eta, setEta] = useState(120)
  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null)
  const [forceOpen, setForceOpen] = useState(false)
  const [forceForm, setForceForm] = useState({ user: '', reason: '', note: '' })
  const flashTimer = useRef<number | null>(null)
  const snSeq = useRef(341)

  const lamp = LAMP[scene]
  const flowTimers = useRef<number[]>([])

  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(new Date())
      if (scene === 'run') setCycle((c) => Math.min(c + 1, 59))
      if (scene === 'calling' || scene === 'handover') setEta((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [scene])

  useEffect(() => () => {
    flowTimers.current.forEach((t) => window.clearTimeout(t))
  }, [])

  const showFlash = (text: string, ok = true) => {
    setFlash({ text, ok })
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 2200)
  }

  // 叫料 → AGV 到站 → 接驳入库（定时器阶段推进，演示节奏 10s/6s）
  const callAgv = (m: Material) => {
    setCallingMat(m.name)
    setScene('calling')
    setEta(10)
    showFlash(`已呼叫 AGV 送料：${m.name}（业务任务码幂等防重）`)
    flowTimers.current.push(
      window.setTimeout(() => {
        setScene('handover')
        setEta(6)
        showFlash('AGV 已到站，接驳中…')
        flowTimers.current.push(
          window.setTimeout(() => {
            setScene('run')
            setMaterials((prev) => prev.map((x) => (x.name === m.name ? { ...x, stock: x.capacity } : x)))
            showFlash(`${m.name} 补料完成，库位已更新`)
            setCallingMat(null)
          }, 6000),
        )
      }, 10000),
    )
  }

  const confirmPass = () => {
    showFlash('✓ 过站成功 · 已生成过站记录并上报')
    snSeq.current += 7
    setSn(`VT76A2506${String(120000 + snSeq.current)}`)
    setCycle(0)
  }

  const doForcePass = () => {
    if (!forceForm.user || !forceForm.reason) {
      showFlash('✕ 校验失败：工号与放行原因必填', false)
      return
    }
    setForceOpen(false)
    showFlash(`已强制放行 · 工号 ${forceForm.user} 已留痕并同步审计日志`)
    setForceForm({ user: '', reason: '', note: '' })
  }

  return (
    <div className="flex h-screen select-none flex-col bg-slate-100 text-slate-900">
      {/* 顶栏 */}
      <div className="flex h-24 flex-none items-center gap-8 border-b-2 border-slate-300 bg-white px-6">
        <div>
          <div className="text-2xl font-semibold">物料 AGV 调度工位 · 上料工位</div>
          <div className="text-sm text-slate-500">总装一线 WS010 · 线边 HMI（F1.5）</div>
        </div>
        <div className="text-base text-slate-700">
          当前产品<br />
          <b className="text-xl">电池包 A 型（P001）</b>
        </div>
        <div className="text-base text-slate-700">
          当前工单<br />
          <b className="num text-xl">WO20261106001</b>
        </div>
        <div className="text-base text-slate-700">
          当前 SN<br />
          <b className="num text-xl">{sn}</b>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div
            className={`h-14 w-14 rounded-full border-[3px] border-black/10 ${lamp.flash ? 'animate-pulse' : ''}`}
            style={{ background: lamp.color, boxShadow: `0 0 18px ${lamp.color}`, color: lamp.color }}
          />
          <div className="text-xl font-bold" style={{ color: lamp.color }}>{lamp.text}</div>
        </div>
        <div className="text-right">
          <div className="num text-3xl font-bold">{fmtTime(now)}</div>
          <div className="text-xs text-slate-500">{now.toLocaleDateString('zh-CN')} · 白班</div>
        </div>
      </div>

      {/* 主任务区 */}
      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* 线边库存 */}
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-3 text-sm font-bold tracking-widest text-slate-500">线边库存 · 低于安全水位自动标黄，可一键叫料</div>
          <div className="grid grid-cols-4 gap-5">
            {materials.map((m) => {
              const low = m.stock <= m.lowAt
              const pct = Math.round((m.stock / m.capacity) * 100)
              return (
                <div key={m.code} className={`rounded-lg border-2 p-4 ${low ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold">{m.name}</span>
                    <span className="num text-sm text-slate-400">{m.code}</span>
                  </div>
                  <div className="num mt-2 text-3xl font-bold">
                    {m.stock}<span className="text-base font-normal text-slate-400"> / {m.capacity}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${low ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {low && <div className="mt-2 text-xs font-semibold text-amber-600">低于安全水位 {m.lowAt} · 请叫料</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* AGV 任务状态 + 过站确认 */}
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 text-sm font-bold tracking-widest text-slate-500">当前 AGV 任务</div>
            {scene === 'calling' || scene === 'handover' ? (
              <div className="space-y-3 text-base">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-blue-50 px-3 py-1 font-semibold text-blue-700 border border-blue-300">
                    {scene === 'calling' ? 'AGV 赶往线边' : 'AGV 已就位'}
                  </span>
                  <span className="text-slate-500">物料：{callingMat}</span>
                </div>
                <div className="num text-5xl font-bold text-blue-600">
                  {String(Math.floor(eta / 60)).padStart(2, '0')}:{String(eta % 60).padStart(2, '0')}
                  <span className="ml-2 text-base font-normal text-slate-400">预计剩余</span>
                </div>
                <div className="text-sm text-slate-500">
                  路径：M1 中转库 ST01-BUF01 → 本工位（WS010）· 状态由 RCS 订阅推送，超时生成物流异常
                </div>
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center text-slate-400">暂无 AGV 任务 · 可在下方发起缺料呼叫</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 text-sm font-bold tracking-widest text-slate-500">过站确认 · 请核对扫描结果</div>
            <div className="num text-4xl font-bold tracking-wide">{sn}</div>
            <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3 text-sm">
              <div>
                <div className="text-slate-400">产品型号</div>
                <div className="mt-1 text-lg font-semibold">P001 电池包 A 型</div>
              </div>
              <div>
                <div className="text-slate-400">工单</div>
                <div className="num mt-1 text-lg font-semibold">WO20261106001</div>
              </div>
              <div>
                <div className="text-slate-400">进站校验</div>
                <div className="mt-1 text-lg font-semibold text-emerald-600">✓ 通过（PASS）</div>
              </div>
              <div>
                <div className="text-slate-400">本工位节拍</div>
                <div className="num mt-1 text-lg font-semibold">{cycle}s <span className="text-sm font-normal text-slate-400">/ 上限 60s</span></div>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              ✓ 本地判定模式 · 判定日志已留存（ReleaseDecision）
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏（大按钮 64px，危险居左、主操作居右） */}
      <div className="flex h-[104px] flex-none items-center gap-4 border-t-2 border-slate-300 bg-white px-6">
        <button
          className="flex h-16 items-center gap-2 rounded-xl border-2 border-rose-500 bg-white px-7 text-xl font-semibold text-rose-600 active:scale-[.97]"
          onClick={() => setForceOpen(true)}
        >
          <span className="rounded border border-current px-1 text-xs">班组长</span>强制放行
        </button>
        <button className="h-16 min-w-[140px] rounded-xl border-2 border-slate-300 text-xl font-semibold text-slate-600 active:scale-[.97]"
          onClick={() => showFlash('不良申报已登记，经接口上报 MES')}>
          不良申报
        </button>
        <button className="h-16 min-w-[140px] rounded-xl border-2 border-slate-300 text-xl font-semibold text-slate-600 active:scale-[.97]"
          onClick={() => showFlash('已转人工处理登记（留痕）')}>
          人工处理
        </button>
        <div className="flex-1" />
        {materials.map((m) => (
          <button
            key={m.code}
            disabled={scene !== 'run'}
            className="h-16 min-w-[150px] rounded-xl border-2 border-amber-400 bg-amber-50 text-xl font-semibold text-amber-700 active:scale-[.97] disabled:opacity-40"
            onClick={() => callAgv(m)}
          >
            {m.name}呼叫
          </button>
        ))}
        <button
          className="h-16 min-w-[240px] rounded-xl bg-blue-600 text-2xl font-semibold text-white active:scale-[.97]"
          onClick={confirmPass}
        >
          ✓ 确认过站
        </button>
      </div>

      {/* 操作反馈 */}
      {flash && (
        <div
          className={`fixed left-1/2 top-28 z-50 -translate-x-1/2 rounded-xl px-10 py-4 text-2xl font-bold text-white shadow-xl ${
            flash.ok ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {flash.text}
        </div>
      )}

      {/* 强制放行模态（全屏模态，HMI 禁用抽屉） */}
      {forceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55">
          <div className="w-[640px] rounded-2xl bg-white p-8">
            <h3 className="mb-2 text-2xl font-semibold text-rose-600">⚠ 强制放行确认</h3>
            <div className="my-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-base text-rose-700">
              强制放行将跳过进站校验与放行判定，<b>该操作将记录到您的工号</b>并同步至审计日志，同时上报 MES。请确认风险已人工排除。
            </div>
            <label className="mb-2 block text-base font-semibold">班组长工号（权限校验）</label>
            <input
              className="h-14 w-full rounded-lg border-2 border-slate-300 px-3 text-xl"
              value={forceForm.user}
              onChange={(e) => setForceForm({ ...forceForm, user: e.target.value })}
              placeholder="如：B10027"
            />
            <label className="mb-2 mt-4 block text-base font-semibold">放行原因（必选）</label>
            <select
              className="h-14 w-full rounded-lg border-2 border-slate-300 px-3 text-xl"
              value={forceForm.reason}
              onChange={(e) => setForceForm({ ...forceForm, reason: e.target.value })}
            >
              <option value="">请选择</option>
              <option>扫码故障转人工</option>
              <option>混板/错板已人工排除</option>
              <option>返修件回流重新校验</option>
              <option>其他（在下方说明）</option>
            </select>
            <label className="mb-2 mt-4 block text-base font-semibold">补充说明</label>
            <textarea
              className="min-h-[90px] w-full rounded-lg border-2 border-slate-300 p-3 text-lg"
              value={forceForm.note}
              onChange={(e) => setForceForm({ ...forceForm, note: e.target.value })}
              placeholder="必填，说明现场情况"
            />
            <div className="mt-7 flex justify-end gap-4">
              <button className="h-14 min-w-[140px] rounded-xl border-2 border-slate-300 text-xl font-semibold" onClick={() => setForceOpen(false)}>
                取消
              </button>
              <button className="h-14 min-w-[180px] rounded-xl bg-rose-600 text-xl font-semibold text-white" onClick={doForcePass}>
                确认强制放行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
