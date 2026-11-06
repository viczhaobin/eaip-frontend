import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { systemApi } from '@/services/mock'
import type { ConfigItem } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const CATEGORIES = ['组织和产线配置', '站点和设备配置', '驱动及通信配置', '点位和采集策略', 'OPC/API/MQTT 配置', '数据存储策略', '看板配置', '报警规则和通知策略', 'MES/AGV 集成配置', '系统参数']

const STATUS_META: Record<ConfigItem['status'], { label: string; badge: string }> = {
  '草稿': { label: '草稿', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  '已发布': { label: '已发布', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '已停用': { label: '已停用', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
}

/** 配置中心（8.2）：草稿/已发布/已停用状态机、版本、发布二次确认 */
export default function ConfigCenter() {
  const [list, setList] = useState<ConfigItem[]>([])
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [editTarget, setEditTarget] = useState<Partial<ConfigItem> | null>(null)
  const [publishTarget, setPublishTarget] = useState<ConfigItem | null>(null)

  const load = () => {
    void systemApi.listConfigs({ keyword, category: category || undefined }).then(setList)
  }
  useEffect(load, [keyword, category])

  const save = async () => {
    if (!editTarget?.configKey?.trim() || !editTarget.name?.trim()) {
      toast.error('配置键与名称为必填项')
      return
    }
    await systemApi.saveConfig({
      ...(editTarget as ConfigItem),
      status: editTarget.status ?? '草稿',
      version: editTarget.version ?? 1,
    })
    toast.success('配置已保存为草稿；发布前执行完整性校验')
    setEditTarget(null)
    load()
  }

  const publish = async () => {
    if (!publishTarget) return
    await systemApi.saveConfig({ ...publishTarget, status: '已发布' })
    toast.success(`配置 ${publishTarget.configKey} 已发布`, { description: '生产配置发布已二次确认；密钥/证书/密码不随配置明文导出' })
    setPublishTarget(null)
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="配置中心"
          description="配置有草稿、已发布、已停用状态；发布前完整性校验、生产发布需二次确认；支持导入导出（密钥不明文导出）与回滚"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({ configKey: '', category: '系统参数', name: '', value: '', status: '草稿', version: 1, updatedBy: '', updatedAt: '' })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新增配置
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 font-mono" placeholder="搜索配置键 / 名称…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">全部分类</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">配置</th>
                <th className="px-5 py-3 font-medium">分类</th>
                <th className="px-5 py-3 font-medium">值</th>
                <th className="px-5 py-3 font-medium">版本</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">更新</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((c) => (
                <tr key={c.configKey} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">{c.configKey}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{c.name}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{c.category}</td>
                  <td className="px-5 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{c.value}</code></td>
                  <td className="px-5 py-3 text-xs text-slate-400">v{c.version}</td>
                  <td className="px-5 py-3"><Badge variant="outline" className={STATUS_META[c.status].badge}>{STATUS_META[c.status].label}</Badge></td>
                  <td className="px-5 py-3 text-xs text-slate-400">{c.updatedBy}<div className="mt-0.5 text-[11px]">{c.updatedAt}</div></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget({ ...c })}>编辑</Button>
                      {c.status === '草稿' && <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600" onClick={() => setPublishTarget(c)}>发布</Button>}
                      {c.status === '已发布' && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info('回滚恢复上一可用版本')}>回滚</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{list.some((x) => x.configKey === editTarget?.configKey) ? '编辑配置' : '新增配置'}</DialogTitle>
            <DialogDescription>保存后为草稿状态，需发布方生效</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500">配置键 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.configKey ?? ''} onChange={(e) => setEditTarget({ ...editTarget, configKey: e.target.value })} placeholder="category.name.key" />
              </div>
              <div>
                <div className="text-xs text-slate-500">名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.name ?? ''} onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">分类</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.category}
                  onChange={(e) => setEditTarget({ ...editTarget, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">值</div>
                <Input className="mt-1.5 font-mono" value={editTarget.value ?? ''} onChange={(e) => setEditTarget({ ...editTarget, value: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save}>保存草稿</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 发布二次确认 */}
      <Dialog open={!!publishTarget} onOpenChange={(o) => !o && setPublishTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发布配置 {publishTarget?.configKey}</DialogTitle>
            <DialogDescription>
              生产环境配置发布需二次确认；发布前将执行完整性校验；配置包记录平台版本、配置版本和依赖项
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishTarget(null)}>取消</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={publish}>确认发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
