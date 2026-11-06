import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { interfaceApi } from '@/services/mock'
import type { RouteRule } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 路由规则（F2.6）：按消息类型/条件选择目标，发布前可模拟测试 */
export default function Routes() {
  const [list, setList] = useState<RouteRule[]>([])
  const [testingId, setTestingId] = useState<string | null>(null)

  const load = () => void interfaceApi.listRouteRules().then(setList)
  useEffect(load, [])

  const test = async (r: RouteRule) => {
    setTestingId(r.ruleId)
    try {
      await interfaceApi.testRouteRule(r.ruleId)
      toast.success(`规则「${r.name}」模拟测试完成`)
      load()
    } finally {
      setTestingId(null)
    }
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="路由规则"
          description="按消息类型、设备、产线、工序、字段值选择目标；支持一对一/一对多、过滤、聚合、拆分；发布前执行模拟测试"
        /></StickyPageHead>

        <div className="mt-6 space-y-4">
          {list.map((r) => (
            <div key={r.ruleId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{r.name}</span>
                  <Badge variant="outline" className="font-mono text-[11px]">{r.ruleCode}</Badge>
                  <Badge variant="outline" className="text-[11px]">{r.messageType}</Badge>
                  <Badge variant="outline" className={r.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}>
                    {r.enabled ? '启用' : '停用'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={testingId === r.ruleId} onClick={() => test(r)}>
                  <FlaskConical className={`h-3.5 w-3.5 ${testingId === r.ruleId ? 'animate-pulse' : ''}`} />
                  模拟测试
                </Button>
              </div>

              <div className="mt-3">
                <code className="block rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300">{r.condition}</code>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">目标：</span>
                {r.targets.map((t) => (
                  <Badge key={t} variant="outline" className="text-[11px] text-slate-600">{t}</Badge>
                ))}
              </div>

              {r.lastTestResult && (
                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-500">
                  最近测试（{r.lastTestAt}）：{r.lastTestResult}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
