import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { AGV_STATUS_META } from '@/lib/status'
import { integrationApi } from '@/services/mock'
import type { AgvTask } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** AGV 接口（F6.7）：站点映射 + 物流任务（幂等创建、状态映射、异常处理） */
export default function AgvInterface() {
  const [tasks, setTasks] = useState<AgvTask[]>([])
  const [mappings, setMappings] = useState<Awaited<ReturnType<typeof integrationApi.listAgvMappings>>>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ businessTaskCode: '', taskType: 'LINE_FEED' as AgvTask['taskType'], fromStation: '', toStation: '', materialCode: '', quantity: '', priority: '中' as AgvTask['priority'] })

  const load = () => {
    void integrationApi.listAgvTasks({ keyword, status: status || undefined }).then(setTasks)
  }
  useEffect(() => {
    load()
    void integrationApi.listAgvMappings().then(setMappings)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load 只依赖 keyword/status
  }, [keyword, status])

  const create = async () => {
    if (!form.businessTaskCode.trim() || !form.fromStation || !form.toStation) {
      toast.error('businessTaskCode、起终点为必填；未映射站点将拒绝创建')
      return
    }
    const mapped = new Set(mappings.filter((m) => m.enabled).map((m) => m.eaipStationCode))
    if (!mapped.has(form.fromStation) || !mapped.has(form.toStation)) {
      toast.error('起终点未映射到 AGV 系统，拒绝创建并返回配置错误')
      return
    }
    const t = await integrationApi.saveAgvTask({
      taskId: '', externalTaskId: undefined, businessTaskCode: form.businessTaskCode.trim(),
      taskType: form.taskType, materialCode: form.materialCode || undefined, quantity: form.quantity ? Number(form.quantity) : undefined,
      fromStation: form.fromStation, toStation: form.toStation, priority: form.priority,
      status: 'CREATED', createdAt: '', updatedAt: '',
    })
    const isDup = tasks.some((x) => x.taskId === t.taskId)
    toast.success(isDup ? 'businessTaskCode 已存在，按幂等返回原任务' : `任务 ${t.taskId} 已创建`, { description: '等待 RCS 返回 externalTaskId 并订阅状态' })
    setCreateOpen(false)
    load()
  }

  const cancelTask = (t: AgvTask) => {
    t.status = 'CANCELLED'
    toast.success(`任务 ${t.taskId} 已取消`, { description: '不擅自重复创建新任务；记录取消原因' })
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(tasks, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="AGV 接口"
          description="任务接驳与状态映射；不负责路径规划/避障/调度优化；调度系统不可用时任务保留待发送并告警"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> 创建物流任务
            </Button>
          }
        /></StickyPageHead>

        {/* 站点映射 */}
        <h2 className="mt-2 text-sm font-semibold">站点映射（{mappings.length}）</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-2.5 font-medium">EAIP 站点</th>
                <th className="px-5 py-2.5 font-medium">AGV 系统</th>
                <th className="px-5 py-2.5 font-medium">外部站点编码</th>
                <th className="px-5 py-2.5 font-medium">类型</th>
                <th className="px-5 py-2.5 font-medium">缓存容量</th>
                <th className="px-5 py-2.5 font-medium">启用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mappings.map((m) => (
                <tr key={m.mappingId}>
                  <td className="px-5 py-2.5 font-mono text-xs">{m.eaipStationCode}</td>
                  <td className="px-5 py-2.5 font-mono text-xs">{m.agvSystemCode}</td>
                  <td className="px-5 py-2.5 font-mono text-xs">{m.externalStationCode}</td>
                  <td className="px-5 py-2.5"><Badge variant="outline" className="text-[11px]">{m.stationType}</Badge></td>
                  <td className="px-5 py-2.5 text-xs tabular-nums">{m.bufferCapacity ?? '—'}</td>
                  <td className="px-5 py-2.5 text-xs">{m.enabled ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 任务列表 */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold">物流任务</h2>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索任务号 / 业务任务码…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(AGV_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {paged.map((t) => (
            <div key={t.taskId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-semibold">{t.taskId}</span>
                {t.externalTaskId && <Badge variant="outline" className="font-mono text-[11px]">外部 {t.externalTaskId}</Badge>}
                <Badge variant="outline" className="text-[11px]">{t.taskType}</Badge>
                <span className="text-xs text-slate-400">业务码 {t.businessTaskCode}</span>
                <span className="ml-auto text-xs text-slate-400">{t.createdAt}</span>
                <StatusBadge meta={AGV_STATUS_META[t.status]} />
                {!['COMPLETED', 'CANCELLED'].includes(t.status) && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => cancelTask(t)}>取消</Button>
                )}
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
                <div>{t.fromStation} → {t.toStation}</div>
                <div>{t.materialCode ? `${t.materialCode}${t.lotNo ? `（${t.lotNo}）` : ''} × ${t.quantity ?? '-'}` : t.containerCode ?? '—'}</div>
                <div>优先级 {t.priority}{t.requiredTime ? ` · 要求 ${t.requiredTime}` : ''}</div>
                <div>{t.relatedWorkOrder ? `关联工单 ${t.relatedWorkOrder}` : ''}</div>
              </div>
              {t.lastError && <p className="mt-2 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-700">{t.lastError}</p>}
            </div>
          ))}
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建物流任务</DialogTitle>
            <DialogDescription>相同 businessTaskCode 重复请求返回原任务；未映射站点拒绝创建</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="text-xs text-slate-500">业务任务码 businessTaskCode <span className="text-red-500">*</span></div>
              <Input className="mt-1.5 font-mono" value={form.businessTaskCode} onChange={(e) => setForm({ ...form, businessTaskCode: e.target.value })} placeholder="BT-20261106-006" />
            </div>
            <div>
              <div className="text-xs text-slate-500">任务类型</div>
              <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value as AgvTask['taskType'] })}>
                {['LINE_FEED', 'EMPTY_RETURN', 'TRANSFER'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-500">优先级</div>
              <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as AgvTask['priority'] })}>
                {['高', '中', '低'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-500">起点站点 <span className="text-red-500">*</span></div>
              <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={form.fromStation} onChange={(e) => setForm({ ...form, fromStation: e.target.value })}>
                <option value="">选择…</option>
                {mappings.filter((m) => m.enabled).map((m) => <option key={m.mappingId} value={m.eaipStationCode}>{m.eaipStationCode}（{m.stationType}）</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-500">终点站点 <span className="text-red-500">*</span></div>
              <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={form.toStation} onChange={(e) => setForm({ ...form, toStation: e.target.value })}>
                <option value="">选择…</option>
                {mappings.filter((m) => m.enabled).map((m) => <option key={m.mappingId} value={m.eaipStationCode}>{m.eaipStationCode}（{m.stationType}）</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-500">物料编码</div>
              <Input className="mt-1.5 font-mono" value={form.materialCode} onChange={(e) => setForm({ ...form, materialCode: e.target.value })} />
            </div>
            <div>
              <div className="text-xs text-slate-500">数量</div>
              <Input className="mt-1.5" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={create}>创建并调用 RCS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
