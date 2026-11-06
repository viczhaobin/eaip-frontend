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
import { interfaceApi } from '@/services/mock'
import type { ApiInterface } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** API 管理（F2.2）：接口目录、启停、调用统计；密钥掩码展示 */
export default function ApiManage() {
  const [list, setList] = useState<ApiInterface[]>([])
  const [keyword, setKeyword] = useState('')
  const [direction, setDirection] = useState('')
  const [editTarget, setEditTarget] = useState<Partial<ApiInterface> | null>(null)

  const load = () => {
    void interfaceApi.listApiInterfaces({ keyword, direction: direction || undefined }).then(setList)
  }
  useEffect(load, [keyword, direction])

  const save = async () => {
    if (!editTarget?.interfaceCode?.trim() || !editTarget.name?.trim()) {
      toast.error('接口编码与名称为必填项')
      return
    }
    await interfaceApi.saveApiInterface(editTarget as ApiInterface)
    toast.success('接口已保存；已发布版本不可原位修改，变更需发布新版本')
    setEditTarget(null)
    load()
  }

  const toggle = async (a: ApiInterface) => {
    await interfaceApi.saveApiInterface({ ...a, enabled: !a.enabled })
    toast.success(`接口「${a.name}」已${a.enabled ? '停用' : '启用'}`)
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="API 管理"
          description="北向 REST API 目录：认证、限流、幂等策略与调用统计；访问凭证只展示一次或掩码展示"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({
              interfaceCode: '', name: '', version: 'v1', direction: 'INBOUND', method: 'POST',
              path: '/api/v1/', contentType: 'application/json', authType: 'API Key', timeoutMs: 5000,
              rateLimitPerMin: 120, idempotency: 'Idempotency-Key 请求头', enabled: false,
              calls: 0, successRate: 0, p95Ms: 0, owner: '',
            })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新建接口
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索编码 / 名称 / 路径…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="">全部方向</option>
            <option value="INBOUND">INBOUND（北向接入）</option>
            <option value="OUTBOUND">OUTBOUND（对外调用）</option>
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">接口</th>
                <th className="px-5 py-3 font-medium">Method / Path</th>
                <th className="px-5 py-3 font-medium">认证 / 限流</th>
                <th className="px-5 py-3 font-medium">幂等策略</th>
                <th className="px-5 py-3 font-medium">调用量 / 成功率 / P95</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((a) => (
                <tr key={a.interfaceCode} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{a.name} <span className="text-xs text-slate-400">{a.version}</span></div>
                    <div className="font-mono text-xs text-slate-400">{a.interfaceCode}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="mr-1.5 text-[11px]">{a.direction}</Badge>
                    <span className="font-mono text-xs"><span className="font-semibold text-indigo-600">{a.method}</span> {a.path}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{a.authType} / {a.rateLimitPerMin} 每分钟</td>
                  <td className="px-5 py-3 max-w-40 text-xs text-slate-500">{a.idempotency}</td>
                  <td className="px-5 py-3 text-xs tabular-nums">
                    {a.calls.toLocaleString()} / <span className={a.successRate >= 99 ? 'text-emerald-600' : 'text-amber-600'}>{a.successRate}%</span> / {a.p95Ms}ms
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={a.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                      {a.enabled ? '已发布' : '已停用'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget({ ...a })}>编辑</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggle(a)}>{a.enabled ? '停用' : '启用'}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500">
          通用响应格式：<code className="rounded bg-slate-100 px-1 font-mono">{'{ success, code, message, requestId, data }'}</code>；
          错误响应包含稳定错误码、可读信息和 requestId，不暴露堆栈与内部主机信息。在线调试支持请求头/体编辑与响应耗时展示。
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget?.calls !== undefined && list.some((x) => x.interfaceCode === editTarget?.interfaceCode) ? '编辑接口' : '新建接口'}</DialogTitle>
            <DialogDescription>已发布版本不可原位修改；本次变更将生成新版本</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">接口编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.interfaceCode ?? ''} disabled={list.some((x) => x.interfaceCode === editTarget?.interfaceCode)}
                  onChange={(e) => setEditTarget({ ...editTarget, interfaceCode: e.target.value })} placeholder="API-XXX" />
              </div>
              <div>
                <div className="text-xs text-slate-500">名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.name ?? ''} onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">方向</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.direction}
                  onChange={(e) => setEditTarget({ ...editTarget, direction: e.target.value as 'INBOUND' | 'OUTBOUND' })}>
                  <option value="INBOUND">INBOUND</option>
                  <option value="OUTBOUND">OUTBOUND</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">HTTP Method</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.method}
                  onChange={(e) => setEditTarget({ ...editTarget, method: e.target.value as ApiInterface['method'] })}>
                  {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">Path <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.path ?? ''} onChange={(e) => setEditTarget({ ...editTarget, path: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">认证方式</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.authType}
                  onChange={(e) => setEditTarget({ ...editTarget, authType: e.target.value })}>
                  {['API Key', 'Token', '双向TLS', '无'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">负责人</div>
                <Input className="mt-1.5" value={editTarget.owner ?? ''} onChange={(e) => setEditTarget({ ...editTarget, owner: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">超时 ms</div>
                <Input className="mt-1.5" type="number" value={editTarget.timeoutMs ?? 5000} onChange={(e) => setEditTarget({ ...editTarget, timeoutMs: Number(e.target.value) })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">限流（次/分钟）</div>
                <Input className="mt-1.5" type="number" value={editTarget.rateLimitPerMin ?? 120} onChange={(e) => setEditTarget({ ...editTarget, rateLimitPerMin: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">幂等策略</div>
                <Input className="mt-1.5" value={editTarget.idempotency ?? ''} onChange={(e) => setEditTarget({ ...editTarget, idempotency: e.target.value })} />
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
