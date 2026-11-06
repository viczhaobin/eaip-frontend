import { useEffect, useState } from 'react'
import { ArrowDownCircle, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { systemApi } from '@/services/mock'
import type { VersionRecord } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** 版本升级（8.5）：离线安装包、校验值、升级检查与回滚 */
export default function VersionUpgrade() {
  const [list, setList] = useState<VersionRecord[]>([])

  useEffect(() => {
    void systemApi.listVersions().then(setList)
  }, [])

  const upgrade = () => toast.info('升级前检查：版本兼容、磁盘空间、数据库迁移条件（离线安装包适配无互联网工厂网络）')
  const rollback = () => toast.success('已回滚到上一可用版本（模拟）', { description: '记录安装包版本、校验值、安装人和安装时间' })

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="版本升级"
          description="离线安装包部署；升级前检查版本兼容/磁盘空间/迁移条件，失败可回滚；数据库迁移可追踪"
          actions={
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={upgrade}>
              <Upload className="mr-1.5 h-4 w-4" /> 上传离线安装包
            </Button>
          }
        /></StickyPageHead>

        <div className="mt-6 space-y-4">
          {list.map((v) => (
            <div key={v.version} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <ArrowDownCircle className={`h-5 w-5 ${v.channel === '当前版本' ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="font-mono text-lg font-semibold">{v.version}</span>
                <Badge variant="outline" className={
                  v.channel === '当前版本' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : v.channel === '可回滚' ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                }>
                  {v.channel}
                </Badge>
                <span className="ml-auto text-xs text-slate-400">{v.installedAt} · {v.installedBy}</span>
                {v.channel === '可回滚' && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={rollback}>
                    <RotateCcw className="h-3.5 w-3.5" /> 回滚到此版本
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">{v.notes}</p>
              <code className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">{v.checksum}</code>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
