import type {
  AdapterStatus, AlarmEventStatus, AlarmLevel, CommandStatus, EquipmentStatus,
  EquipmentType, MessageStatus, QualityCode, WorkOrderStatus, AgvTaskStatus, StationKind,
} from '@/types/domain'

/** 状态 → Badge 样式（视觉规范：颜色 + 文字同时呈现，不只靠颜色） */

export const QUALITY_META: Record<QualityCode, { label: string; badge: string; text: string }> = {
  GOOD: { label: 'GOOD 有效', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' },
  UNCERTAIN: { label: 'UNCERTAIN 不确定', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
  BAD: { label: 'BAD 无效', badge: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-600' },
  STALE: { label: 'STALE 过期', badge: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-600' },
  COMM_LOST: { label: 'COMM_LOST 通信中断', badge: 'bg-red-50 text-red-600 border-red-300', text: 'text-red-600' },
  NOT_CONFIGURED: { label: 'NOT_CONFIGURED 未配置', badge: 'bg-slate-100 text-slate-500 border-slate-200', text: 'text-slate-500' },
  OUT_OF_RANGE: { label: 'OUT_OF_RANGE 超范围', badge: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600' },
}

export const EQUIPMENT_STATUS_META: Record<EquipmentStatus, { label: string; badge: string; dot: string }> = {
  DISABLED: { label: '未启用', badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
  CONFIGURED: { label: '已配置', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  CONNECTING: { label: '连接中', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ONLINE: { label: '在线', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DEGRADED: { label: '降级', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  OFFLINE: { label: '离线', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  FAULT: { label: '故障', badge: 'bg-red-50 text-red-600 border-red-300', dot: 'bg-red-600' },
}

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  PLC: 'PLC', ROBOT: '机器人', CNC: 'CNC', METER: '仪表', SENSOR: '传感器', AGV: 'AGV', OTHER: '其他',
}

export const COMMAND_STATUS_META: Record<CommandStatus, { label: string; badge: string }> = {
  CREATED: { label: '已创建', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  VALIDATING: { label: '校验中', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  SENT: { label: '已发送', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RECEIVED: { label: '已接收', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  EXECUTING: { label: '执行中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUCCEEDED: { label: '成功', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: '失败', badge: 'bg-red-50 text-red-700 border-red-200' },
  TIMEOUT: { label: '超时', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export const MESSAGE_STATUS_META: Record<MessageStatus, { label: string; badge: string }> = {
  RECEIVED: { label: '已接收', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  VALIDATING: { label: '校验中', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  PENDING: { label: '待发送', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SENDING: { label: '发送中', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  SUCCESS: { label: '成功', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RETRYING: { label: '重试中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAILED: { label: '失败', badge: 'bg-red-50 text-red-700 border-red-200' },
  DEAD_LETTER: { label: '死信', badge: 'bg-red-50 text-red-600 border-red-300' },
  CANCELLED: { label: '已取消', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export const WORKORDER_STATUS_META: Record<WorkOrderStatus, { label: string; badge: string }> = {
  RECEIVED: { label: '已接收', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  VALIDATED: { label: '已校验', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  READY: { label: '就绪', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RELEASED: { label: '已下达', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  IN_PROGRESS: { label: '生产中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: '已完工', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: '已取消', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
  REJECTED: { label: '已拒绝', badge: 'bg-red-50 text-red-700 border-red-200' },
}

export const AGV_STATUS_META: Record<AgvTaskStatus, { label: string; badge: string }> = {
  CREATED: { label: '已创建', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  SUBMITTED: { label: '已提交', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED: { label: '已受理', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  DISPATCHED: { label: '已调度', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  MOVING: { label: '移动中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ARRIVED: { label: '已到站', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  HANDOVER: { label: '接驳中', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  COMPLETED: { label: '已完成', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: '失败', badge: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: '已取消', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export const ALARM_LEVEL_META: Record<AlarmLevel, { label: string; badge: string; text: string }> = {
  L1: { label: 'L1 紧急', badge: 'bg-red-50 text-red-700 border-red-300', text: 'text-red-600' },
  L2: { label: 'L2 严重', badge: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-600' },
  L3: { label: 'L3 一般', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
  L4: { label: 'L4 提示', badge: 'bg-slate-100 text-slate-500 border-slate-200', text: 'text-slate-500' },
}

export const ALARM_EVENT_STATUS_META: Record<AlarmEventStatus, { label: string; badge: string }> = {
  ACTIVE: { label: '发生中', badge: 'bg-red-50 text-red-700 border-red-300' },
  ACKNOWLEDGED: { label: '已确认', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  PROCESSING: { label: '处理中', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  RECOVERED: { label: '已恢复', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED: { label: '已关闭', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
  ESCALATED: { label: '已升级', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  REOPENED: { label: '已重开', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  SUPPRESSED: { label: '已抑制', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
  CANCELLED: { label: '已取消', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
}

export const ADAPTER_STATUS_META: Record<AdapterStatus, { label: string; badge: string }> = {
  '未配置': { label: '未配置', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
  '已配置': { label: '已配置', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  '测试中': { label: '测试中', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  '已连接': { label: '已连接', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  '运行中': { label: '运行中', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '异常': { label: '异常', badge: 'bg-red-50 text-red-700 border-red-200' },
  '已停用': { label: '已停用', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
}

export const STATION_KIND_META: Record<StationKind, { label: string; badge: string }> = {
  MASTER: { label: '总站', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SUB_STATION: { label: '分站', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  EDGE_NODE: { label: '边缘节点', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
}

export const REPORT_STATUS_META: Record<'PENDING' | 'SENDING' | 'SUCCESS' | 'RETRYING' | 'FAILED' | 'DEAD_LETTER', { label: string; badge: string }> = {
  PENDING: { label: '待发送', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SENDING: { label: '发送中', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  SUCCESS: { label: '成功', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RETRYING: { label: '重试中', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAILED: { label: '失败', badge: 'bg-red-50 text-red-700 border-red-200' },
  DEAD_LETTER: { label: '死信', badge: 'bg-red-50 text-red-600 border-red-300' },
}
