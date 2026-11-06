import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { dataApi } from '@/services/mock'
import type { Recipe } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 工艺监控（F4.4）：参数实时值/设定值/上下限、超限状态、配方版本与变更留痕 */
export default function ProcessMonitor() {
  const [list, setList] = useState<Recipe[]>([])
  const [selectedCode, setSelectedCode] = useState('RC001')

  useEffect(() => {
    void dataApi.listRecipes().then((rs) => {
      setList(rs.filter((r) => r.status === '已发布'))
    })
  }, [])

  const recipe = list.find((r) => r.recipeCode === selectedCode)

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="工艺监控"
          description="工艺参数实时值、设定值、上下限与单位；配方编号/版本、下载/切换反馈、参数修改留痕"
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {list.map((r) => (
            <button key={r.recipeId} onClick={() => setSelectedCode(r.recipeCode)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${selectedCode === r.recipeCode ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <div className="font-mono font-medium">{r.recipeCode} / {r.version}</div>
              <div className="mt-0.5 text-slate-400">{r.processCode} · {r.source}</div>
            </button>
          ))}
        </div></StickyPageHead>

        {recipe && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
                {recipe.recipeCode}/{recipe.version} · {recipe.processCode}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Badge variant="outline" className={recipe.source === 'MES同步' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}>{recipe.source}</Badge>
                {recipe.effectiveTime && <span>{recipe.effectiveTime} 生效</span>}
                <span>· {recipe.updatedBy} 更新于 {recipe.updatedAt}</span>
              </div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {recipe.parameters.map((p) => {
                const deviate = p.upperLimit != null && p.lowerLimit != null && (p.actualValue > p.upperLimit || p.actualValue < p.lowerLimit)
                const range = (p.upperLimit ?? 0) - (p.lowerLimit ?? 0)
                const pos = range > 0 ? Math.min(100, Math.max(0, ((p.actualValue - (p.lowerLimit ?? 0)) / range) * 100)) : 50
                return (
                  <div key={p.name} className={`rounded-xl border p-4 ${deviate ? 'border-red-300 bg-red-50/50' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name}</span>
                      {deviate
                        ? <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">超限</Badge>
                        : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">正常</Badge>}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-2xl font-semibold tabular-nums ${deviate ? 'text-red-600' : ''}`}>{p.actualValue}</span>
                      <span className="text-xs text-slate-400">{p.unit} · 设定 {p.setValue}</span>
                    </div>
                    <div className="relative mt-3 h-1.5 rounded-full bg-slate-100">
                      <div className={`absolute inset-y-0 left-0 rounded-full ${deviate ? 'bg-red-400' : 'bg-indigo-400'}`} style={{ width: `${pos}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                      <span>{p.lowerLimit ?? '-'}</span>
                      <span>{p.upperLimit ?? '-'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
              参数修改留痕：修改人、时间、前后值；产品 SN/批次关联见追溯查询；配方写入设备必须走 F1 控制安全流程；质量码与数据来源随参数值展示。
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
