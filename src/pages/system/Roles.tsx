import { useEffect, useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/common/page-header'
import { systemApi } from '@/services/mock'
import type { PermAction, SystemRole } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import { StickyPageHead } from '@/components/common/sticky-page-head'

const ACTIONS: { key: PermAction; label: string; highRisk?: boolean }[] = [
  { key: 'VIEW', label: '查看' },
  { key: 'CREATE', label: '新建' },
  { key: 'UPDATE', label: '更新' },
  { key: 'DELETE', label: '删除' },
  { key: 'PUBLISH', label: '发布' },
  { key: 'EXECUTE', label: '执行', highRisk: true },
  { key: 'EXPORT', label: '导出' },
  { key: 'ADMIN', label: '管理', highRisk: true },
]

const MODULES = ['设备采控', '工业接口', '工业数据', '生产监控', '异常管理', '业务集成', '系统管理'] as const

/**
 * 角色/权限（8.1）：RBAC 矩阵。值为演示用合理默认值：
 * 写 PLC（EXECUTE）、发布接口/修改报警规则/补传数据属于高风险权限。
 */
const MATRIX: Record<SystemRole, Record<(typeof MODULES)[number], PermAction[]>> = {
  '系统管理员': {
    设备采控: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
    工业接口: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
    工业数据: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
    生产监控: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
    异常管理: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
    业务集成: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
    系统管理: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT', 'ADMIN'],
  },
  '自动化工程师': {
    设备采控: ['VIEW', 'CREATE', 'UPDATE', 'PUBLISH', 'EXECUTE', 'EXPORT'],
    工业接口: ['VIEW', 'CREATE', 'UPDATE', 'PUBLISH', 'EXPORT'],
    工业数据: ['VIEW', 'EXPORT'],
    生产监控: ['VIEW', 'CREATE', 'UPDATE', 'PUBLISH'],
    异常管理: ['VIEW'],
    业务集成: ['VIEW'],
    系统管理: ['VIEW'],
  },
  '生产主管': {
    设备采控: ['VIEW'],
    工业接口: ['VIEW'],
    工业数据: ['VIEW', 'EXPORT'],
    生产监控: ['VIEW', 'CREATE', 'UPDATE', 'PUBLISH'],
    异常管理: ['VIEW', 'CREATE', 'UPDATE', 'EXECUTE'],
    业务集成: ['VIEW'],
    系统管理: ['VIEW'],
  },
  '设备维修人员': {
    设备采控: ['VIEW'],
    工业接口: [],
    工业数据: ['VIEW'],
    生产监控: ['VIEW'],
    异常管理: ['VIEW', 'UPDATE', 'EXECUTE'],
    业务集成: [],
    系统管理: [],
  },
  '操作员': {
    设备采控: ['VIEW'],
    工业接口: [],
    工业数据: ['VIEW'],
    生产监控: ['VIEW'],
    异常管理: ['VIEW', 'CREATE'],
    业务集成: [],
    系统管理: [],
  },
  '工艺工程师': {
    设备采控: ['VIEW'],
    工业接口: ['VIEW'],
    工业数据: ['VIEW', 'EXPORT'],
    生产监控: ['VIEW', 'UPDATE'],
    异常管理: ['VIEW'],
    业务集成: ['VIEW'],
    系统管理: [],
  },
  '集成管理员': {
    设备采控: ['VIEW'],
    工业接口: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXPORT'],
    工业数据: ['VIEW', 'EXPORT'],
    生产监控: [],
    异常管理: ['VIEW'],
    业务集成: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'EXPORT'],
    系统管理: ['VIEW'],
  },
  '只读访客': {
    设备采控: ['VIEW'],
    工业接口: ['VIEW'],
    工业数据: ['VIEW'],
    生产监控: ['VIEW'],
    异常管理: ['VIEW'],
    业务集成: [],
    系统管理: [],
  },
}

const ROLE_DESC: Record<SystemRole, string> = {
  '系统管理员': '平台配置、用户、权限和系统运维',
  '自动化工程师': '设备、驱动、点位和通信配置',
  '生产主管': '生产监控、异常分派和统计',
  '设备维修人员': '设备报警确认、维修处理',
  '操作员': '查看任务、执行授权业务操作、报障',
  '工艺工程师': '工艺参数、配方查看和授权变更',
  '集成管理员': 'MES、AGV、API 和消息接口配置',
  '只读访客': '只查看授权看板',
}

/** 角色/权限（8.1）：8 种内置角色的模块级 RBAC 矩阵 */
export default function Roles() {
  const [roles, setRoles] = useState<SystemRole[]>([])

  useEffect(() => {
    void systemApi.listRoles().then(setRoles)
  }, [])

  return (
    <AppLayout>
      <div className="px-8 py-8">
        <StickyPageHead><PageHeader
          title="角色 / 权限"
          description="RBAC 角色权限为基础，数据范围支持工厂/产线/站点/设备层级；高风险操作（写 PLC、发布接口、修改报警规则、补传数据）单独授权"
        /></StickyPageHead>

        {/* 角色说明卡 */}
        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {roles.map((r) => (
            <Card key={r}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{r}</Badge>
                  <span className="text-[11px] text-slate-400">
                    {Object.values(MATRIX[r]).flat().filter((a) => a === 'VIEW').length}/{MODULES.length} 模块可见
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{ROLE_DESC[r]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 权限矩阵 */}
        <h2 className="mt-8 text-sm font-semibold">模块权限矩阵</h2>
        <Card className="mt-3">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-400">
                  <th className="px-5 py-3 font-medium">模块</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="px-3 py-3 text-center font-medium">
                      {a.label}
                      {a.highRisk && <div className="mt-0.5 text-[10px] font-normal text-red-400">高风险</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MODULES.map((mod) => (
                  <tr key={mod} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium">{mod}</td>
                    {ACTIONS.map((a) => {
                      const grantees = roles.filter((r) => MATRIX[r][mod].includes(a.key))
                      return (
                        <td key={a.key} className="px-3 py-3 text-center" title={grantees.join('、') || '无角色持有'}>
                          {grantees.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                              <Check className="h-3.5 w-3.5" />{grantees.length}
                            </span>
                          ) : (
                            <Minus className="mx-auto h-3.5 w-3.5 text-slate-300" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <p className="mt-2 text-xs text-slate-400">悬停单元格查看持有该权限的角色；权限变更立即生效并记录审计</p>
      </div>
    </AppLayout>
  )
}
