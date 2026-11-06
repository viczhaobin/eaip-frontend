import { useEffect, useState } from 'react'
import { RotateCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { REPORT_STATUS_META } from '@/lib/status'
import { dataApi } from '@/services/mock'
import type { ProductionRecord } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 生产上报（F6.4/F6.8 视角）：完工事件上报 MES 的待补传与人工补传 */
export default function ProductionReport() {
  const [list, setList] = useState<ProductionRecord[]>([])
  const [keyword, setKeyword] = useState('')

  const load = () => {
    void dataApi.listProductionRecords({ keyword }).then((rs) => setList(rs.filter((r) => r.operationType === 'COMPLETE')))
  }
  useEffect(load, [keyword])

  const resend = (r: ProductionRecord) => {
    r.mesReportStatus = 'SUCCESS'
    toast.success(`完工事件 ${r.eventId} 已补传 MES（模拟）`, { description: '以业务幂等键防重复报工' })
    load()
  }

  const pending = list.filter((r) => r.mesReportStatus !== 'SUCCESS')

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="生产上报"
          description="完工事件持久化后异步上报 MES；失败保留待补传状态，不重复创建生产记录"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 font-mono" placeholder="搜索 SN / 工单 / eventId…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <span className="text-xs text-slate-400">待补传 {pending.length} 条</span>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">eventId（业务幂等键）</th>
                <th className="px-5 py-3 font-medium">工单 / SN</th>
                <th className="px-5 py-3 font-medium">工序</th>
                <th className="px-5 py-3 font-medium">数量</th>
                <th className="px-5 py-3 font-medium">完工时间</th>
                <th className="px-5 py-3 font-medium">上报状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map((r) => (
                <tr key={r.recordId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs">{r.eventId}</td>
                  <td className="px-5 py-3 text-xs">
                    <span className="font-mono">{r.workOrderCode}</span>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">{r.productSn ?? `批次 ${r.lotNo}`}</div>
                  </td>
                  <td className="px-5 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{r.processCode}</code></td>
                  <td className="px-5 py-3 text-xs tabular-nums">良 {r.goodQty} / 不良 {r.defectQty}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{r.endTime}</td>
                  <td className="px-5 py-3"><StatusBadge meta={REPORT_STATUS_META[r.mesReportStatus]} /></td>
                  <td className="px-5 py-3 text-right">
                    {r.mesReportStatus !== 'SUCCESS' && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => resend(r)}>
                        <RotateCw className="h-3.5 w-3.5" /> 补传
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
