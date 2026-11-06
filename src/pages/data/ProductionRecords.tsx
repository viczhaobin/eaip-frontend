import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { REPORT_STATUS_META } from '@/lib/status'
import { dataApi } from '@/services/mock'
import { lineName, stationName, equipmentName } from '@/services/mock/db'
import type { ProductionRecord } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const OP_TYPE_META: Record<ProductionRecord['operationType'], { label: string; badge: string }> = {
  START: { label: '开工', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETE: { label: '完工', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAUSE: { label: '暂停', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESUME: { label: '恢复', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  REWORK: { label: '返工', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
}

/** 生产记录（F3.4）：工序 START/COMPLETE/PAUSE/RESUME/REWORK 全事件 */
export default function ProductionRecords() {
  const [list, setList] = useState<ProductionRecord[]>([])
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')

  const load = () => {
    void dataApi.listProductionRecords({ keyword }).then(setList)
  }
  useEffect(load, [keyword])

  const filtered = list.filter((r) => !type || r.operationType === type)
  const { paged, page, setPage, total, pageSize } = usePaged(filtered, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="生产记录"
          description="同一产品同一工序的重复完工按业务幂等键去重；缺少 SN 时按批次/工单追溯并标明粒度"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索 SN / recordId…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">全部操作类型</option>
            {Object.entries(OP_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">recordId / eventId</th>
                <th className="px-5 py-3 font-medium">工单 / 产品</th>
                <th className="px-5 py-3 font-medium">工序 / 产线工位</th>
                <th className="px-5 py-3 font-medium">操作</th>
                <th className="px-5 py-3 font-medium">开始 → 结束</th>
                <th className="px-5 py-3 font-medium">数量（入/良/不良）</th>
                <th className="px-5 py-3 font-medium">人员 / 班次</th>
                <th className="px-5 py-3 font-medium">上报 MES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((r) => (
                <tr key={r.recordId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">{r.recordId}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400" title="业务幂等键">{r.eventId}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">{r.workOrderCode}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {r.productSn ?? <span className="text-slate-400">按批次追溯：{r.lotNo}</span>}
                      {r.productSn && r.lotNo && <span className="ml-1 text-slate-400">{r.lotNo}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs">
                    <Badge variant="outline" className="mb-1 font-mono text-[11px]">{r.processCode}</Badge>
                    <div className="text-slate-400">{lineName(r.lineId)} / {stationName(r.stationId)} / {equipmentName(r.equipmentId)}</div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge meta={OP_TYPE_META[r.operationType]} /></td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    <div>{r.startTime}</div>
                    {r.endTime && <div className="mt-0.5 text-slate-400">→ {r.endTime}</div>}
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums">
                    {r.inputQty} / <span className="text-emerald-600">{r.goodQty}</span> / <span className={r.defectQty > 0 ? 'text-red-500' : ''}>{r.defectQty}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{r.operatorId} · {r.shiftCode}</td>
                  <td className="px-5 py-3"><StatusBadge meta={REPORT_STATUS_META[r.mesReportStatus]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
        <p className="mt-4 text-xs text-slate-400">来源系统：{[...new Set(list.map((r) => r.sourceSystem))].join('、')}；生产记录与原始 Tag 数据通过时间窗口、设备和工单/产品标识关联。</p>
      </div>
    </AppLayout>
  )
}
