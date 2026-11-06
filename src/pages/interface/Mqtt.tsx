import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { interfaceApi } from '@/services/mock'
import type { MqttConfig } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** MQTT 管理（F2.3）：Broker 连接、Topic 前缀、QoS 与积压监控 */
export default function Mqtt() {
  const [list, setList] = useState<MqttConfig[]>([])

  useEffect(() => {
    void interfaceApi.listMqtt().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="MQTT 管理"
          description="Topic 规范：eaip/{factory}/{line}/{station}/{equipment}/{messageType}；关键业务事件至少 QoS 1 并实现业务幂等"
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {list.map((m) => (
            <div key={m.brokerId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-slate-400">{m.brokerAddress}:{m.port}</div>
                </div>
                <Badge variant="outline" className={m.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                  {m.status === 'CONNECTED' ? '已连接' : '已断开'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><span className="text-slate-400">Client ID：</span><span className="font-mono">{m.clientId}</span></div>
                <div><span className="text-slate-400">默认 QoS：</span>QoS {m.defaultQos}</div>
                <div><span className="text-slate-400">TLS：</span>{m.tlsEnabled ? '启用' : '未启用'}</div>
                <div><span className="text-slate-400">Topic 前缀：</span><span className="font-mono">{m.topicPrefix}</span></div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-center text-xs">
                <div>
                  <div className="text-slate-400">消息入</div>
                  <div className="mt-0.5 font-semibold tabular-nums">{m.messagesIn.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">消息出</div>
                  <div className="mt-0.5 font-semibold tabular-nums">{m.messagesOut.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">本地积压</div>
                  <div className={`mt-0.5 font-semibold tabular-nums ${m.backlog > 0 ? 'text-amber-600' : ''}`}>{m.backlog}</div>
                </div>
              </div>

              {m.lastError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50/70 px-3 py-2 text-xs text-red-700">
                  {m.lastError}（Broker 不可用时写入本地持久化队列并告警）
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-500">
          <div className="mb-2 font-medium text-slate-700">消息类型约定</div>
          <div className="grid gap-1 md:grid-cols-5">
            <div><code className="rounded bg-slate-100 px-1 font-mono">telemetry</code> 周期/变化数据</div>
            <div><code className="rounded bg-slate-100 px-1 font-mono">event</code> 设备/业务事件</div>
            <div><code className="rounded bg-slate-100 px-1 font-mono">command</code> 下行指令</div>
            <div><code className="rounded bg-slate-100 px-1 font-mono">ack</code> 指令/消息确认</div>
            <div><code className="rounded bg-slate-100 px-1 font-mono">status</code> 节点在线状态</div>
          </div>
          <p className="mt-2">Retained 消息仅用于适合保留的最新状态；消息需带 messageId、eventTime、schemaVersion；Topic ACL 控制发布与订阅范围。</p>
        </div>
      </div>
    </AppLayout>
  )
}
