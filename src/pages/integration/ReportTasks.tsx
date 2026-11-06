import { useEffect, useState } from 'react'
import { Pause, Play, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { integrationApi } from '@/services/mock'
import type { ReportTask } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const TRIGGER_LABELS: Record<ReportTask['triggerMode'], string> = {
  SCHEDULE: '周期上报', EVENT: '事件上报', BUSINESS: '业务上报',
}

/** 上报任务（F6.8）：触发方式、执行监控、手工补传与暂停恢复 */
export default function ReportTasks() {
  const [list, setList] = useState<ReportTask[]>([])

  const load = () => void integrationApi.listReportTasks().then(setList)
  useEffect(load, [])

  const toggle = (t: ReportTask) => {
    t.enabled = !t.enabled
    toast.success(`上报任务「${t.name}」已${t.enabled ? '恢复' : '暂停'}`)
    load()
  }

  const resend = (t: ReportTask) => {
    toast.success(`任务 ${t.taskCode} 待发送 ${t.pendingCount} 条已触发补传（模拟）`)
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="上报任务"
          description="周期 / 事件 / 业务触发上报；监控最近执行、成功失败数、待发送量与重试次数，支持手工补传与暂停恢复"
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {list.map((t) => (
            <div key={t.taskCode} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{t.name}</span>
                <Badge variant="outline" className="font-mono text-[11px]">{t.taskCode}</Badge>
                <Badge variant="outline" className="text-[11px]">{TRIGGER_LABELS[t.triggerMode]}</Badge>
                <Badge variant="outline" className={t.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}>
                  {t.enabled ? '运行中' : '已暂停'}
                </Badge>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title={t.enabled ? '暂停' : '恢复'} onClick={() => toggle(t)}>
                    {t.enabled ? <Pause className="h-3.5 w-3.5 text-amber-600" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="手工补传" onClick={() => resend(t)}>
                    <RotateCw className="h-3.5 w-3.5 text-indigo-600" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <div>源对象：<span className="font-mono">{t.sourceObject}</span></div>
                <div>目标：<span className="font-mono">{t.targetSystem} / {t.targetInterface}</span></div>
                {t.scheduleExpression && <div>调度：{t.scheduleExpression}</div>}
                {t.filterExpression && <div className="truncate">过滤：<span className="font-mono">{t.filterExpression}</span></div>}
                <div>批量：{t.batchSize} 条 · 重试：{t.retryPolicy}</div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-50 pt-3 text-center text-xs">
                <div>
                  <div className="text-slate-400">成功/失败</div>
                  <div className="mt-0.5 font-semibold tabular-nums">
                    <span className="text-emerald-600">{t.successCount}</span>
                    <span className="mx-0.5 text-slate-300">/</span>
                    <span className={t.failCount > 0 ? 'text-red-500' : ''}>{t.failCount}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">待发送</div>
                  <div className={`mt-0.5 font-semibold tabular-nums ${t.pendingCount > 0 ? 'text-amber-600' : ''}`}>{t.pendingCount}</div>
                </div>
                <div>
                  <div className="text-slate-400">重试中</div>
                  <div className="mt-0.5 font-semibold tabular-nums">{t.retryCount}</div>
                </div>
                <div>
                  <div className="text-slate-400">最近/下次</div>
                  <div className="mt-0.5 font-medium">{t.lastRunAt?.slice(11) ?? '—'}</div>
                  <div className="text-[10px] text-slate-400">{t.nextRunAt?.slice(11) ?? '—'}</div>
                </div>
              </div>

              {t.lastError && (
                <p className="mt-3 rounded-lg bg-red-50/70 px-3 py-2 text-xs text-red-700">最近错误：{t.lastError}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
