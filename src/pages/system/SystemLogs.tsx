import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { systemApi } from '@/services/mock'
import type { SystemLog } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

const LEVEL_META: Record<SystemLog['level'], { label: string; badge: string }> = {
  INFO: { label: 'INFO', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  WARN: { label: 'WARN', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ERROR: { label: 'ERROR', badge: 'bg-red-50 text-red-700 border-red-200' },
  DEBUG: { label: 'DEBUG', badge: 'bg-slate-50 text-slate-400 border-slate-100' },
}

/** 系统日志（8.4）：运行/通信/接口/指令/配置变更/审计日志，脱敏要求 */
export default function SystemLogs() {
  const [list, setList] = useState<SystemLog[]>([])
  const [keyword, setKeyword] = useState('')
  const [level, setLevel] = useState('')
  const [service, setService] = useState('')

  const load = () => {
    void systemApi.listLogs({ keyword, level: level || undefined, service: service || undefined }).then(setList)
  }
  useEffect(load, [keyword, level, service])

  const services = [...new Set(list.map((l) => l.service))]

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="系统日志"
          description="系统运行 / 设备通信 / 采集任务 / 接口摘要 / 指令下发 / 配置变更 / 用户操作审计；禁止记录密码、Token 明文与私钥"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索内容 / 操作 / requestId…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">全部级别</option>
            {Object.entries(LEVEL_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">全部服务</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">时间</th>
                <th className="px-5 py-3 font-medium">级别</th>
                <th className="px-5 py-3 font-medium">服务 / 模块</th>
                <th className="px-5 py-3 font-medium">操作</th>
                <th className="px-5 py-3 font-medium">用户 / requestId</th>
                <th className="px-5 py-3 font-medium">耗时</th>
                <th className="px-5 py-3 font-medium">结果 / 内容</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((l) => (
                <tr key={l.logId} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{l.timestamp}</td>
                  <td className="px-5 py-3"><Badge variant="outline" className={LEVEL_META[l.level].badge}>{LEVEL_META[l.level].label}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">{l.service}</div>
                    <div className="text-[11px] text-slate-400">{l.module}</div>
                  </td>
                  <td className="px-5 py-3 text-xs">{l.operation}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {l.userId ?? '—'}
                    {l.requestId && <div className="font-mono text-[11px] text-slate-400">{l.requestId}</div>}
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-400">{l.durationMs != null ? `${l.durationMs}ms` : '—'}</td>
                  <td className="max-w-80 px-5 py-3 text-xs">
                    <span className={l.result === '失败' ? 'text-red-500' : 'text-emerald-600'}>{l.result}</span>
                    <span className="ml-2 text-slate-500">{l.message}</span>
                    {l.errorCode && <span className="ml-1 font-mono text-[11px] text-red-400">({l.errorCode})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
    </AppLayout>
  )
}
