import {
  Activity, Archive, ArrowLeftRight, ArrowUpCircle, BadgeCheck, BarChart3, BellRing,
  Binary, Building2, ClipboardList, Cpu, Database, Factory, FileSpreadsheet, FileWarning,
  FlaskConical, Forklift, Gauge, GitBranch, HeartPulse, Inbox, KeyRound, LayoutDashboard,
  LayoutGrid, LayoutPanelTop, LineChart, Link2, ListChecks, ListTodo, Megaphone, Monitor, Network,
  PackageOpen, Plug, Presentation, Radio, Repeat, ScrollText, SearchCode,
  Send, SendHorizontal, ServerCog, Settings2, Share2, SlidersHorizontal, TabletSmartphone, Timer, Users,
  Webhook, Wrench,
  type LucideIcon,
} from 'lucide-react'

/** 附录 A 建议菜单结构 */
export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: '运行总览',
    items: [
      { to: '/overview/line', label: '产线总览', icon: LayoutDashboard },
      { to: '/overview/equipment', label: '设备状态', icon: Monitor },
      { to: '/overview/realtime', label: '实时数据', icon: Activity },
      { to: '/overview/system', label: '系统运行状态', icon: HeartPulse },
    ],
  },
  {
    label: '设备采控',
    items: [
      { to: '/device/equipments', label: '设备台账', icon: Cpu },
      { to: '/device/drivers', label: '驱动管理', icon: PackageOpen },
      { to: '/device/connections', label: '设备连接', icon: Link2 },
      { to: '/device/tags', label: '点位管理', icon: Binary },
      { to: '/device/collect-tasks', label: '采集任务', icon: Timer },
      { to: '/device/monitor', label: '实时监控', icon: Gauge },
      { to: '/device/commands', label: '控制指令', icon: Send },
      { to: '/device/stations', label: '总站分站', icon: Network },
    ],
  },
  {
    label: '工业接口',
    items: [
      { to: '/interface/opcua', label: 'OPC UA 服务', icon: Share2 },
      { to: '/interface/api', label: 'API 管理', icon: Webhook },
      { to: '/interface/mqtt', label: 'MQTT 管理', icon: Radio },
      { to: '/interface/adapters', label: '数据适配器', icon: Plug },
      { to: '/interface/mappings', label: '字段映射', icon: ArrowLeftRight },
      { to: '/interface/routes', label: '路由规则', icon: GitBranch },
      { to: '/interface/messages', label: '消息监控', icon: Inbox },
      { to: '/interface/dead-letters', label: '死信队列', icon: FileWarning },
    ],
  },
  {
    label: '工业数据',
    items: [
      { to: '/data/realtime', label: '实时数据', icon: Activity },
      { to: '/data/history', label: '历史数据', icon: Database },
      { to: '/data/trends', label: '趋势分析', icon: LineChart },
      { to: '/data/production', label: '生产记录', icon: ClipboardList },
      { to: '/data/recipes', label: '工艺记录', icon: FlaskConical },
      { to: '/data/trace', label: '追溯查询', icon: SearchCode },
    ],
  },
  {
    label: '生产监控',
    items: [
      { to: '/scada/screens', label: '组态画面', icon: Presentation },
      { to: '/scada/equipment', label: '设备监控', icon: Monitor },
      { to: '/scada/line', label: '产线监控', icon: Factory },
      { to: '/scada/process', label: '工艺监控', icon: SlidersHorizontal },
      { to: '/scada/boards', label: '看板管理', icon: LayoutPanelTop },
    ],
  },
  {
    label: '异常管理',
    items: [
      { to: '/alarm/realtime', label: '实时报警', icon: BellRing },
      { to: '/alarm/rules', label: '异常规则', icon: ListChecks },
      { to: '/alarm/tickets', label: '异常处理', icon: Wrench },
      { to: '/alarm/policies', label: '通知策略', icon: Megaphone },
      { to: '/alarm/analysis', label: '异常分析', icon: BarChart3 },
    ],
  },
  {
    label: '业务集成',
    items: [
      { to: '/integration/mes', label: 'MES 系统', icon: ServerCog },
      { to: '/integration/workorders', label: '工单管理', icon: FileSpreadsheet },
      { to: '/integration/operations', label: '工序管控', icon: ListTodo },
      { to: '/integration/report', label: '生产上报', icon: SendHorizontal },
      { to: '/integration/quality', label: '质量数据', icon: BadgeCheck },
      { to: '/integration/agv', label: 'AGV 接口', icon: Forklift },
      { to: '/integration/tasks', label: '上报任务', icon: Repeat },
    ],
  },
  {
    label: '系统管理',
    items: [
      { to: '/system/org', label: '工厂/产线', icon: Building2 },
      { to: '/system/users', label: '组织/用户', icon: Users },
      { to: '/system/roles', label: '角色/权限', icon: KeyRound },
      { to: '/system/configs', label: '配置中心', icon: Settings2 },
      { to: '/system/logs', label: '系统日志', icon: ScrollText },
      { to: '/system/monitor', label: '运行监控', icon: Activity },
      { to: '/system/backup', label: '备份恢复', icon: Archive },
      { to: '/system/upgrade', label: '版本升级', icon: ArrowUpCircle },
    ],
  },
  {
    label: '终端大屏',
    items: [
      { to: '/hmi/agv-station', label: 'AGV调度工位HMI', icon: TabletSmartphone },
      { to: '/board/andon', label: 'Andon 看板', icon: BellRing },
      { to: '/board/inventory', label: '线边库存看板', icon: LayoutGrid },
      { to: '/board/agv', label: 'AGV 调度看板', icon: Forklift },
    ],
  },
]

export interface Crumb {
  label: string
  to?: string
}

/** 面包屑：按路由前缀匹配导航配置 */
export function crumbsFor(pathname: string): Crumb[] {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.to || (item.to !== '/' && pathname.startsWith(`${item.to}/`))) {
        return [{ label: group.label }, { label: item.label, to: item.to }]
      }
    }
  }
  return [{ label: 'EAIP' }]
}
