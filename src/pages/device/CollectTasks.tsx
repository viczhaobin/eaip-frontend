import { useEffect, useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { deviceApi } from '@/services/mock'
import { equipmentName } from '@/services/mock/db'
import type { CollectTask } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const TASK_STATUS_META = {
  RUNNING: { label: '运行中', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAUSED: { label: '已暂停', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  STOPPED: { label: '已停止', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
} as const

/** 采集任务（F1.2.2）：三种采集方式、批量读取、队列保护策略 */
export default function CollectTasks() {
  const [list, setList] = useState<CollectTask[]>([])

  const load = () => void deviceApi.listCollectTasks().then(setList)
  useEffect(load, [])

  const setStatus = async (t: CollectTask, status: 'RUNNING' | 'PAUSED' | 'STOPPED') => {
    await deviceApi.setTaskStatus(t.taskId, status)
    toast.success(`任务「${t.name}」已${status === 'RUNNING' ? '启动' : status === 'PAUSED' ? '暂停' : '停止'}`)
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="采集任务"
          description="周期 / 变化 / 业务触发三种采集方式；同设备点位批量读取，单设备故障不拖垮其他设备；队列满时按策略告警，不静默丢数"
        /></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">任务</th>
                <th className="px-5 py-3 font-medium">采集方式</th>
                <th className="px-5 py-3 font-medium">点位数</th>
                <th className="px-5 py-3 font-medium">周期</th>
                <th className="px-5 py-3 font-medium">成功率</th>
                <th className="px-5 py-3 font-medium">队列深度</th>
                <th className="px-5 py-3 font-medium">最近 / 下次执行</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((t) => (
                <tr key={t.taskId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-slate-400">{equipmentName(t.equipmentId)}</div>
                  </td>
                  <td className="px-5 py-3"><Badge variant="outline" className="text-[11px]">{t.mode}</Badge></td>
                  <td className="px-5 py-3 text-xs tabular-nums">{t.tagCount}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{t.intervalMs > 0 ? `${t.intervalMs}ms` : '事件触发'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold tabular-nums ${t.successRate >= 99 ? 'text-emerald-600' : t.successRate >= 95 ? 'text-amber-600' : 'text-red-500'}`}>
                      {t.successRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs tabular-nums ${t.queueDepth > 0 ? 'font-medium text-amber-600' : 'text-slate-400'}`}>{t.queueDepth}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    <div>{t.lastRunAt ?? '—'}</div>
                    {t.nextRunAt && <div className="mt-0.5 text-[11px]">下次 {t.nextRunAt}</div>}
                  </td>
                  <td className="px-5 py-3"><Badge variant="outline" className={TASK_STATUS_META[t.status].badge}>{TASK_STATUS_META[t.status].label}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {t.status !== 'RUNNING' && (
                        <button className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50" title="启动" onClick={() => setStatus(t, 'RUNNING')}>
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {t.status === 'RUNNING' && (
                        <button className="rounded p-1.5 text-amber-600 hover:bg-amber-50" title="暂停" onClick={() => setStatus(t, 'PAUSED')}>
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title="停止" onClick={() => setStatus(t, 'STOPPED')}>
                        <Square className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

        <div className="mt-4 grid gap-3 text-xs leading-relaxed text-slate-500 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">采集周期低于驱动稳定能力时平台应阻止或警告</div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">采集线程与 Web 请求线程隔离；每设备限制最大点位数、并发与队列上限</div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">降级策略：{list[0]?.dropPolicy ?? '队列满记录告警'}</div>
        </div>
      </div>
    </AppLayout>
  )
}
