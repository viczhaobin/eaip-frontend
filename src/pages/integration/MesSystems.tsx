import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { integrationApi } from '@/services/mock'
import type { MesSystem } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

/** MES 系统（F6.1）：外部系统连接配置与健康检查 */
export default function MesSystems() {
  const [list, setList] = useState<MesSystem[]>([])

  useEffect(() => {
    void integrationApi.listMesSystems().then(setList)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="MES 系统"
          description="MES/WMS/AGV 调度系统连接配置；对接优先级：官方 API → 消息队列/MQTT → OPC UA → 文件交换 → 数据库（仅授权例外）"
        /></StickyPageHead>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {list.map((m) => (
            <div key={m.systemCode} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{m.systemName}</div>
                  <div className="mt-0.5 font-mono text-xs text-slate-400">{m.systemCode} · {m.interfaceVersion}</div>
                </div>
                <Badge variant="outline" className={m.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                  {m.status === 'HEALTHY' ? '健康' : '异常'}
                </Badge>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                <div className="truncate"><span className="text-slate-400">Base URL：</span><span className="font-mono">{m.baseUrl}</span></div>
                <div><span className="text-slate-400">认证：</span>{m.authenticationType}（凭证引用 {m.credentialRef}，掩码展示）</div>
                <div><span className="text-slate-400">超时/限流：</span>{m.timeoutMs}ms / {m.rateLimitPerMin} 每分钟</div>
                <div><span className="text-slate-400">重试：</span>{m.retryPolicy}</div>
                <div><span className="text-slate-400">健康检查：</span><span className="font-mono">{m.healthCheckPath}</span> · 时区 {m.timezone}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          每个客户项目建立接口映射配置，不在核心代码中写死客户字段；工单变更按版本比对，已开工工单关键字段变更按客户规则阻止或进入人工确认。
        </p>
      </div>
    </AppLayout>
  )
}
