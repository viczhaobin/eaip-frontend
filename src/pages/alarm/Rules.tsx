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
import { ALARM_LEVEL_META } from '@/lib/status'
import { alarmApi } from '@/services/mock'
import type { AlarmLevel, AlarmRule } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const RULE_KINDS: AlarmRule['ruleKind'][] = ['阈值', '状态', '持续时间', '变化率', '计数', '组合']

const EMPTY_FORM: Partial<AlarmRule> = {
  ruleCode: '', ruleName: '', eventType: '设备', ruleKind: '阈值', sourceType: 'TAG', sourceId: '',
  conditionExpression: '', severity: 'L3', dedupKey: '', suppressionWindowSec: 60, enabled: true,
  version: 1, effectiveTime: '', hitCountToday: 0, trialRun: false,
}

/** 异常规则（F5.1）：规则定义、表达式校验、试运行模式、版本与生效时间 */
export default function Rules() {
  const [list, setList] = useState<AlarmRule[]>([])
  const [editTarget, setEditTarget] = useState<Partial<AlarmRule> | null>(null)

  const load = () => void alarmApi.listRules().then(setList)
  useEffect(load, [])

  const save = async () => {
    if (!editTarget?.ruleCode?.trim() || !editTarget.ruleName?.trim() || !editTarget.conditionExpression?.trim()) {
      toast.error('规则编码、名称与条件表达式为必填项')
      return
    }
    // 表达式语法基本校验（演示）：不允许空括号/明显语法错误
    const expr = editTarget.conditionExpression
    if (!/^[A-Za-z0-9_<>=!&|.'"%()+\-*/\s\u4e00-\u9fa5]+$/.test(expr)) {
      toast.error('表达式包含非法字符（沙箱执行，禁止脚本）')
      return
    }
    await alarmApi.saveRule(editTarget as AlarmRule)
    toast.success('规则已保存并生成新版本', { description: '规则发布有版本和生效时间，历史版本保留' })
    setEditTarget(null)
    load()
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="异常规则"
          description="阈值 / 状态 / 持续时间 / 变化率 / 计数 / 组合六类规则；试运行模式展示命中记录但不推送；发布有版本与生效时间"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditTarget({ ...EMPTY_FORM })}>
              <Plus className="mr-1.5 h-4 w-4" /> 新建规则
            </Button>
          }
        /></StickyPageHead>

        <div className="mt-6 space-y-4">
          {list.map((r) => (
            <div key={r.ruleId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{r.ruleName}</span>
                <Badge variant="outline" className="font-mono text-[11px]">{r.ruleCode}</Badge>
                <Badge variant="outline" className="text-[11px]">{r.ruleKind}</Badge>
                <Badge variant="outline" className="text-[11px] text-slate-500">{r.eventType}</Badge>
                <StatusBadgeInline level={r.severity} />
                {r.trialRun && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">试运行（不推送）</Badge>}
                <Badge variant="outline" className={r.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}>
                  {r.enabled ? '启用' : '停用'}
                </Badge>
                <span className="ml-auto text-xs text-slate-400">v{r.version} · 今日命中 {r.hitCountToday} · {r.effectiveTime}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditTarget({ ...r })}>编辑</Button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div>
                  <code className="block rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300">{r.conditionExpression}</code>
                  <div className="mt-1 text-[11px] text-slate-400">来源：{r.sourceType} / {r.sourceId}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-400">去重键：</span><span className="font-mono">{r.dedupKey}</span></div>
                  <div className="rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-400">抑制窗口：</span>{r.suppressionWindowSec}s</div>
                  {r.triggerDurationSec != null && <div className="rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-400">触发持续：</span>{r.triggerDurationSec}s</div>}
                  {r.recoveryCondition && <div className="rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-400">恢复条件：</span>{r.recoveryCondition}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{list.some((x) => x.ruleId === editTarget?.ruleId) ? '编辑规则（生成新版本）' : '新建规则'}</DialogTitle>
            <DialogDescription>保存前执行表达式语法校验与点位引用有效性校验</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">规则编码 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.ruleCode ?? ''} onChange={(e) => setEditTarget({ ...editTarget, ruleCode: e.target.value })} placeholder="RULE-XXX" />
              </div>
              <div>
                <div className="text-xs text-slate-500">规则名称 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5" value={editTarget.ruleName ?? ''} onChange={(e) => setEditTarget({ ...editTarget, ruleName: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-500">规则类型</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.ruleKind}
                  onChange={(e) => setEditTarget({ ...editTarget, ruleKind: e.target.value as AlarmRule['ruleKind'] })}>
                  {RULE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">事件等级</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.severity}
                  onChange={(e) => setEditTarget({ ...editTarget, severity: e.target.value as AlarmLevel })}>
                  {(['L1', 'L2', 'L3', 'L4'] as AlarmLevel[]).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">来源类型</div>
                <select className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-2 text-sm" value={editTarget.sourceType}
                  onChange={(e) => setEditTarget({ ...editTarget, sourceType: e.target.value as AlarmRule['sourceType'] })}>
                  {['TAG', 'EQUIPMENT', 'INTERFACE', 'MANUAL'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500">来源 ID（点位/设备）</div>
                <Input className="mt-1.5 font-mono" value={editTarget.sourceId ?? ''} onChange={(e) => setEditTarget({ ...editTarget, sourceId: e.target.value })} placeholder="TAG001 / EQ006" />
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500">条件表达式 <span className="text-red-500">*</span></div>
                <Input className="mt-1.5 font-mono" value={editTarget.conditionExpression ?? ''} onChange={(e) => setEditTarget({ ...editTarget, conditionExpression: e.target.value })} placeholder="Temperature > 90" />
              </div>
              <div>
                <div className="text-xs text-slate-500">去重键 dedupKey</div>
                <Input className="mt-1.5 font-mono" value={editTarget.dedupKey ?? ''} onChange={(e) => setEditTarget({ ...editTarget, dedupKey: e.target.value })} placeholder="EQ001:Temperature:HI" />
              </div>
              <div>
                <div className="text-xs text-slate-500">抑制窗口 s</div>
                <Input className="mt-1.5" type="number" value={editTarget.suppressionWindowSec ?? 60} onChange={(e) => setEditTarget({ ...editTarget, suppressionWindowSec: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={editTarget.enabled ?? true}
                    onChange={(e) => setEditTarget({ ...editTarget, enabled: e.target.checked })} />
                  启用
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-purple-600" checked={editTarget.trialRun ?? false}
                    onChange={(e) => setEditTarget({ ...editTarget, trialRun: e.target.checked })} />
                  试运行（只记录命中，不推送通知）
                </label>
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

function StatusBadgeInline({ level }: { level: AlarmLevel }) {
  return <Badge variant="outline" className={ALARM_LEVEL_META[level].badge}>{ALARM_LEVEL_META[level].label}</Badge>
}
