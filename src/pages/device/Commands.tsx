import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { COMMAND_STATUS_META, EQUIPMENT_STATUS_META } from '@/lib/status'
import { authStore } from '@/stores/authStore'
import { deviceApi } from '@/services/mock'
import { equipmentName } from '@/services/mock/db'
import type { CommandCode, ControlCommand, Equipment } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const COMMAND_LABELS: Record<CommandCode, string> = {
  START_REQUEST: '启动请求',
  STOP_REQUEST: '停止请求',
  RESET_REQUEST: '复位请求',
  PAUSE_REQUEST: '暂停请求',
  RESUME_REQUEST: '恢复请求',
  RECIPE_SELECT: '配方选择',
  PARAMETER_SET: '参数设置',
}

/** 控制指令（F1.4）：读取设备状态 → 权限/模式/白名单校验 → 二次确认 → 下发 */
export default function Commands() {
  const [list, setList] = useState<ControlCommand[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [issueOpen, setIssueOpen] = useState(false)
  const [target, setTarget] = useState<Equipment | null>(null)
  const [commandCode, setCommandCode] = useState<CommandCode>('START_REQUEST')
  const [paramValue, setParamValue] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [onlineOnly, setOnlineOnly] = useState<Equipment[]>([])

  const load = () => {
    void deviceApi.listCommands({ keyword, status: status || undefined }).then(setList)
  }
  useEffect(() => {
    load()
    void deviceApi.listEquipments().then((es) => setOnlineOnly(es.filter((e) => e.enabled)))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load 只依赖 keyword/status
  }, [keyword, status])

  // 步骤 2：平台读取设备实时状态及控制模式（选择设备时即评估）
  const targetBlockReason = (e: Equipment | null): string | null => {
    if (!e) return null
    if (!e.enabled) return '设备未启用'
    if (['FAULT', 'OFFLINE'].includes(e.status)) return `设备处于 ${e.status} 状态，不允许远程操作`
    if (e.controlMode !== '自动') return `设备处于${e.controlMode}模式，远程操作被阻止`
    return null
  }

  const blockReason = targetBlockReason(target)

  const openIssue = () => {
    setTarget(null)
    setCommandCode('START_REQUEST')
    setParamValue('')
    setIssueOpen(true)
  }

  const doIssue = async () => {
    if (!target) return
    setIssuing(true)
    try {
      const cmd = await deviceApi.issueCommand({
        equipmentId: target.equipmentId,
        commandCode,
        parameters: commandCode === 'PARAMETER_SET' || commandCode === 'RECIPE_SELECT' ? { value: paramValue } : {},
        issuedBy: authStore.getState().userInfo?.nickName || authStore.getState().userInfo?.login || 'unknown',
        expiresAt: new Date(Date.now() + 5 * 60000).toISOString().slice(0, 19).replace('T', ' '),
      })
      toast.success(`指令 ${cmd.commandId} 已下发并进入审计日志`, { description: 'PLC 按自身联锁判断是否执行，超时不会自动重发' })
      setConfirmOpen(false)
      setIssueOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '下发失败')
    } finally {
      setIssuing(false)
    }
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="控制指令"
          description="业务级指令下发：角色授权 → 设备模式/白名单/参数范围校验 → 二次确认 → 下发与结果跟踪。超时不自动重发非幂等指令"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openIssue}>
              <Plus className="mr-1.5 h-4 w-4" /> 下发指令
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索 commandId / 指令…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(COMMAND_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">commandId</th>
                <th className="px-5 py-3 font-medium">设备 / 指令</th>
                <th className="px-5 py-3 font-medium">参数</th>
                <th className="px-5 py-3 font-medium">下发人 / 时间</th>
                <th className="px-5 py-3 font-medium">有效期至</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((c) => (
                <tr key={c.commandId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{c.commandId}</td>
                  <td className="px-5 py-3">
                    <div className="text-xs">{equipmentName(c.equipmentId)}</div>
                    <div className="mt-0.5 font-medium">{COMMAND_LABELS[c.commandCode]} <span className="font-mono text-[11px] text-slate-400">{c.commandCode}</span></div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {Object.keys(c.parameters).length ? JSON.stringify(c.parameters) : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{c.issuedBy}<div className="mt-0.5 text-slate-400">{c.issuedAt}</div></td>
                  <td className="px-5 py-3 text-xs text-slate-400">{c.expiresAt}</td>
                  <td className="px-5 py-3"><StatusBadge meta={COMMAND_STATUS_META[c.status]} /></td>
                  <td className="max-w-56 px-5 py-3 text-xs text-slate-500">{c.resultMessage ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

      {/* 步骤 1-3：选择设备 + 指令 + 校验 */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>下发控制指令</DialogTitle>
            <DialogDescription>平台将读取设备实时状态与控制模式，校验角色、白名单与参数范围</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500">目标设备 <span className="text-red-500">*</span></div>
              <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={target?.equipmentId ?? ''}
                onChange={(e) => setTarget(onlineOnly.find((x) => x.equipmentId === e.target.value) ?? null)}>
                <option value="">选择设备…</option>
                {onlineOnly.map((e) => (
                  <option key={e.equipmentId} value={e.equipmentId}>
                    {e.equipmentName}（{e.equipmentCode} · {e.status === 'ONLINE' ? '在线' : e.status === 'DEGRADED' ? '降级' : e.status} · {e.controlMode}）
                  </option>
                ))}
              </select>
              {target && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <StatusBadge meta={EQUIPMENT_STATUS_META[target.status]} />
                  <span className="text-slate-500">控制模式：{target.controlMode}</span>
                </div>
              )}
              {blockReason && <p className="mt-1.5 text-xs text-red-500">{blockReason}</p>}
            </div>
            <div>
              <div className="text-xs text-slate-500">指令类型 <span className="text-red-500">*</span></div>
              <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={commandCode}
                onChange={(e) => { setCommandCode(e.target.value as CommandCode); setParamValue('') }}>
                {Object.entries(COMMAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}（{k}）</option>)}
              </select>
            </div>
            {(commandCode === 'PARAMETER_SET' || commandCode === 'RECIPE_SELECT') && (
              <div>
                <div className="text-xs text-slate-500">{commandCode === 'RECIPE_SELECT' ? '配方编号/版本' : '参数值'} <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={paramValue} onChange={(e) => setParamValue(e.target.value)}
                  placeholder={commandCode === 'RECIPE_SELECT' ? 'RC001/V3' : '例如 380'} />
                <p className="mt-1 text-[11px] text-slate-400">指令有效期 5 分钟；重复 commandId 不会重复执行</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={!target || !!blockReason} onClick={() => setConfirmOpen(true)}>
              下一步：二次确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 步骤 4：高风险操作确认页（展示目标设备、操作内容、当前状态、影响提示） */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认下发</DialogTitle>
            <DialogDescription>请核对以下信息，确认后生成 commandId 并写入审计日志</DialogDescription>
          </DialogHeader>
          {target && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm">
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div><span className="text-slate-400">目标设备：</span>{equipmentName(target.equipmentId)}</div>
                <div><span className="text-slate-400">当前状态：</span>{EQUIPMENT_STATUS_META[target.status].label} / {target.controlMode}模式</div>
                <div><span className="text-slate-400">操作内容：</span>{COMMAND_LABELS[commandCode]}</div>
                <div><span className="text-slate-400">参数：</span>{paramValue || '无'}</div>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                影响提示：PLC 将按自身联锁和控制逻辑判断是否执行；执行结果以 RECEIVED / EXECUTING / SUCCEEDED / FAILED 回报，
                超时标记 TIMEOUT 且不自动重发；断网时控制指令默认拒绝，不进入无限期补发队列。
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>返回修改</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={doIssue} disabled={issuing}>
              {issuing ? '下发中…' : '确认下发'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
