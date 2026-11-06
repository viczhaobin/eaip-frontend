import { useEffect, useState } from 'react'
import { Search, SearchCode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { REPORT_STATUS_META, ALARM_LEVEL_META, ALARM_EVENT_STATUS_META } from '@/lib/status'
import { alarmApi, dataApi, integrationApi } from '@/services/mock'
import { equipmentName, stationName } from '@/services/mock/db'
import type { AlarmEvent, ProductionRecord, QualityRecord, Recipe } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 追溯查询（F3.6）：按工单号 / SN / 批次，串起工单→工艺路线→工序→参数→质量→报警→上报状态 */
export default function TraceQuery() {
  const [keyword, setKeyword] = useState('SN000001')
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [qualities, setQualities] = useState<QualityRecord[]>([])
  const [events, setEvents] = useState<AlarmEvent[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    void dataApi.listRecipes().then(setRecipes)
  }, [])

  const search = async () => {
    const k = keyword.trim()
    if (!k) return
    setSearched(true)
    const [r, q, e] = await Promise.all([
      dataApi.listProductionRecords({ keyword: k }),
      integrationApi.listQualityRecords({ keyword: k }),
      alarmApi.listEvents(),
    ])
    setRecords(r)
    setQualities(q)
    // 报警关联：同设备或描述包含 SN
    setEvents(e.filter((ev) => r.some((rec) => rec.equipmentId === ev.equipmentCode) || ev.description.includes(k)))
  }

  const snRecords = records.filter((r) => r.productSn === keyword.trim())
  const lotNo = snRecords[0]?.lotNo
  const workOrderCode = snRecords[0]?.workOrderCode ?? records[0]?.workOrderCode
  const recipe = recipes.find((r) => r.productCode === snRecords[0]?.productCode && r.status === '已发布')

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="追溯查询"
          description="查询入口：工单号 / 产品 SN / 批次号 / 设备编号 / 工序 / 时间范围"
        />

        <div className="mt-6 flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 font-mono" placeholder="输入产品 SN，如 SN000001 / SN000002…" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()} />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={search}>
            <SearchCode className="mr-1.5 h-4 w-4" /> 追溯
          </Button>
        </div></StickyPageHead>

        {searched && snRecords.length === 0 && records.length === 0 && (
          <EmptyState icon={SearchCode} title={`未找到 ${keyword} 的追溯数据`} description="检查 SN 是否存在；缺少 SN 时可按批次或工单追溯（标明追溯粒度）" />
        )}

        {(snRecords.length > 0 || records.length > 0) && (
          <>
            {/* 1. 基础信息 */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs text-slate-400">产品 / 批次</div>
                <div className="mt-1 font-mono text-lg font-semibold">{keyword.trim()}</div>
                <div className="mt-1 text-xs text-slate-500">批次 {lotNo ?? '—'} · 产品 {snRecords[0]?.productCode ?? '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs text-slate-400">工单</div>
                <div className="mt-1 font-mono text-lg font-semibold">{workOrderCode ?? '—'}</div>
                <div className="mt-1 text-xs text-slate-500">工艺路线 ROUTE001</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs text-slate-400">配方</div>
                <div className="mt-1 font-mono text-lg font-semibold">{recipe ? `${recipe.recipeCode}/${recipe.version}` : '—'}</div>
                <div className="mt-1 text-xs text-slate-500">{recipe?.source ?? ''}{recipe?.effectiveTime ? ` · ${recipe.effectiveTime} 生效` : ''}</div>
              </div>
            </div>

            {/* 2. 工序流转 */}
            <h2 className="mt-8 text-sm font-semibold">工序记录（{snRecords.length}）</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                    <th className="px-5 py-3 font-medium">工序</th>
                    <th className="px-5 py-3 font-medium">设备 / 工位</th>
                    <th className="px-5 py-3 font-medium">开始 → 结束</th>
                    <th className="px-5 py-3 font-medium">结果</th>
                    <th className="px-5 py-3 font-medium">操作人员</th>
                    <th className="px-5 py-3 font-medium">上报 MES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {snRecords.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((r) => (
                    <tr key={r.recordId} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3"><Badge variant="outline" className="font-mono text-[11px]">{r.processCode}</Badge></td>
                      <td className="px-5 py-3 text-xs text-slate-500">{equipmentName(r.equipmentId)}<div className="mt-0.5 text-slate-400">{stationName(r.stationId)}</div></td>
                      <td className="px-5 py-3 text-xs text-slate-500">{r.startTime}{r.endTime ? ` → ${r.endTime}` : '（进行中）'}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={r.resultCode === 'OK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.resultCode === 'NG' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                          {r.resultCode}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{r.operatorId} · {r.shiftCode}</td>
                      <td className="px-5 py-3"><Badge variant="outline" className={REPORT_STATUS_META[r.mesReportStatus].badge}>{REPORT_STATUS_META[r.mesReportStatus].label}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. 检测与质量 */}
            <h2 className="mt-8 text-sm font-semibold">检测结果（{qualities.length}）</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                    <th className="px-5 py-3 font-medium">检测项目</th>
                    <th className="px-5 py-3 font-medium">实测值 / 规格</th>
                    <th className="px-5 py-3 font-medium">判定</th>
                    <th className="px-5 py-3 font-medium">缺陷代码</th>
                    <th className="px-5 py-3 font-medium">检测设备 / 时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {qualities.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-400">无质量记录</td></tr>
                  ) : qualities.map((q) => (
                    <tr key={q.qualityId} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-medium">{q.checkItem}</td>
                      <td className="px-5 py-3 text-xs tabular-nums">{q.measuredValue} {q.unit} / {q.lowerLimit} ~ {q.upperLimit}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={q.result === '合格' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : q.result === '不合格' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                          {q.result}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{q.defectCode ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{q.equipmentCode} · {q.checkedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. 相关报警 */}
            <h2 className="mt-8 text-sm font-semibold">相关报警及异常处理（{events.length}）</h2>
            <div className="mt-3 space-y-2">
              {events.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-xs text-slate-400">生产过程无关联报警</div>}
              {events.map((e) => (
                <div key={e.eventId} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm">
                  <Badge variant="outline" className={ALARM_LEVEL_META[e.level].badge}>{ALARM_LEVEL_META[e.level].label}</Badge>
                  <span className="flex-1 text-xs">{e.description}</span>
                  <span className="text-xs text-slate-400">{e.occurredAt}</span>
                  <Badge variant="outline" className={ALARM_EVENT_STATUS_META[e.status].badge}>{ALARM_EVENT_STATUS_META[e.status].label}</Badge>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-400">
              追溯粒度：本记录按产品 SN 追溯；数据来源 PLC/HMI 事件；不允许将推算值标记为设备实测值。
            </p>
          </>
        )}
      </div>
    </AppLayout>
  )
}
