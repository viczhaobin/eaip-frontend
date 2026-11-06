import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { WORKORDER_STATUS_META } from '@/lib/status'
import { integrationApi } from '@/services/mock'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** 工单管理（F6.2）：MES 工单接收、版本幂等、进度与状态机 */
export default function WorkOrders() {
  const [list, setList] = useState<Awaited<ReturnType<typeof integrationApi.listWorkOrders>>>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  const load = () => {
    void integrationApi.listWorkOrders({ keyword, status: status || undefined }).then(setList)
  }
  useEffect(load, [keyword, status])

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="工单管理"
          description="接收 MES 工单（externalOrderCode + version 幂等）；已开工工单关键字段变更需按客户规则确认；取消不删除生产记录"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索工单号 / 产品…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(WORKORDER_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">工单</th>
                <th className="px-5 py-3 font-medium">产品</th>
                <th className="px-5 py-3 font-medium">数量进度</th>
                <th className="px-5 py-3 font-medium">计划时间</th>
                <th className="px-5 py-3 font-medium">路线 / 配方</th>
                <th className="px-5 py-3 font-medium">来源 / 版本</th>
                <th className="px-5 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((w) => {
                const rate = w.plannedQty > 0 ? Math.round((w.completedQty / w.plannedQty) * 100) : 0
                return (
                  <tr key={w.workOrderId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs font-medium">{w.externalOrderCode}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">接收于 {w.receivedAt}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs">{w.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">{w.productCode} · 优先级 {w.priority}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, rate)}%` }} />
                      </div>
                      <div className="mt-1 text-[11px] tabular-nums text-slate-500">
                        {w.completedQty}/{w.plannedQty}（良 {w.goodQty} / 不良 <span className="text-red-500">{w.defectQty}</span>）
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{w.plannedStart}<div className="mt-0.5 text-slate-400">→ {w.plannedEnd}</div></td>
                    <td className="px-5 py-3 text-xs"><Badge variant="outline" className="mb-1 font-mono text-[11px]">{w.routeCode}</Badge>{w.recipeCode && <div className="font-mono text-[11px] text-slate-400">{w.recipeCode}</div>}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{w.sourceSystem} <span className="text-slate-400">v{w.version}</span></td>
                    <td className="px-5 py-3"><StatusBadge meta={WORKORDER_STATUS_META[w.status]} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
    </AppLayout>
  )
}
