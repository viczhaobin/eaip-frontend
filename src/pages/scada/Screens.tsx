import { useEffect, useState } from 'react'
import { Eye, History, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { dataApi } from '@/services/mock'
import type { ScadaScreen } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 组态画面（F4.1）：画面列表、版本与绑定校验状态；编辑器为 P0 画布能力占位 */
export default function Screens() {
  const [list, setList] = useState<ScadaScreen[]>([])
  const [preview, setPreview] = useState<ScadaScreen | null>(null)

  useEffect(() => {
    void dataApi.listScreens().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="组态画面"
          description="画布编辑（拖拽图元、对齐、图层、撤销重做、预览、发布回滚）与数据绑定校验；失效绑定显示占位错误，不静默显示 0"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.info('组态编辑器为 V1.0 画布能力，此处为骨架入口')}>
              <Plus className="mr-1.5 h-4 w-4" /> 新建画面
            </Button>
          }
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <div key={s.screenId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{s.width}×{s.height} · {s.gridEnabled ? '网格开' : '网格关'}</div>
                </div>
                <Badge variant="outline" className={s.status === '已发布' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                  {s.status}
                </Badge>
              </div>

              {/* 画面缩略占位 */}
              <div className="mt-3 flex h-28 items-center justify-center rounded-lg border border-slate-100"
                style={{ backgroundColor: s.background }}>
                <span className="text-xs" style={{ color: s.background === '#ffffff' ? '#94a3b8' : '#818cf8' }}>
                  {s.elementCount} 个图元 · v{s.version}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={s.bindingValid ? 'text-emerald-600' : 'text-red-500'}>
                  {s.bindingValid ? '绑定校验通过' : '存在失效绑定（显示占位错误）'}
                </span>
                <span className="text-slate-400">{s.updatedBy}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="h-7 flex-1 gap-1 text-xs" onClick={() => setPreview(s)}>
                  <Eye className="h-3.5 w-3.5" /> 预览
                </Button>
                <Button variant="outline" size="sm" className="h-7 flex-1 gap-1 text-xs" onClick={() => toast.info('画布编辑器骨架：图元拖拽/绑定/发布流程待接入')}>
                  <History className="h-3.5 w-3.5" /> 打开编辑器
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 text-xs leading-relaxed text-slate-500 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">P0 图元：文本/形状/图片、数值卡片、状态灯、受控按钮、折线/柱状/饼图、设备状态图标、报警列表、表格、进度条</div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">数据绑定：Tag 实时值/质量码、设备状态、业务对象字段、报警统计、历史查询；动态属性含颜色/可见性/阈值区间</div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">发布前校验所有绑定有效性；支持保存草稿、发布、回滚与分辨率适配策略</div>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>画面预览：{preview?.name}</DialogTitle>
            <DialogDescription>只读监控模式；按钮类图元仅触发受控业务动作（F1.4 流程）</DialogDescription>
          </DialogHeader>
          <div className="flex h-80 items-center justify-center rounded-lg border border-slate-100" style={{ backgroundColor: preview?.background }}>
            <div className="text-center text-xs" style={{ color: preview?.background === '#ffffff' ? '#94a3b8' : '#818cf8' }}>
              <div className="text-2xl font-semibold">{preview?.elementCount}</div>
              <div className="mt-1">图元组件渲染区（运行时接实时数据服务）</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
