import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { dataApi } from '@/services/mock'
import type { Recipe } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const RECIPE_STATUS_META = {
  '草稿': { label: '草稿', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  '已发布': { label: '已发布', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '已停用': { label: '已停用', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
} as const

/** 工艺记录（F4.4 数据视角 + F6.5）：配方版本、参数上下限与实测值、变更留痕 */
export default function RecipeRecords() {
  const [list, setList] = useState<Recipe[]>([])

  useEffect(() => {
    void dataApi.listRecipes().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="工艺记录"
          description="配方编号及版本、参数设定值/实测值/上下限、修改人及前后值；配方由 MES 管理时仅同步展示，不成为第二主数据源"
        /></StickyPageHead>

        <div className="mt-6 space-y-5">
          {list.map((r) => (
            <div key={r.recipeId} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">{r.recipeCode} / {r.version}</span>
                  <Badge variant="outline" className="font-mono text-[11px]">{r.processCode}</Badge>
                  {r.productCode && <Badge variant="outline" className="text-[11px] text-slate-500">{r.productCode}</Badge>}
                  <Badge variant="outline" className={RECIPE_STATUS_META[r.status].badge}>{RECIPE_STATUS_META[r.status].label}</Badge>
                  <Badge variant="outline" className={r.source === 'MES同步' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}>
                    {r.source}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400">{r.updatedBy} · {r.updatedAt}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="px-5 py-2.5 font-medium">参数</th>
                    <th className="px-5 py-2.5 font-medium">设定值</th>
                    <th className="px-5 py-2.5 font-medium">实测值</th>
                    <th className="px-5 py-2.5 font-medium">上下限</th>
                    <th className="px-5 py-2.5 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {r.parameters.map((p) => {
                    const deviate = p.upperLimit != null && p.lowerLimit != null && (p.actualValue > p.upperLimit || p.actualValue < p.lowerLimit)
                    return (
                      <tr key={p.name}>
                        <td className="px-5 py-2.5 font-medium">{p.name}</td>
                        <td className="px-5 py-2.5 tabular-nums">{p.setValue} {p.unit}</td>
                        <td className="px-5 py-2.5">
                          <span className={`tabular-nums ${deviate ? 'font-semibold text-red-600' : ''}`}>{p.actualValue} {p.unit}</span>
                        </td>
                        <td className="px-5 py-2.5 text-xs tabular-nums text-slate-500">
                          {p.lowerLimit ?? '-'} ~ {p.upperLimit ?? '-'} {p.unit ?? ''}
                        </td>
                        <td className="px-5 py-2.5">
                          {deviate
                            ? <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">超限</Badge>
                            : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">正常</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          配方下载需校验设备、产品、工单和版本，由设备反馈确认；配方变更不追溯覆盖历史生产记录；实际使用版本及参数快照随生产记录保存。
        </p>
      </div>
    </AppLayout>
  )
}
