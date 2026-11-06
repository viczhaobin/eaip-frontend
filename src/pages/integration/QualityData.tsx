import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { integrationApi } from '@/services/mock'
import type { QualityRecord } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const RESULT_META: Record<QualityRecord['result'], { label: string; badge: string }> = {
  '合格': { label: '合格', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '不合格': { label: '不合格', badge: 'bg-red-50 text-red-700 border-red-200' },
  '待定': { label: '待定', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const MES_META: Record<QualityRecord['mesStatus'], { label: string; badge: string }> = {
  SUCCESS: { label: '已上报', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PENDING: { label: '待上报', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FAILED: { label: '上报失败', badge: 'bg-red-50 text-red-700 border-red-200' },
}

/** 质量数据（F6.6）：检测项实测值/规格/判定、缺陷代码与上报状态 */
export default function QualityData() {
  const [list, setList] = useState<QualityRecord[]>([])
  const [keyword, setKeyword] = useState('')
  const [result, setResult] = useState('')

  const load = () => {
    void integrationApi.listQualityRecords({ keyword, result: result || undefined }).then(setList)
  }
  useEffect(load, [keyword, result])

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="质量数据"
          description="检测项目实测值、规格上下限与判定；以业务幂等键防重复质量记录；不允许把未确认结果自动改为合格"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 font-mono" placeholder="搜索 SN / 记录号…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="">全部判定</option>
            {Object.entries(RESULT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">记录</th>
                <th className="px-5 py-3 font-medium">工单 / 工序</th>
                <th className="px-5 py-3 font-medium">检测项</th>
                <th className="px-5 py-3 font-medium">实测 / 规格</th>
                <th className="px-5 py-3 font-medium">判定</th>
                <th className="px-5 py-3 font-medium">缺陷</th>
                <th className="px-5 py-3 font-medium">检测时间 / 设备</th>
                <th className="px-5 py-3 font-medium">MES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((q) => {
                const deviate = q.result === '不合格'
                return (
                  <tr key={q.qualityId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs">{q.qualityId}</td>
                    <td className="px-5 py-3 text-xs">
                      <span className="font-mono">{q.workOrderCode}</span>
                      <div className="mt-0.5"><code className="rounded bg-slate-100 px-1 font-mono text-[11px]">{q.processCode}</code> · SN {q.productSn}</div>
                    </td>
                    <td className="px-5 py-3 font-medium">{q.checkItem}</td>
                    <td className="px-5 py-3">
                      <span className={`tabular-nums ${deviate ? 'font-semibold text-red-600' : ''}`}>{q.measuredValue} {q.unit}</span>
                      <div className="text-[11px] text-slate-400">{q.lowerLimit} ~ {q.upperLimit}</div>
                    </td>
                    <td className="px-5 py-3"><Badge variant="outline" className={RESULT_META[q.result].badge}>{RESULT_META[q.result].label}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{q.defectCode ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{q.checkedAt}<div className="mt-0.5 font-mono text-[11px] text-slate-400">{q.equipmentCode} · {q.operatorId}</div></td>
                    <td className="px-5 py-3"><Badge variant="outline" className={MES_META[q.mesStatus].badge}>{MES_META[q.mesStatus].label}</Badge></td>
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
