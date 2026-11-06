import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Search, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EQUIPMENT_STATUS_META, EQUIPMENT_TYPE_LABELS } from '@/lib/status'
import { deviceApi } from '@/services/mock'
import type { Driver, Equipment, EquipmentType } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const EMPTY_FORM: Partial<Equipment> = {
  equipmentCode: '', equipmentName: '', equipmentType: 'PLC', factoryId: 'F01', lineId: 'L01',
  stationId: 'ST01', brand: '', model: '', protocolDriverId: 'DRV01', endpoint: '',
  connectionTimeoutMs: 3000, retryIntervalMs: 5000, enabled: false, status: 'CONFIGURED',
  controlMode: '自动', currentAlarmCount: 0, runMinutesToday: 0, downMinutesToday: 0, outputToday: 0,
}

/** 设备台账（F1.1.1）：编码唯一、驱动必填、连接测试通过才能启用、引用设备只允许停用 */
export default function Equipments() {
  const [list, setList] = useState<Equipment[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [editTarget, setEditTarget] = useState<Partial<Equipment> | null>(null)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; suggestions: string[] } | null>(null)

  const load = () => {
    void deviceApi.listEquipments({ keyword }).then(setList)
  }
  useEffect(() => {
    load()
    void deviceApi.listDrivers().then(setDrivers)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load 只依赖 keyword
  }, [keyword])

  const save = async () => {
    if (!editTarget) return
    if (!editTarget.equipmentCode?.trim() || !editTarget.equipmentName?.trim()) {
      toast.error('设备编码与名称为必填项')
      return
    }
    if (!editTarget.protocolDriverId) {
      toast.error('设备启用前必须配置协议驱动')
      return
    }
    setSaving(true)
    try {
      await deviceApi.saveEquipment(editTarget as Equipment)
      toast.success('设备已保存', { description: '保存后状态为「已配置」，不会自动开始采集' })
      setEditTarget(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (id: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const r = await deviceApi.testConnection(id)
      setTestResult(r)
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : '测试失败', suggestions: [] })
    } finally {
      setTestingId(null)
    }
  }

  const toggleEnable = async (e: Equipment) => {
    try {
      await deviceApi.setEnabled(e.equipmentId, !e.enabled)
      toast.success(e.enabled ? '设备已停用，采集任务已停止' : '设备启用中，正在建立采集运行实例…')
      setTimeout(load, 1400)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const filtered = list.filter((e) => !status || e.status === status)
  const { paged, page, setPage, total, pageSize } = usePaged(filtered, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="设备台账"
          description="设备注册、驱动绑定、连接测试与启停；被点位/记录/报警引用的设备只允许停用，不做物理删除"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({ ...EMPTY_FORM })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新建设备
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索编码 / 名称 / 地址…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(EQUIPMENT_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">设备</th>
                <th className="px-5 py-3 font-medium">类型 / 品牌型号</th>
                <th className="px-5 py-3 font-medium">驱动</th>
                <th className="px-5 py-3 font-medium">通信地址</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">启用</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((e) => (
                <tr key={e.equipmentId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{e.equipmentName}</div>
                    <div className="font-mono text-xs text-slate-400">{e.equipmentCode}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {EQUIPMENT_TYPE_LABELS[e.equipmentType]}
                    {e.brand && <div className="mt-0.5 text-slate-400">{e.brand} {e.model}</div>}
                  </td>
                  <td className="px-5 py-3 text-xs">{drivers.find((d) => d.driverId === e.protocolDriverId)?.name ?? <span className="text-red-500">未配置</span>}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.endpoint || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge meta={EQUIPMENT_STATUS_META[e.status]} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleEnable(e)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${e.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      title={e.enabled ? '停用设备' : '启用设备（需先通过连接测试）'}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${e.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="编辑" onClick={() => setEditTarget({ ...e })}>
                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" title="连接测试" disabled={testingId === e.equipmentId}
                        onClick={() => testConnection(e.equipmentId)}>
                        {testingId === e.equipmentId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                        连接测试
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

        {testResult && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${testResult.ok ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-red-200 bg-red-50/60 text-red-700'}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{testResult.ok ? '连接测试通过' : '连接测试失败'}</span>
              <button className="text-xs opacity-60 hover:opacity-100" onClick={() => setTestResult(null)}>关闭</button>
            </div>
            <p className="mt-1 text-xs">{testResult.message}</p>
            {testResult.suggestions.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-xs">
                {testResult.suggestions.map((s) => <li key={s}>建议检查：{s}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 新建 / 编辑 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget?.equipmentId ? '编辑设备' : '新建设备'}</DialogTitle>
            <DialogDescription>设备编码全局唯一，创建后原则上不可修改；保存后状态为「已配置」，需连接测试通过后启用</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">设备编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.equipmentCode ?? ''} disabled={!!editTarget.equipmentId}
                  onChange={(e) => setEditTarget({ ...editTarget, equipmentCode: e.target.value })} placeholder="EQ011" />
              </div>
              <div>
                <div className="text-xs text-slate-500">设备名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.equipmentName ?? ''} onChange={(e) => setEditTarget({ ...editTarget, equipmentName: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">设备类型 <span className="text-red-500">*</span></div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                  value={editTarget.equipmentType} onChange={(e) => setEditTarget({ ...editTarget, equipmentType: e.target.value as EquipmentType })}>
                  {Object.entries(EQUIPMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">所属产线 <span className="text-red-500">*</span></div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                  value={editTarget.lineId} onChange={(e) => setEditTarget({ ...editTarget, lineId: e.target.value })}>
                  <option value="L01">总装一线</option>
                  <option value="L02">总装二线</option>
                  <option value="L03">机加工线</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">品牌 / 型号</div>
                <div className="mt-1.5 flex gap-2">
                  <Input placeholder="品牌" value={editTarget.brand ?? ''} onChange={(e) => setEditTarget({ ...editTarget, brand: e.target.value })} />
                  <Input placeholder="型号" value={editTarget.model ?? ''} onChange={(e) => setEditTarget({ ...editTarget, model: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">协议驱动 <span className="text-red-500">*</span></div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                  value={editTarget.protocolDriverId} onChange={(e) => setEditTarget({ ...editTarget, protocolDriverId: e.target.value })}>
                  {drivers.map((d) => <option key={d.driverId} value={d.driverId}>{d.name}（{d.status === 'RUNNING' ? '运行中' : '已停止'}）</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">通信地址（IP:端口 / 串口 / OPC UA Endpoint，按驱动类型校验）</div>
                <Input className="mt-1.5 font-mono" value={editTarget.endpoint ?? ''} onChange={(e) => setEditTarget({ ...editTarget, endpoint: e.target.value })} placeholder="10.128.1.11:102" />
              </div>
              <div>
                <div className="text-xs text-slate-500">连接超时 ms（500–30000）</div>
                <Input className="mt-1.5" type="number" value={editTarget.connectionTimeoutMs ?? 3000}
                  onChange={(e) => setEditTarget({ ...editTarget, connectionTimeoutMs: Number(e.target.value) })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">重试间隔 ms</div>
                <Input className="mt-1.5" type="number" value={editTarget.retryIntervalMs ?? 5000}
                  onChange={(e) => setEditTarget({ ...editTarget, retryIntervalMs: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
