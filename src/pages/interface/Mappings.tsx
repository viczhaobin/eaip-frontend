import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { interfaceApi } from '@/services/mock'
import type { FieldMapping } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 字段映射（F2.5）：源/目标字段、转换算子、空值与非法值策略、版本生效时间 */
export default function Mappings() {
  const [list, setList] = useState<FieldMapping[]>([])

  useEffect(() => {
    void interfaceApi.listMappings().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="字段映射"
          description="源系统字段 → 目标系统字段映射与转换；表达式沙箱执行，转换失败返回字段级错误"
        /></StickyPageHead>

        <div className="mt-6 space-y-4">
          {list.map((m) => (
            <div key={m.mappingId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.name}</span>
                  <Badge variant="outline" className="font-mono text-[11px]">{m.version}</Badge>
                  <Badge variant="outline" className={m.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}>
                    {m.enabled ? '生效中' : '已停用'}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400">生效时间 {m.effectiveTime}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-[11px] text-slate-400">源</div>
                  <div className="mt-0.5 font-medium">{m.sourceSystem} / {m.sourceObject}</div>
                </div>
                <span className="text-slate-300">→</span>
                <div className="rounded-lg bg-indigo-50/60 px-3 py-2">
                  <div className="text-[11px] text-indigo-400">目标</div>
                  <div className="mt-0.5 font-medium">{m.targetSystem} / {m.targetObject}</div>
                </div>
                <div className="ml-auto text-xs text-slate-500">{m.fieldCount} 个字段</div>
              </div>

              <div className="mt-4 grid gap-2 text-xs md:grid-cols-3">
                <div className="rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-400">转换：</span>{m.transformSummary}
                </div>
                <div className="rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-400">空值策略：</span>{m.nullStrategy}
                </div>
                <div className="rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-400">非法值策略：</span>{m.invalidStrategy}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-500">
          <div className="mb-1 font-medium text-slate-700">支持的转换算子</div>
          类型转换（字符串/整数/浮点/布尔/时间）· 字符串（截取/拼接/替换/去空格）· 数值（乘系数/加偏移/精度舍入）·
          枚举映射 · 时间（格式解析/时区转换）· 条件 IF/ELSE、CASE · 字段派生。禁止任意脚本访问文件系统、网络或系统命令。
        </div>
      </div>
    </AppLayout>
  )
}
