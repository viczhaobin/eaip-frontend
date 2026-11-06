import { useEffect, useState } from 'react'
import { RotateCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { MESSAGE_STATUS_META } from '@/lib/status'
import { interfaceApi } from '@/services/mock'
import type { IntegrationMessage, MessageStatus } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** 消息监控（F2.6）：全链路消息状态、重试、人工重发 */
export default function Messages() {
  const [list, setList] = useState<IntegrationMessage[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  const load = () => {
    void interfaceApi.listMessages({ keyword, status: status || undefined }).then(setList)
  }
  useEffect(load, [keyword, status])

  const resend = async (m: IntegrationMessage) => {
    await interfaceApi.resendMessage(m.messageId)
    toast.success(`消息 ${m.messageId} 已重新入队`, { description: '人工重发前请确认目标系统幂等性，避免重复业务记录' })
    load()
  }

  const counts = (['SUCCESS', 'RETRYING', 'FAILED', 'DEAD_LETTER'] as MessageStatus[]).map((s) => ({
    status: s,
    count: list.filter((m) => m.status === s).length,
  }))

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="消息监控"
          description="每条消息具备全局唯一 messageId 与 businessKey；失败按策略重试，超限转死信队列并触发告警"
        />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {counts.map((c) => (
            <button key={c.status} onClick={() => setStatus(status === c.status ? '' : c.status)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${status === c.status ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <StatusBadge meta={MESSAGE_STATUS_META[c.status]} className="mr-1.5 border-0 bg-transparent p-0" />
              <span className="font-semibold tabular-nums">{c.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索 messageId / businessKey…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">messageId</th>
                <th className="px-5 py-3 font-medium">接口 / 业务键</th>
                <th className="px-5 py-3 font-medium">方向</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">重试</th>
                <th className="px-5 py-3 font-medium">创建 / 更新</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((m) => (
                <tr key={m.messageId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.messageId}</td>
                  <td className="px-5 py-3">
                    <div className="text-xs font-medium">{m.interfaceCode}</div>
                    <div className="mt-0.5 max-w-64 truncate font-mono text-[11px] text-slate-400" title={m.businessKey}>{m.businessKey}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{m.direction}</td>
                  <td className="px-5 py-3">
                    <StatusBadge meta={MESSAGE_STATUS_META[m.status]} />
                    {m.lastError && <div className="mt-1 max-w-48 truncate text-[11px] text-red-500" title={m.lastError}>{m.lastError}</div>}
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{m.retryCount}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    <div>{m.createdAt}</div>
                    <div className="mt-0.5 text-[11px]">{m.updatedAt}</div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {['FAILED', 'DEAD_LETTER', 'RETRYING'].includes(m.status) && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => resend(m)}>
                        <RotateCw className="h-3.5 w-3.5" /> 重发
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
    </AppLayout>
  )
}
