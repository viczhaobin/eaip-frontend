import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { ALARM_LEVEL_META } from '@/lib/status'
import { alarmApi } from '@/services/mock'
import type { NotifyPolicy } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const SEND_META = {
  SENT: { label: '已发送', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: '失败', badge: 'bg-red-50 text-red-700 border-red-200' },
  RETRYING: { label: '重试中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  EXPIRED: { label: '已过期', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
} as const

/** 通知策略（F5.4）：渠道、接收规则、静默时段、重试与升级 */
export default function Policies() {
  const [list, setList] = useState<NotifyPolicy[]>([])

  useEffect(() => {
    void alarmApi.listPolicies().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="通知策略"
          description="通知渠道：HMI 弹窗 / 声光 Andon / 企业微信 / 钉钉 / 邮件 / 短信 / MES 事件；第三方失败不导致事件丢失"
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <div key={p.policyId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={ALARM_LEVEL_META[p.eventLevel].badge}>{ALARM_LEVEL_META[p.eventLevel].label}</Badge>
                  <span className="font-medium">{p.channel}</span>
                </div>
                <Badge variant="outline" className={p.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}>
                  {p.enabled ? '启用' : '停用'}
                </Badge>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div>接收规则：<span className="text-slate-700">{p.receiverRule}</span></div>
                <div>模板：<span className="font-mono">{p.templateCode}</span> · 静默时段：{p.quietHours ?? '无'}</div>
                <div>重试：每 {p.retryIntervalSec}s · 最多 {p.maxRetry} 次</div>
                {p.escalationAfterSec != null && (
                  <div className="text-amber-600">{Math.round(p.escalationAfterSec / 60)} 分钟未响应升级至：{p.escalationReceiver}</div>
                )}
              </div>

              {p.lastSendStatus && (
                <div className="mt-3 border-t border-slate-50 pt-3">
                  <Badge variant="outline" className={SEND_META[p.lastSendStatus].badge}>最近发送：{SEND_META[p.lastSendStatus].label}</Badge>
                  <p className="mt-1 text-[11px] text-slate-400">记录通知请求、渠道返回码和发送时间；同一事件同一接收人按策略去重</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          默认等级模板（可项目配置）：L1 立即响应 / L2 5 分钟 / L3 15 分钟 / L4 按班次；通知内容含事件等级、设备工位、发生时间、摘要与处理入口，不暴露不必要敏感信息。
        </p>
      </div>
    </AppLayout>
  )
}
