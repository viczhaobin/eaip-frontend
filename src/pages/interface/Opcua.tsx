import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { interfaceApi } from '@/services/mock'
import type { OpcUaClientConf, OpcUaServerConf } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** OPC UA 服务（F2.1）：Server 配置 + 客户端连接列表 + Client 连接监控 */
export default function Opcua() {
  const [servers, setServers] = useState<OpcUaServerConf[]>([])
  const [clients, setClients] = useState<OpcUaClientConf[]>([])

  useEffect(() => {
    void interfaceApi.listOpcServers().then(setServers)
    void interfaceApi.listOpcClients().then(setClients)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="OPC UA 服务"
          description="北向 OPC UA Server（设备模型 → AddressSpace）与南向 OPC UA Client 连接；Write 仅对授权点位开放"
        /></StickyPageHead>

        {/* OPC UA Server */}
        {servers.map((s) => (
          <div key={s.serverId} className="mt-6 rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-sm font-semibold">{s.name}</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{s.endpoint}:{s.port}</code>
              </div>
              <Badge variant="outline" className={s.status === 'RUNNING' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                {s.status === 'RUNNING' ? '运行中' : '已停止'}
              </Badge>
            </div>
            <div className="grid gap-4 px-5 py-4 text-xs md:grid-cols-4">
              <div><div className="text-slate-400">应用 URI</div><div className="mt-1 font-mono">{s.appUri}</div></div>
              <div><div className="text-slate-400">安全策略 / 模式</div><div className="mt-1">{s.securityPolicy} / {s.securityMode}</div></div>
              <div><div className="text-slate-400">用户认证</div><div className="mt-1">{s.authMode}</div></div>
              <div><div className="text-slate-400">允许网络 / Namespace</div><div className="mt-1">{s.allowNetworks} / {s.namespaceCount} 个</div></div>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <div className="mb-2 text-xs font-medium text-slate-500">客户端连接（断开后自动释放订阅资源）</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="py-1.5 font-medium">Client URI</th>
                    <th className="py-1.5 font-medium">用户</th>
                    <th className="py-1.5 font-medium">连接时间</th>
                    <th className="py-1.5 font-medium">订阅数</th>
                    <th className="py-1.5 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {s.clients.map((c) => (
                    <tr key={c.clientUri}>
                      <td className="py-2 font-mono text-xs">{c.clientUri}</td>
                      <td className="py-2 text-xs">{c.user}</td>
                      <td className="py-2 text-xs text-slate-400">{c.connectedAt}</td>
                      <td className="py-2 text-xs tabular-nums">{c.subscriptions}</td>
                      <td className="py-2">
                        <Badge variant="outline" className={c.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}>
                          {c.status === 'CONNECTED' ? '已连接' : '已断开'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* OPC UA Client 连接 */}
        <h2 className="mt-8 text-sm font-semibold">OPC UA Client 连接（南向）</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">连接</th>
                <th className="px-5 py-3 font-medium">Endpoint</th>
                <th className="px-5 py-3 font-medium">安全策略</th>
                <th className="px-5 py-3 font-medium">已映射点位</th>
                <th className="px-5 py-3 font-medium">重连次数</th>
                <th className="px-5 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map((c) => (
                <tr key={c.clientId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.authMode}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{c.endpoint}</td>
                  <td className="px-5 py-3 text-xs">{c.securityPolicy}</td>
                  <td className="px-5 py-3 text-xs tabular-nums">{c.mappedTagCount}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-slate-500">{c.reconnectCount}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={
                      c.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : c.status === 'CONNECTING' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }>
                      {c.status === 'CONNECTED' ? '已连接' : c.status === 'CONNECTING' ? '连接中' : '已断开'}
                    </Badge>
                    {c.lastError && <div className="mt-1 text-[11px] text-red-500">{c.lastError}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
