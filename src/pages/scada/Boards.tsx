import { useEffect, useState } from 'react'
import { MonitorPlay, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { dataApi } from '@/services/mock'
import type { Board } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 看板管理（F4.5）：模板、刷新周期、轮播、终端绑定、匿名/登录策略 */
export default function Boards() {
  const [list, setList] = useState<Board[]>([])

  useEffect(() => {
    void dataApi.listBoards().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="看板管理"
          description="看板模板：产线总览 / 设备状态 / 生产进度 / 质量表现 / 工艺参数 / 设备效率 / 异常 Andon / AGV 任务"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.info('看板设计器骨架：组件布局与数据源绑定待接入')}>
              <Plus className="mr-1.5 h-4 w-4" /> 新建看板
            </Button>
          }
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <div key={b.boardId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{b.width}×{b.height} · {b.theme}主题 · {b.refreshSeconds}s 刷新</div>
                </div>
                <Badge variant="outline" className={b.status === '已发布' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                  {b.status}
                </Badge>
              </div>

              <div className="mt-3 flex h-24 items-center justify-center rounded-lg bg-slate-950">
                <MonitorPlay className="h-6 w-6 text-indigo-400" />
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <div>轮播页面：{b.pages} 页 · 终端：{b.terminalBinding}</div>
                <div>展示策略：{b.accessMode} · 更新于 {b.updatedAt}</div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="h-7 flex-1 text-xs"
                  onClick={() => {
                    if (b.boardId === 'BD03') window.open('/board/andon', '_blank')
                    else toast.info('该看板为占位模板；Andon/线边库存/AGV 调度看板见左侧「终端大屏」菜单')
                  }}>
                  预览
                </Button>
                <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => toast.info('画面发布版本管理：发布需二次确认')}>
                  发布管理
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          刷新周期应按数据变化频率配置，避免所有大屏高频刷新导致服务过载；配置项含看板名称、尺寸、主题、组件布局与数据源、自动轮播、终端绑定、匿名/登录策略与发布版本。
        </p>
      </div>
    </AppLayout>
  )
}
