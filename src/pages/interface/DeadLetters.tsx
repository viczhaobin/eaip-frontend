import { useEffect, useState } from 'react'
import { RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { MESSAGE_STATUS_META } from '@/lib/status'
import { interfaceApi } from '@/services/mock'
import type { IntegrationMessage } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 死信队列（F2.6）：超限消息人工处理，重发前展示重复风险 */
export default function DeadLetters() {
  const [list, setList] = useState<IntegrationMessage[]>([])

  const load = () => {
    void interfaceApi.listMessages({ status: 'DEAD_LETTER' }).then(setList)
  }
  useEffect(load, [])

  const resend = async (m: IntegrationMessage) => {
    await interfaceApi.resendMessage(m.messageId)
    toast.success('已重新入队', { description: '非幂等控制命令不会自动重试；人工重发已记录审计' })
    load()
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="死信队列"
          description="超过最大重试次数转入死信的消息；人工重发前展示原请求、失败原因和可能重复风险"
        /></StickyPageHead>

        {list.length === 0 ? (
          <EmptyState icon={RotateCw} title="死信队列为空" description="消息超过最大重试次数后会转入此处并触发告警" />
        ) : (
          <div className="mt-6 space-y-4">
            {list.map((m) => (
              <div key={m.messageId} className="rounded-xl border border-red-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{m.messageId}</span>
                    <StatusBadge meta={MESSAGE_STATUS_META.DEAD_LETTER} />
                  </div>
                  <Button size="sm" className="h-7 gap-1 bg-indigo-600 text-xs hover:bg-indigo-700" onClick={() => resend(m)}>
                    <RotateCw className="h-3.5 w-3.5" /> 人工重发
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 text-xs md:grid-cols-3">
                  <div>
                    <div className="text-slate-400">接口 / 方向</div>
                    <div className="mt-0.5 font-mono">{m.interfaceCode} · {m.direction}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">业务键</div>
                    <div className="mt-0.5 font-mono">{m.businessKey}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">已重试 / 最近更新</div>
                    <div className="mt-0.5">{m.retryCount} 次 · {m.updatedAt}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400">失败原因</div>
                  <p className="mt-1 rounded-lg bg-red-50/70 px-3 py-2 text-xs text-red-700">{m.lastError}</p>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400">原始报文摘要</div>
                  <code className="mt-1 block overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300">{m.payloadSummary}</code>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-amber-600">
                  重复风险提示：若目标系统不支持幂等键，重发可能产生重复业务记录；EAIP 将维护发送结果台账供核对。
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
