import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { ALARM_LEVEL_META } from '@/lib/status'
import { alarmApi } from '@/services/mock'
import { equipmentName, stationName, lineName } from '@/services/mock/db'
import type { Ticket } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const TICKET_STATUS_META: Record<Ticket['status'], { label: string; badge: string }> = {
  '待确认': { label: '待确认', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  '处理中': { label: '处理中', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  '待关闭': { label: '待关闭', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  '已关闭': { label: '已关闭', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
  '已重开': { label: '已重开', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
}

/** 异常处理（F5.5）：工单确认/处理/恢复/关闭闭环 + 时间轴 */
export default function Tickets() {
  const [list, setList] = useState<Ticket[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState<Ticket | null>(null)

  const load = () => {
    void alarmApi.listTickets({ keyword, status: status || undefined }).then(setList)
  }
  useEffect(load, [keyword, status])

  const advance = async (t: Ticket, action: string) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const updated: Ticket = { ...t }
    if (action === 'start') {
      updated.status = '处理中'
      updated.startedAt = now
    } else if (action === 'recover') {
      updated.status = '待关闭'
      updated.recoveredAt = now
    } else if (action === 'close') {
      updated.status = '已关闭'
      updated.closedAt = now
    } else if (action === 'reopen') {
      updated.status = '已重开'
    }
    updated.timeline = [...t.timeline, { at: now, actor: '当前用户', action }]
    await alarmApi.saveTicket(updated)
    toast.success(`处理单 ${t.ticketId} 已更新为「${TICKET_STATUS_META[updated.status].label}」`)
    setDetail(updated)
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="异常处理"
          description="处理单自动/人工创建、指派转派认领、原因与措施填写、超时提醒升级、重新打开与处理时间轴"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索单号 / 标题…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(TICKET_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 space-y-3">
          {paged.map((t) => (
            <div key={t.ticketId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={ALARM_LEVEL_META[t.level].badge}>{ALARM_LEVEL_META[t.level].label}</Badge>
                <span className="font-mono text-sm">{t.ticketId}</span>
                <span className="text-sm font-medium">{t.title}</span>
                <Badge variant="outline" className="text-[11px] text-slate-500">{t.category}</Badge>
                <Badge variant="outline" className={TICKET_STATUS_META[t.status].badge}>{TICKET_STATUS_META[t.status].label}</Badge>
                <span className="ml-auto text-xs text-slate-400">
                  负责人 {t.ownerId ?? '未指派'}（{t.teamId ?? '-'}）{t.dueAt ? ` · 截止 ${t.dueAt}` : ''}
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDetail(t)}>处理</Button>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {t.lineId && `${lineName(t.lineId)} / `}{t.stationId && `${stationName(t.stationId)} / `}{t.equipmentId && equipmentName(t.equipmentId)}
                {t.causeDescription && <span className="ml-3 text-slate-400">原因：{t.causeDescription}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

      {/* 处理详情 + 时间轴 */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.ticketId} · {detail?.title}</DialogTitle>
            <DialogDescription>处理记录时间轴；允许授权人员重新打开</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">原因代码：</span>{detail.causeCode ?? '待填写'}</div>
                <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">措施：</span>{detail.actionDescription ?? '待填写'}</div>
                <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">确认：</span>{detail.acknowledgedAt ?? '—'}</div>
                <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">恢复/关闭：</span>{detail.recoveredAt ?? '—'} / {detail.closedAt ?? '—'}</div>
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-slate-500">处理时间轴</div>
                <div className="space-y-3">
                  {detail.timeline.map((t, i) => (
                    <div key={i} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`mt-1 h-2 w-2 rounded-full ${i === detail.timeline.length - 1 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        {i < detail.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                      </div>
                      <div className="pb-1">
                        <div className="text-[11px] text-slate-400">{t.at} · {t.actor}</div>
                        <div className="mt-0.5 text-sm">{t.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {detail.status === '待确认' && <Button size="sm" className="bg-indigo-600 text-xs hover:bg-indigo-700" onClick={() => advance(detail, 'start')}>开始处理</Button>}
                {detail.status === '处理中' && <Button size="sm" className="bg-emerald-600 text-xs hover:bg-emerald-700" onClick={() => advance(detail, 'recover')}>提交恢复</Button>}
                {detail.status === '待关闭' && <Button size="sm" className="bg-slate-700 text-xs hover:bg-slate-800" onClick={() => advance(detail, 'close')}>关闭</Button>}
                {['已关闭', '待关闭'].includes(detail.status) && <Button size="sm" variant="outline" className="text-xs" onClick={() => advance(detail, 'reopen')}>重新打开</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
