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
import { systemApi } from '@/services/mock'
import type { Factory, ProductionLine, StationNode, Workstation } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 工厂/产线（规格书 8.1 组织配置 + 1.2 命名规范）：组织层级维护 */
export default function OrgStructure() {
  const [factories, setFactories] = useState<Factory[]>([])
  const [lines, setLines] = useState<ProductionLine[]>([])
  const [stations, setStations] = useState<StationNode[]>([])
  const [workstations, setWorkstations] = useState<Workstation[]>([])
  const [lineDialog, setLineDialog] = useState<Partial<ProductionLine> | null>(null)

  const load = () => {
    void systemApi.listFactories().then(setFactories)
    void systemApi.listLines().then(setLines)
    void systemApi.listStations().then(setStations)
    void systemApi.listWorkstations().then(setWorkstations)
  }
  useEffect(load, [])

  const saveLine = async () => {
    if (!lineDialog?.lineCode?.trim() || !lineDialog.name?.trim()) {
      toast.error('产线编码与名称为必填项')
      return
    }
    if (lines.some((l) => l.lineId !== lineDialog.lineId && l.lineCode === lineDialog.lineCode)) {
      toast.error('产线编码已存在（编码全局唯一，创建后原则上不可修改）')
      return
    }
    toast.success('产线已保存（演示模式未持久化到内存库）')
    setLineDialog(null)
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="工厂 / 产线"
          description="组织层级：工厂 → 产线 → 站点 → 工位；编码规范 F01/L01/ST01/WS010，全局唯一，仅字母数字下划线短横线"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setLineDialog({ lineCode: '', factoryId: 'F01', name: '' })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新增产线
            </Button>
          }
        /></StickyPageHead>

        {factories.map((f) => (
          <div key={f.factoryId} className="mt-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{f.factoryCode}</Badge>
              <span className="font-semibold">{f.name}</span>
              <span className="text-xs text-slate-400">时区 {f.timezone}{f.description ? ` · ${f.description}` : ''}</span>
            </div>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {lines.filter((l) => l.factoryId === f.factoryId).map((l) => (
                <div key={l.lineId} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{l.lineCode}</Badge>
                      <span className="font-medium">{l.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setLineDialog({ ...l })}>编辑</Button>
                  </div>
                  {/* 站点树 */}
                  <div className="mt-4 space-y-2">
                    {stations.filter((s) => s.lineId === l.lineId).map((s) => (
                      <div key={s.stationId} className="rounded-lg border border-slate-100 px-3 py-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="font-mono text-[11px]">{s.stationCode}</Badge>
                          <span className="font-medium">{s.name}</span>
                          <Badge variant="outline" className="text-[10px]">{s.stationKind}</Badge>
                          {s.parentStationId && <span className="text-slate-400">↑ {stations.find((p) => p.stationId === s.parentStationId)?.stationCode}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {workstations.filter((w) => w.stationId === s.stationId).map((w) => (
                            <Badge key={w.workstationId} variant="outline" className="font-mono text-[10px] text-slate-500">
                              {w.workstationCode} {w.name}（{w.processCode}）
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!lineDialog} onOpenChange={(o) => !o && setLineDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lineDialog?.lineId ? '编辑产线' : '新增产线'}</DialogTitle>
            <DialogDescription>编码创建后不可修改，变更通过别名或映射实现</DialogDescription>
          </DialogHeader>
          {lineDialog && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500">产线编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={lineDialog.lineCode ?? ''} disabled={!!lineDialog.lineId}
                  onChange={(e) => setLineDialog({ ...lineDialog, lineCode: e.target.value })} placeholder="L04" />
              </div>
              <div>
                <div className="text-xs text-slate-500">名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={lineDialog.name ?? ''} onChange={(e) => setLineDialog({ ...lineDialog, name: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">所属工厂</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={lineDialog.factoryId}
                  onChange={(e) => setLineDialog({ ...lineDialog, factoryId: e.target.value })}>
                  {factories.map((f) => <option key={f.factoryId} value={f.factoryId}>{f.name}（{f.factoryCode}）</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineDialog(null)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveLine}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
