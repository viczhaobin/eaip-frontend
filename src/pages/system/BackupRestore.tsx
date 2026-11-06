import { useEffect, useState } from 'react'
import { Archive, RotateCcw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/page-header'
import { systemApi } from '@/services/mock'
import type { BackupRecord } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 备份恢复（8.5）：数据库/配置包/证书备份，校验与按点恢复 */
export default function BackupRestore() {
  const [list, setList] = useState<BackupRecord[]>([])
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null)

  useEffect(() => {
    void systemApi.listBackups().then(setList)
  }, [])

  const doRestore = () => {
    toast.success(`已按备份点 ${restoreTarget?.backupId} 发起恢复（模拟）`, {
      description: '恢复前检查版本兼容、磁盘空间与迁移条件；升级失败可回滚应用版本',
    })
    setRestoreTarget(null)
  }

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="备份恢复"
          description="数据库定时备份、配置包与证书密钥按安全策略备份；备份结果校验和告警；支持按备份点恢复"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.success('已触发立即备份（模拟）', { description: '备份完成自动校验并告警' })}>
              <Archive className="mr-1.5 h-4 w-4" /> 立即备份
            </Button>
          }
        /></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">备份点</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium">大小</th>
                <th className="px-5 py-3 font-medium">创建时间 / 创建人</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">校验</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map((b) => (
                <tr key={b.backupId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs">{b.backupId}</td>
                  <td className="px-5 py-3 text-xs">{b.type}</td>
                  <td className="px-5 py-3 text-xs tabular-nums">{b.sizeMb > 0 ? `${b.sizeMb} MB` : '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {b.createdAt}<div className="mt-0.5 text-slate-400">{b.createdBy}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={b.status === '成功' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-xs">{b.verified ? <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" />已校验</span> : <span className="text-slate-400">未校验</span>}</td>
                  <td className="px-5 py-3 text-right">
                    {b.status === '成功' && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setRestoreTarget(b)}>
                        <RotateCcw className="h-3.5 w-3.5" /> 恢复
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>按备份点 {restoreTarget?.backupId} 恢复</DialogTitle>
            <DialogDescription>
              恢复前将检查版本兼容、磁盘空间与数据库迁移条件；恢复操作会记录审计。确认继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>取消</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={doRestore}>确认恢复</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
