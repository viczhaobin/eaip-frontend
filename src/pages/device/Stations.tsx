import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { STATION_KIND_META } from '@/lib/status'
import { deviceApi } from '@/services/mock'
import { lineName } from '@/services/mock/db'
import type { StationKind, StationNode } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const KINDS: StationKind[] = ['MASTER', 'SUB_STATION', 'EDGE_NODE']

/** 总站分站（F1.3）：站点模型、注册心跳、断点续传积压、循环父子校验 */
export default function Stations() {
  const [list, setList] = useState<StationNode[]>([])
  const [editTarget, setEditTarget] = useState<Partial<StationNode> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => void deviceApi.listStations().then(setList)
  useEffect(load, [])

  const save = async () => {
    if (!editTarget) return
    if (!editTarget.stationCode?.trim() || !editTarget.name?.trim()) {
      toast.error('站点编码与名称为必填项')
      return
    }
    // 一个产线原则上只配置一个逻辑总站
    if (editTarget.stationKind === 'MASTER' && list.some((s) => s.stationKind === 'MASTER' && s.lineId === editTarget.lineId && s.stationId !== editTarget.stationId)) {
      toast.error('该产线已存在逻辑总站，一个产线原则上只配置一个')
      return
    }
    setSaving(true)
    try {
      await deviceApi.saveStation(editTarget as StationNode)
      toast.success('站点已保存')
      setEditTarget(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const statusMeta = (s: StationNode['status']) => ({
    ONLINE: { label: '在线', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    OFFLINE: { label: '离线', badge: 'bg-red-50 text-red-700 border-red-200' },
    RECOVERING: { label: '补传中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  })[s]

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="总站分站"
          description="站点注册、心跳与断点续传监控；分站离线不影响本地 PLC 自动控制，恢复后按序补传并幂等去重"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({
              stationCode: '', name: '', stationKind: 'SUB_STATION', lineId: 'L01', parentStationId: 'ST01',
              heartbeatIntervalSec: 10, offlineThreshold: 3, syncStrategy: '断网本地队列缓存，恢复后按序补传',
              enabled: true, status: 'OFFLINE', queueBacklog: 0,
            })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新增站点
            </Button>
          }
        /></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">站点</th>
                <th className="px-5 py-3 font-medium">类型 / 层级</th>
                <th className="px-5 py-3 font-medium">边缘代理</th>
                <th className="px-5 py-3 font-medium">心跳周期</th>
                <th className="px-5 py-3 font-medium">最近心跳</th>
                <th className="px-5 py-3 font-medium">补传积压</th>
                <th className="px-5 py-3 font-medium">配置版本</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((s) => (
                <tr key={s.stationId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="font-mono text-xs text-slate-400">{s.stationCode}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={STATION_KIND_META[s.stationKind].badge}>{STATION_KIND_META[s.stationKind].label}</Badge>
                    <div className="mt-1 text-xs text-slate-400">{lineName(s.lineId)}{s.parentStationId ? ` · 上级 ${list.find((p) => p.stationId === s.parentStationId)?.stationCode ?? s.parentStationId}` : ''}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.edgeAgentId ?? '—'}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{s.heartbeatIntervalSec}s / 离线阈值 {s.offlineThreshold} 次</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{s.lastHeartbeatAt ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs tabular-nums ${s.queueBacklog > 100 ? 'font-semibold text-amber-600' : 'text-slate-500'}`}>{s.queueBacklog}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.configVersion ?? '—'}</td>
                  <td className="px-5 py-3"><Badge variant="outline" className={statusMeta(s.status).badge}>{statusMeta(s.status).label}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget({ ...s })}>编辑</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

        <div className="mt-4 grid gap-3 text-xs leading-relaxed text-slate-500 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">注册携带 nodeId、版本、证书身份、配置版本与能力清单；总站校验身份与授权状态</div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">断网期间数据写本地磁盘队列，达容量阈值告警；恢复后按时间/序号分批限速补传</div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">总站按 eventId / (nodeId, sequence) 幂等去重；补传保留原始时间戳</div>
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget?.stationId ? '编辑站点' : '新增站点'}</DialogTitle>
            <DialogDescription>防止循环父子关系；一个产线原则上只配置一个逻辑总站</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">站点编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.stationCode ?? ''} onChange={(e) => setEditTarget({ ...editTarget, stationCode: e.target.value })} placeholder="ST06" />
              </div>
              <div>
                <div className="text-xs text-slate-500">名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.name ?? ''} onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">站点类型</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.stationKind}
                  onChange={(e) => setEditTarget({ ...editTarget, stationKind: e.target.value as StationKind })}>
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">所属产线</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.lineId}
                  onChange={(e) => setEditTarget({ ...editTarget, lineId: e.target.value })}>
                  <option value="L01">总装一线</option>
                  <option value="L02">总装二线</option>
                  <option value="L03">机加工线</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">父站点</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.parentStationId ?? ''}
                  onChange={(e) => setEditTarget({ ...editTarget, parentStationId: e.target.value || undefined })}>
                  <option value="">无（逻辑总站）</option>
                  {list.filter((s) => s.stationId !== editTarget.stationId).map((s) => <option key={s.stationId} value={s.stationId}>{s.stationCode} {s.name}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">边缘代理 ID</div>
                <Input className="mt-1.5 font-mono" value={editTarget.edgeAgentId ?? ''} onChange={(e) => setEditTarget({ ...editTarget, edgeAgentId: e.target.value })} placeholder="agent-st06" />
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">通信地址</div>
                <Input className="mt-1.5 font-mono" value={editTarget.endpoint ?? ''} onChange={(e) => setEditTarget({ ...editTarget, endpoint: e.target.value })} placeholder="10.128.0.23:7891" />
              </div>
              <div>
                <div className="text-xs text-slate-500">心跳周期 s（默认 10）</div>
                <Input className="mt-1.5" type="number" value={editTarget.heartbeatIntervalSec ?? 10}
                  onChange={(e) => setEditTarget({ ...editTarget, heartbeatIntervalSec: Number(e.target.value) })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">离线阈值（心跳次数）</div>
                <Input className="mt-1.5" type="number" value={editTarget.offlineThreshold ?? 3}
                  onChange={(e) => setEditTarget({ ...editTarget, offlineThreshold: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">数据同步策略</div>
                <Input className="mt-1.5" value={editTarget.syncStrategy ?? ''} onChange={(e) => setEditTarget({ ...editTarget, syncStrategy: e.target.value })} />
              </div>
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
