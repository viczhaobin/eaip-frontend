import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { REPORT_STATUS_META } from '@/lib/status'
import { integrationApi } from '@/services/mock'
import type { OperationRecord } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const DECISION_META: Record<OperationRecord['checkinDecision'], { label: string; badge: string }> = {
  PASS: { label: 'PASS 放行', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECT: { label: 'REJECT 拦截', badge: 'bg-red-50 text-red-700 border-red-200' },
  WARNING: { label: 'WARNING 授权确认', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const OP_STATUS_META: Record<OperationRecord['status'], { label: string; badge: string }> = {
  '在制': { label: '在制', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  '暂停': { label: '暂停', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  '已完工': { label: '已完工', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

/** 工序管控（F6.3/F6.4）：进站校验结果、开工/暂停/恢复/完工记录、MES 回报状态 */
export default function Operations() {
  const [list, setList] = useState<OperationRecord[]>([])
  const [keyword, setKeyword] = useState('')

  const load = () => {
    void integrationApi.listOperationRecords({ keyword }).then(setList)
  }
  useEffect(load, [keyword])

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="工序管控"
          description="进站校验（SN/工单/工艺路线/前序/设备/人员/配方/冻结 10 步校验）与开工、暂停、恢复、完工全记录；校验结果供 PLC 决定是否开放生产许可"
        />

        <div className="mt-6 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 font-mono" placeholder="搜索 SN / 记录号 / 工单…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div></StickyPageHead>

        <div className="mt-6 space-y-3">
          {paged.map((o) => (
            <div key={o.operationRecordId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-semibold">{o.operationRecordId}</span>
                <Badge variant="outline" className="font-mono text-[11px]">{o.processCode}</Badge>
                <Badge variant="outline" className={DECISION_META[o.checkinDecision].badge}>{DECISION_META[o.checkinDecision].label}</Badge>
                <Badge variant="outline" className={OP_STATUS_META[o.status].badge}>{OP_STATUS_META[o.status].label}</Badge>
                <Badge variant="outline" className={REPORT_STATUS_META[o.mesReportStatus].badge}>MES {REPORT_STATUS_META[o.mesReportStatus].label}</Badge>
                <span className="ml-auto text-xs text-slate-400">{o.startTime}{o.endTime ? ` → ${o.endTime}` : ''}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
                <div>工单：<span className="font-mono">{o.workOrderCode}</span></div>
                <div>SN：<span className="font-mono">{o.productSn}</span></div>
                <div>工位/设备：<span className="font-mono">{o.stationCode} / {o.equipmentCode}</span></div>
                <div>人员：<span className="font-mono">{o.operatorCode}</span></div>
              </div>
              {o.reasonMessage && (
                <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${o.checkinDecision === 'REJECT' ? 'bg-red-50/70 text-red-700' : 'bg-amber-50/70 text-amber-700'}`}>
                  {o.reasonMessage}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                {o.recipeCode && <span>配方 {o.recipeCode}/{o.recipeVersion}</span>}
                {o.pauseReason && <span>暂停原因：{o.pauseReason}</span>}
                {(o.goodQty > 0 || o.defectQty > 0) && <span>完工：良 {o.goodQty} / 不良 {o.defectQty}</span>}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          平台不得绕过 PLC 安全联锁；完工事件先持久化再异步上报 MES，MES 不可用保留待补传，不重复创建生产记录。
        </p>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
    </AppLayout>
  )
}
