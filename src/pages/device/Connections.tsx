import { useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EQUIPMENT_STATUS_META } from '@/lib/status'
import { deviceApi } from '@/services/mock'
import type { Equipment } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'
import { Pager } from '@/components/common/pager'
import { usePaged } from '@/hooks/use-paged'

/** 设备连接：连接参数按驱动类型动态呈现（F1.1.3），状态巡检 */
export default function Connections() {
  const [list, setList] = useState<Equipment[]>([])
  const [keyword, setKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = () => {
    void deviceApi.listEquipments({ keyword }).then(setList)
  }
  useEffect(load, [keyword])

  const refresh = async () => {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 700))
    load()
    setRefreshing(false)
  }

  const connected = list.filter((e) => e.status === 'ONLINE').length

  const { paged, page, setPage, total, pageSize } = usePaged(list, 10)
  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="设备连接"
          description="按驱动类型动态校验连接参数；密码/密钥加密存储，页面回显掩码不返回明文"
          actions={
            <Button variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> 刷新状态
            </Button>
          }
        />

        <div className="mt-6 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索设备 / 地址…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <span className="text-xs text-slate-400">已连接 {connected} / {list.length} 台</span>
        </div></StickyPageHead>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">设备</th>
                <th className="px-5 py-3 font-medium">驱动协议</th>
                <th className="px-5 py-3 font-medium">连接参数</th>
                <th className="px-5 py-3 font-medium">超时 / 重试</th>
                <th className="px-5 py-3 font-medium">通信状态</th>
                <th className="px-5 py-3 font-medium">最近状态变化</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((e) => (
                <tr key={e.equipmentId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{e.equipmentName}</div>
                    <div className="font-mono text-xs text-slate-400">{e.equipmentCode}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{e.protocolDriverId}</td>
                  <td className="px-5 py-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{e.endpoint || '未配置'}</code>
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{e.connectionTimeoutMs}ms / {e.retryIntervalMs}ms</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge meta={EQUIPMENT_STATUS_META[e.status]} />
                      {e.controlMode !== '自动' && <span className="text-[11px] text-amber-600">{e.controlMode}模式</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">{e.lastStatusChangeAt ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<div className="mt-4"><Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>

        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-xs leading-relaxed text-indigo-800">
          相同连接参数重复使用时平台提示资源冲突，允许明确确认后共享连接；证书需校验有效期与信任状态；设备离线时在规定检测周期内更新状态并生成通信事件。
        </div>
      </div>
    </AppLayout>
  )
}
