import { useEffect, useMemo, useState } from 'react'
import { Copy, Pencil, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { deviceApi } from '@/services/mock'
import { equipments } from '@/services/mock'
import type { AccessMode, Tag, TagDataType } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const DATA_TYPES: TagDataType[] = ['BOOL', 'INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT', 'DOUBLE', 'STRING', 'DATETIME']
const ACCESS_MODES: AccessMode[] = ['READ', 'WRITE', 'READ_WRITE']

const EMPTY_FORM: Partial<Tag> = {
  tagCode: '', tagName: '', equipmentId: 'EQ001', address: '', dataType: 'FLOAT', accessMode: 'READ',
  scanIntervalMs: 1000, staleAfterMs: 5000, enabled: true, version: 1, updatedBy: '', updatedAt: '',
}

/** 点位管理（F1.2.1）：单条增改复制、写点位安全限制、版本变更记录 */
export default function Tags() {
  const [list, setList] = useState<Tag[]>([])
  const [keyword, setKeyword] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [editTarget, setEditTarget] = useState<Partial<Tag> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    void deviceApi.listTags({ keyword, equipmentId: equipmentId || undefined }).then(setList)
  }
  useEffect(load, [keyword, equipmentId])

  const equipmentOptions = useMemo(() => equipments.map((e) => ({ id: e.equipmentId, name: `${e.equipmentName}（${e.equipmentCode}）` })), [])

  const save = async () => {
    if (!editTarget) return
    if (!editTarget.tagCode?.trim() || !editTarget.tagName?.trim() || !editTarget.address?.trim()) {
      toast.error('点位编码、名称、地址为必填项')
      return
    }
    if ((editTarget.accessMode === 'WRITE' || editTarget.accessMode === 'READ_WRITE') && !editTarget.writeWhitelist) {
      toast.error('写点位必须配置写入白名单、允许值范围与操作权限')
      return
    }
    setSaving(true)
    try {
      await deviceApi.saveTag(editTarget as Tag)
      toast.success('点位已保存', { description: '修改地址/类型/缩放会生成新版本并记录变更人' })
      setEditTarget(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const duplicate = (t: Tag) => {
    setEditTarget({ ...t, tagId: undefined as unknown as string, tagCode: `${t.tagCode}_COPY`, version: 1 })
  }

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="点位管理"
          description="点位定义、采集参数与写安全限制；支持 Excel/CSV 模板导入（预校验后一次性提交），被引用的点位禁止删除"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({ ...EMPTY_FORM })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新增点位
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索点位编码 / 名称…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">全部设备</option>
            {equipmentOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">点位</th>
                <th className="px-5 py-3 font-medium">地址</th>
                <th className="px-5 py-3 font-medium">类型 / 读写</th>
                <th className="px-5 py-3 font-medium">采集周期</th>
                <th className="px-5 py-3 font-medium">范围</th>
                <th className="px-5 py-3 font-medium">写保护</th>
                <th className="px-5 py-3 font-medium">版本</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((t) => (
                <tr key={t.tagId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{t.tagName}</div>
                    <div className="font-mono text-xs text-slate-400">{t.tagCode}</div>
                  </td>
                  <td className="px-5 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{t.address}</code></td>
                  <td className="px-5 py-3 text-xs">
                    <Badge variant="outline" className="mr-1 text-[11px]">{t.dataType}</Badge>
                    <span className={t.accessMode !== 'READ' ? 'font-medium text-amber-600' : 'text-slate-500'}>{t.accessMode}</span>
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{t.scanIntervalMs}ms{!t.enabled && <span className="ml-1 text-slate-400">（停用）</span>}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">
                    {t.minValue != null && t.maxValue != null ? `${t.minValue} ~ ${t.maxValue}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {t.accessMode === 'READ' ? <span className="text-slate-400">只读</span> : (
                      <span className={t.writeWhitelist ? 'text-emerald-600' : 'text-red-500'}>
                        {t.writeWhitelist ? `白名单 ✓ 范围 ${t.writeAllowedRange?.min ?? '-'}~${t.writeAllowedRange?.max ?? '-'}` : '未配置白名单'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">v{t.version}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="编辑" onClick={() => setEditTarget({ ...t })}>
                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="复制" onClick={() => duplicate(t)}>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

      {/* 新增 / 编辑 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget?.tagId ? '编辑点位' : '新增点位'}</DialogTitle>
            <DialogDescription>地址格式由驱动校验；点位启用前需执行地址可读性测试</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">点位编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.tagCode ?? ''} onChange={(e) => setEditTarget({ ...editTarget, tagCode: e.target.value })} placeholder="Temperature" />
              </div>
              <div>
                <div className="text-xs text-slate-500">显示名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.tagName ?? ''} onChange={(e) => setEditTarget({ ...editTarget, tagName: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">所属设备 <span className="text-red-500">*</span></div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.equipmentId}
                  onChange={(e) => setEditTarget({ ...editTarget, equipmentId: e.target.value })}>
                  {equipmentOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">地址（PLC 地址 / NodeId / 寄存器） <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.address ?? ''} onChange={(e) => setEditTarget({ ...editTarget, address: e.target.value })} placeholder="DB1.DBW0" />
              </div>
              <div>
                <div className="text-xs text-slate-500">数据类型 <span className="text-red-500">*</span></div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.dataType}
                  onChange={(e) => setEditTarget({ ...editTarget, dataType: e.target.value as TagDataType })}>
                  {DATA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">读写模式 <span className="text-red-500">*</span></div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.accessMode}
                  onChange={(e) => setEditTarget({ ...editTarget, accessMode: e.target.value as AccessMode })}>
                  {ACCESS_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">工程单位</div>
                <Input className="mt-1.5" value={editTarget.unit ?? ''} onChange={(e) => setEditTarget({ ...editTarget, unit: e.target.value })} placeholder="degC" />
              </div>
              <div>
                <div className="text-xs text-slate-500">采集周期 ms <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" type="number" value={editTarget.scanIntervalMs ?? 1000}
                  onChange={(e) => setEditTarget({ ...editTarget, scanIntervalMs: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">合理范围（min ~ max，可选）</div>
                  <div className="mt-1.5 flex gap-2">
                    <Input type="number" value={editTarget.minValue ?? ''} onChange={(e) => setEditTarget({ ...editTarget, minValue: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    <Input type="number" value={editTarget.maxValue ?? ''} onChange={(e) => setEditTarget({ ...editTarget, maxValue: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">缩放 / 偏移（可选）</div>
                  <div className="mt-1.5 flex gap-2">
                    <Input type="number" value={editTarget.scale ?? ''} placeholder="scale" onChange={(e) => setEditTarget({ ...editTarget, scale: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    <Input type="number" value={editTarget.offset ?? ''} placeholder="offset" onChange={(e) => setEditTarget({ ...editTarget, offset: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              {editTarget.accessMode !== 'READ' && (
                <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={editTarget.writeWhitelist ?? false}
                      onChange={(e) => setEditTarget({ ...editTarget, writeWhitelist: e.target.checked })} />
                    启用写入白名单（必须），并配置允许值范围
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="允许最小值" value={editTarget.writeAllowedRange?.min ?? ''}
                      onChange={(e) => setEditTarget({ ...editTarget, writeAllowedRange: { min: Number(e.target.value), max: editTarget.writeAllowedRange?.max ?? 0 } })} />
                    <Input type="number" placeholder="允许最大值" value={editTarget.writeAllowedRange?.max ?? ''}
                      onChange={(e) => setEditTarget({ ...editTarget, writeAllowedRange: { min: editTarget.writeAllowedRange?.min ?? 0, max: Number(e.target.value) } })} />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save} disabled={saving}>{saving ? '保存中…' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
