import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { ADAPTER_STATUS_META } from '@/lib/status'
import { interfaceApi } from '@/services/mock'
import type { Adapter, AdapterType } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const TYPES: AdapterType[] = ['HTTP/REST Client', 'HTTP/REST Server', 'WebSocket', 'MQTT', 'TCP', '数据库', '文件', 'OPC UA']

/** 数据适配器（F2.4）：统一生命周期与凭证引用 */
export default function Adapters() {
  const [list, setList] = useState<Adapter[]>([])
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')
  const [editTarget, setEditTarget] = useState<Partial<Adapter> | null>(null)

  const load = () => {
    void interfaceApi.listAdapters({ keyword, type: type || undefined }).then(setList)
  }
  useEffect(load, [keyword, type])

  const save = async () => {
    if (!editTarget?.adapterCode?.trim()) {
      toast.error('适配器编码为必填项')
      return
    }
    await interfaceApi.saveAdapter({ ...editTarget, status: editTarget.status ?? '已配置' } as Adapter)
    toast.success('适配器已保存（数据库适配器默认禁止任意 SQL 写入，仅允许白名单参数化语句）')
    setEditTarget(null)
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="数据适配器"
          description="HTTP/WebSocket/MQTT/TCP/数据库/文件/OPC UA 适配器统一生命周期管理；凭证加密保存，日志不记录密码"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({
              adapterCode: '', adapterType: 'HTTP/REST Client', endpoint: '', credentialRef: '-',
              timeoutMs: 5000, retryPolicy: '指数退避，最大 3 次', healthStatus: 'UNKNOWN', status: '未配置',
            })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新建适配器
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索编码 / 地址…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">全部类型</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">适配器</th>
                <th className="px-5 py-3 font-medium">Endpoint</th>
                <th className="px-5 py-3 font-medium">凭证引用</th>
                <th className="px-5 py-3 font-medium">重试策略</th>
                <th className="px-5 py-3 font-medium">最近成功</th>
                <th className="px-5 py-3 font-medium">健康 / 状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((a) => (
                <tr key={a.adapterId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{a.adapterCode}</div>
                    <div className="text-xs text-slate-400">{a.adapterType}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.endpoint}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.credentialRef}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{a.retryPolicy}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{a.lastSuccessAt ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge meta={ADAPTER_STATUS_META[a.status]} />
                      {a.lastError && <span className="text-[11px] text-red-500">{a.lastError}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget({ ...a })}>编辑</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
        <p className="mt-4 text-xs text-slate-400">生命周期：未配置 → 已配置 → 测试中 → 已连接 → 运行中 → 异常 → 已停用</p>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{list.some((x) => x.adapterId === editTarget?.adapterId) ? '编辑适配器' : '新建适配器'}</DialogTitle>
            <DialogDescription>跨系统数据库直连仅作为客户明确允许的选配，优先使用 API 或消息接口</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">适配器编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.adapterCode ?? ''} onChange={(e) => setEditTarget({ ...editTarget, adapterCode: e.target.value })} placeholder="AD-XXX" />
              </div>
              <div>
                <div className="text-xs text-slate-500">类型</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.adapterType}
                  onChange={(e) => setEditTarget({ ...editTarget, adapterType: e.target.value as AdapterType })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">Endpoint</div>
                <Input className="mt-1.5 font-mono" value={editTarget.endpoint ?? ''} onChange={(e) => setEditTarget({ ...editTarget, endpoint: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">凭证引用（密钥掩码，不明文展示）</div>
                <Input className="mt-1.5 font-mono" value={editTarget.credentialRef ?? ''} onChange={(e) => setEditTarget({ ...editTarget, credentialRef: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">重试策略</div>
                <Input className="mt-1.5" value={editTarget.retryPolicy ?? ''} onChange={(e) => setEditTarget({ ...editTarget, retryPolicy: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
