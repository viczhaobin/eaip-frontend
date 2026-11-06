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
import type { SystemRole, UserAccount } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** 组织/用户（8.1）：用户台账与角色分配 */
export default function Users() {
  const [list, setList] = useState<UserAccount[]>([])
  const [roles, setRoles] = useState<SystemRole[]>([])
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState('')
  const [editTarget, setEditTarget] = useState<Partial<UserAccount> | null>(null)

  const load = () => {
    void systemApi.listUsers({ keyword, role: role || undefined }).then(setList)
  }
  useEffect(() => {
    load()
    void systemApi.listRoles().then(setRoles)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load 只依赖 keyword/role
  }, [keyword, role])

  const save = async () => {
    if (!editTarget?.login?.trim() || !editTarget.name?.trim()) {
      toast.error('登录名与姓名为必填项')
      return
    }
    await systemApi.saveUser(editTarget as UserAccount)
    toast.success('用户已保存；权限变更立即生效并记录审计')
    setEditTarget(null)
    load()
  }

  const toggleStatus = async (u: UserAccount) => {
    await systemApi.saveUser({ ...u, status: u.status === '启用' ? '停用' : '启用' })
    toast.success(`用户 ${u.login} 已${u.status === '启用' ? '停用' : '启用'}`)
    load()
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="组织 / 用户"
          description="用户台账与角色分配；数据范围支持工厂/产线/站点/设备层级"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({ login: '', name: '', role: '操作员', department: '', status: '启用' })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新增用户
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索登录名 / 姓名…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">全部角色</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">角色</th>
                <th className="px-5 py-3 font-medium">部门</th>
                <th className="px-5 py-3 font-medium">联系方式</th>
                <th className="px-5 py-3 font-medium">最近登录</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="font-mono text-xs text-slate-400">{u.login}</div>
                  </td>
                  <td className="px-5 py-3"><Badge variant="outline" className="text-[11px]">{u.role}</Badge></td>
                  <td className="px-5 py-3 text-xs text-slate-500">{u.department}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{u.email ?? '—'}<div className="text-slate-400">{u.phone ?? ''}</div></td>
                  <td className="px-5 py-3 text-xs text-slate-400">{u.lastLoginAt ?? '从未登录'}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={u.status === '启用' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget({ ...u })}>编辑</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleStatus(u)}>{u.status === '启用' ? '停用' : '启用'}</Button>
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
            <DialogTitle>{list.some((x) => x.userId === editTarget?.userId) ? '编辑用户' : '新增用户'}</DialogTitle>
            <DialogDescription>写 PLC、发布接口、修改报警规则、补传业务数据属于高风险权限，单独授权</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">登录名 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.login ?? ''} onChange={(e) => setEditTarget({ ...editTarget, login: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">姓名 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.name ?? ''} onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">角色</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.role}
                  onChange={(e) => setEditTarget({ ...editTarget, role: e.target.value as SystemRole })}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">部门</div>
                <Input className="mt-1.5" value={editTarget.department ?? ''} onChange={(e) => setEditTarget({ ...editTarget, department: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">邮箱</div>
                <Input className="mt-1.5" value={editTarget.email ?? ''} onChange={(e) => setEditTarget({ ...editTarget, email: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">电话</div>
                <Input className="mt-1.5" value={editTarget.phone ?? ''} onChange={(e) => setEditTarget({ ...editTarget, phone: e.target.value })} />
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
