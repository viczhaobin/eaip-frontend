import { useEffect, useState } from 'react'
import { CheckCheck, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { ALARM_LEVEL_META, ALARM_EVENT_STATUS_META } from '@/lib/status'
import { authStore } from '@/stores/authStore'
import { alarmApi } from '@/services/mock'
import type { AlarmEvent, AlarmLevel } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** 实时报警（F5.2）：事件生命周期操作 — 确认 / 取消（填原因）/ 恢复 */
export default function RealtimeAlarms() {
  const [list, setList] = useState<AlarmEvent[]>([])
  const [keyword, setKeyword] = useState('')
  const [level, setLevel] = useState('')
  const [status, setStatus] = useState('')
  const [cancelTarget, setCancelTarget] = useState<AlarmEvent | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const load = () => {
    void alarmApi.listEvents({ keyword, level: level || undefined, status: status || undefined }).then(setList)
  }
  useEffect(load, [keyword, level, status])

  const me = () => authStore.getState().userInfo?.nickName || authStore.getState().userInfo?.login || 'unknown'

  const acknowledge = async (e: AlarmEvent) => {
    try {
      await alarmApi.acknowledgeEvent(e.eventId, me())
      toast.success(`事件 ${e.eventId} 已确认`, { description: '确认人与确认时间已记录' })
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const doCancel = async () => {
    if (!cancelTarget) return
    if (!cancelReason.trim()) {
      toast.error('取消误报必须填写原因')
      return
    }
    await alarmApi.cancelEvent(cancelTarget.eventId, cancelReason, me())
    toast.success('事件已取消', { description: '原因与操作人已保留审计' })
    setCancelTarget(null)
    setCancelReason('')
    load()
  }

  const recover = async (e: AlarmEvent) => {
    try {
      await alarmApi.recoverEvent(e.eventId)
      toast.success(`事件 ${e.eventId} 已标记恢复`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const active = list.filter((e) => ['ACTIVE', 'ACKNOWLEDGED', 'PROCESSING', 'ESCALATED', 'REOPENED'].includes(e.status))

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="实时报警"
          description="事件状态机：发生 → 确认 → 处理中 → 恢复 → 关闭；未恢复的事件不得仅因点击标记为恢复；授权人员强制关闭必须填写原因"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索事件 / 来源 / 报警码…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">全部等级</option>
            {(['L1', 'L2', 'L3', 'L4'] as AlarmLevel[]).map((l) => <option key={l} value={l}>{ALARM_LEVEL_META[l].label}</option>)}
          </select>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(ALARM_EVENT_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-400">活动事件 {active.length} / 共 {list.length}</span>
        </div></StickyPageHead>

        <div className="mt-6 space-y-3">
          {paged.map((e) => (
            <div key={e.eventId} className={`rounded-xl border bg-white p-5 ${['ACTIVE', 'ESCALATED'].includes(e.status) ? 'border-red-200' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge meta={ALARM_LEVEL_META[e.level]} />
                <span className="font-mono text-sm font-semibold">{e.eventId}</span>
                <Badge variant="outline" className="font-mono text-[11px]">{e.alarmCode}</Badge>
                <span className="text-xs text-slate-400">{e.source}{e.equipmentCode ? `（${e.equipmentCode}）` : ''}</span>
                <span className="ml-auto text-xs text-slate-400">发生 {e.occurredAt}{e.occurrenceCount > 1 && ` · 重复 ${e.occurrenceCount} 次`}</span>
                <StatusBadge meta={ALARM_EVENT_STATUS_META[e.status]} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{e.description}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                <span>dedupKey：{e.dedupKey}</span>
                {e.acknowledgedBy && <span>确认人：{e.acknowledgedBy} · {e.acknowledgedAt}</span>}
                {e.recoveredAt && <span>恢复：{e.recoveredAt}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                {['ACTIVE', 'REOPENED', 'ESCALATED'].includes(e.status) && (
                  <Button size="sm" className="h-7 gap-1 bg-indigo-600 text-xs hover:bg-indigo-700" onClick={() => acknowledge(e)}>
                    <CheckCheck className="h-3.5 w-3.5" /> 确认
                  </Button>
                )}
                {['ACKNOWLEDGED', 'PROCESSING'].includes(e.status) && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => recover(e)}>提交恢复</Button>
                )}
                {!['CLOSED', 'CANCELLED'].includes(e.status) && (
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-slate-500" onClick={() => { setCancelTarget(e); setCancelReason('') }}>
                    <XCircle className="h-3.5 w-3.5" /> 取消（误报）
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取消事件 {cancelTarget?.eventId}</DialogTitle>
            <DialogDescription>人工确认误报/取消必须填写原因，原因将保留在审计中</DialogDescription>
          </DialogHeader>
          <Input placeholder="取消原因（必填）" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>返回</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={doCancel}>确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
