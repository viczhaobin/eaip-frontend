/* Mock 数据层：EAIP 演示数据（确定性种子，便于演示与截图一致） */
import type {
  Adapter, AgvStationMapping, AgvTask, AlarmEvent, AlarmRule, ApiInterface, BackupRecord,
  Board, CollectTask, ConfigItem, ControlCommand, Driver, Equipment, Factory, FieldMapping,
  IntegrationMessage, MesSystem, MqttConfig, NotifyPolicy, OpcUaClientConf, OpcUaServerConf,
  OperationRecord, ProductionLine, ProductionRecord, QualityRecord, Recipe, ReportTask,
  RouteRule, ScadaScreen, ServiceHealth, StationNode, SystemLog, SystemRole, Tag, Ticket,
  UserAccount, VersionRecord, WorkOrder, Workstation, RecipeParameter,
} from '@/types/domain'
import type { TagValue } from '@/types/domain'

export const factories: Factory[] = [
  { factoryId: 'F01', factoryCode: 'F01', name: '一工厂', timezone: 'Asia/Shanghai', description: '总部工厂' },
  { factoryId: 'F02', factoryCode: 'F02', name: '二工厂', timezone: 'Asia/Shanghai' },
]

export const lines: ProductionLine[] = [
  { lineId: 'L01', lineCode: 'L01', factoryId: 'F01', name: '总装一线', description: '新能源电池包总装' },
  { lineId: 'L02', lineCode: 'L02', factoryId: 'F01', name: '总装二线' },
  { lineId: 'L03', lineCode: 'L03', factoryId: 'F02', name: '机加工线' },
]

export const stations: StationNode[] = [
  {
    stationId: 'ST01', stationCode: 'ST01', name: '一线总站', stationKind: 'MASTER', lineId: 'L01',
    endpoint: '10.128.0.10:7890', heartbeatIntervalSec: 10, offlineThreshold: 3,
    syncStrategy: '断网本地队列缓存，恢复后按序补传', enabled: true, status: 'ONLINE',
    softwareVersion: 'v1.0.0', configVersion: 'cfg-20261101', queueBacklog: 0,
    lastHeartbeatAt: '2026-11-06 09:59:50', registeredAt: '2026-10-01 08:00:00',
  },
  {
    stationId: 'ST02', stationCode: 'ST02', name: '一线分站-装配区', stationKind: 'SUB_STATION', lineId: 'L01',
    parentStationId: 'ST01', edgeAgentId: 'agent-st02', endpoint: '10.128.0.21:7891',
    heartbeatIntervalSec: 10, offlineThreshold: 3, syncStrategy: '断网本地队列缓存，恢复后按序补传',
    enabled: true, status: 'ONLINE', softwareVersion: 'v1.0.0', configVersion: 'cfg-20261101',
    queueBacklog: 12, lastHeartbeatAt: '2026-11-06 09:59:48', registeredAt: '2026-10-05 09:00:00',
  },
  {
    stationId: 'ST03', stationCode: 'ST03', name: '一线分站-检测区', stationKind: 'SUB_STATION', lineId: 'L01',
    parentStationId: 'ST01', edgeAgentId: 'agent-st03', endpoint: '10.128.0.22:7891',
    heartbeatIntervalSec: 10, offlineThreshold: 3, syncStrategy: '断网本地队列缓存，恢复后按序补传',
    enabled: true, status: 'RECOVERING', softwareVersion: 'v1.0.0', configVersion: 'cfg-20261028',
    queueBacklog: 356, lastHeartbeatAt: '2026-11-06 09:58:20', registeredAt: '2026-10-05 09:05:00',
  },
  {
    stationId: 'ST04', stationCode: 'ST04', name: '二线总站', stationKind: 'MASTER', lineId: 'L02',
    endpoint: '10.128.0.30:7890', heartbeatIntervalSec: 10, offlineThreshold: 3,
    syncStrategy: '断网本地队列缓存，恢复后按序补传', enabled: true, status: 'ONLINE',
    softwareVersion: 'v1.0.0', configVersion: 'cfg-20261101', queueBacklog: 0,
    lastHeartbeatAt: '2026-11-06 09:59:49', registeredAt: '2026-10-08 10:00:00',
  },
  {
    stationId: 'ST05', stationCode: 'ST05', name: '机加工边缘节点', stationKind: 'EDGE_NODE', lineId: 'L03',
    edgeAgentId: 'agent-st05', endpoint: '10.129.0.11:7892', heartbeatIntervalSec: 15, offlineThreshold: 3,
    syncStrategy: '按时间窗口批量补传', enabled: true, status: 'OFFLINE',
    softwareVersion: 'v0.9.8', configVersion: 'cfg-20261020', queueBacklog: 0,
    lastHeartbeatAt: '2026-11-06 06:12:03', registeredAt: '2026-10-10 14:00:00',
  },
]

export const workstations: Workstation[] = [
  { workstationId: 'WS010', workstationCode: 'WS010', stationId: 'ST02', processCode: 'PROC010', name: '电芯上料工位' },
  { workstationId: 'WS011', workstationCode: 'WS011', stationId: 'ST02', processCode: 'PROC020', name: '模组装配工位' },
  { workstationId: 'WS012', workstationCode: 'WS012', stationId: 'ST03', processCode: 'PROC030', name: '气密检测工位' },
  { workstationId: 'WS013', workstationCode: 'WS013', stationId: 'ST03', processCode: 'PROC040', name: 'EOL 测试工位' },
]

export const drivers: Driver[] = [
  { driverId: 'DRV01', name: 'Modbus TCP 驱动', protocol: 'Modbus TCP', version: '2.1.0', applicableTypes: ['PLC', 'METER', 'SENSOR'], status: 'RUNNING', connections: 4, errorCount: 2, lastHeartbeatAt: '2026-11-06 09:59:52', uptimeHours: 1523.4, installedAt: '2026-10-01' },
  { driverId: 'DRV02', name: 'Modbus RTU 驱动', protocol: 'Modbus RTU', version: '1.8.3', applicableTypes: ['METER', 'SENSOR'], status: 'RUNNING', connections: 2, errorCount: 0, lastHeartbeatAt: '2026-11-06 09:59:51', uptimeHours: 1523.4, installedAt: '2026-10-01' },
  { driverId: 'DRV03', name: 'OPC UA Client 驱动', protocol: 'OPC UA Client', version: '3.0.1', applicableTypes: ['PLC', 'ROBOT', 'CNC'], status: 'RUNNING', connections: 3, errorCount: 5, lastHeartbeatAt: '2026-11-06 09:59:52', uptimeHours: 1523.4, installedAt: '2026-10-01' },
  { driverId: 'DRV04', name: 'Siemens S7 驱动', protocol: 'Siemens S7', version: '2.4.0', applicableTypes: ['PLC'], status: 'RUNNING', connections: 3, errorCount: 1, lastHeartbeatAt: '2026-11-06 09:59:50', uptimeHours: 1523.4, installedAt: '2026-10-01' },
  { driverId: 'DRV05', name: 'MQTT Client 驱动', protocol: 'MQTT Client', version: '1.2.0', applicableTypes: ['SENSOR', 'AGV', 'OTHER'], status: 'STOPPED', connections: 0, errorCount: 0, uptimeHours: 0, installedAt: '2026-10-15' },
]

export const equipments: Equipment[] = [
  { equipmentId: 'EQ001', equipmentCode: 'EQ001', equipmentName: '上料 PLC-01', equipmentType: 'PLC', factoryId: 'F01', lineId: 'L01', stationId: 'ST02', brand: 'Siemens', model: 'S7-1200', protocolDriverId: 'DRV04', endpoint: '10.128.1.11:102', connectionTimeoutMs: 3000, retryIntervalMs: 5000, enabled: true, status: 'ONLINE', controlMode: '自动', lastStatusChangeAt: '2026-11-06 08:00:12', currentAlarmCount: 0, runMinutesToday: 112, downMinutesToday: 8, currentWorkOrder: 'WO20261106001', currentProduct: 'P001 电池包A型', outputToday: 86, cycleTimeSec: 45 },
  { equipmentId: 'EQ002', equipmentCode: 'EQ002', equipmentName: '装配 PLC-02', equipmentType: 'PLC', factoryId: 'F01', lineId: 'L01', stationId: 'ST02', brand: 'Siemens', model: 'S7-1500', protocolDriverId: 'DRV04', endpoint: '10.128.1.12:102', connectionTimeoutMs: 3000, retryIntervalMs: 5000, enabled: true, status: 'ONLINE', controlMode: '自动', lastStatusChangeAt: '2026-11-06 08:00:15', currentAlarmCount: 0, runMinutesToday: 115, downMinutesToday: 5, currentWorkOrder: 'WO20261106001', currentProduct: 'P001 电池包A型', outputToday: 86, cycleTimeSec: 45 },
  { equipmentId: 'EQ003', equipmentCode: 'EQ003', equipmentName: '气密检测仪', equipmentType: 'METER', factoryId: 'F01', lineId: 'L01', stationId: 'ST03', brand: 'Cosmo', model: 'LS-R740', protocolDriverId: 'DRV01', endpoint: '10.128.1.21:502', connectionTimeoutMs: 2000, retryIntervalMs: 5000, enabled: true, status: 'DEGRADED', controlMode: '自动', lastStatusChangeAt: '2026-11-06 09:12:40', currentAlarmCount: 1, runMinutesToday: 96, downMinutesToday: 24, currentWorkOrder: 'WO20261106001', currentProduct: 'P001 电池包A型', outputToday: 84, cycleTimeSec: 60 },
  { equipmentId: 'EQ004', equipmentCode: 'EQ004', equipmentName: 'EOL 测试 PLC', equipmentType: 'PLC', factoryId: 'F01', lineId: 'L01', stationId: 'ST03', brand: 'Siemens', model: 'S7-1200', protocolDriverId: 'DRV04', endpoint: '10.128.1.22:102', connectionTimeoutMs: 3000, retryIntervalMs: 5000, enabled: true, status: 'ONLINE', controlMode: '自动', lastStatusChangeAt: '2026-11-06 08:00:20', currentAlarmCount: 0, runMinutesToday: 118, downMinutesToday: 2, currentWorkOrder: 'WO20261106001', currentProduct: 'P001 电池包A型', outputToday: 82, cycleTimeSec: 90 },
  { equipmentId: 'EQ005', equipmentCode: 'EQ005', equipmentName: '焊接机器人 R01', equipmentType: 'ROBOT', factoryId: 'F01', lineId: 'L01', stationId: 'ST02', brand: 'FANUC', model: 'M-20iA', protocolDriverId: 'DRV03', endpoint: 'opc.tcp://10.128.1.31:4840', connectionTimeoutMs: 5000, retryIntervalMs: 10000, enabled: true, status: 'ONLINE', controlMode: '自动', lastStatusChangeAt: '2026-11-06 08:01:02', currentAlarmCount: 0, runMinutesToday: 110, downMinutesToday: 10, currentWorkOrder: 'WO20261106001', currentProduct: 'P001 电池包A型', outputToday: 86, cycleTimeSec: 45 },
  { equipmentId: 'EQ006', equipmentCode: 'EQ006', equipmentName: '贴标 CNC-01', equipmentType: 'CNC', factoryId: 'F01', lineId: 'L02', stationId: 'ST04', brand: 'Brother', model: 'S700X1', protocolDriverId: 'DRV03', endpoint: 'opc.tcp://10.128.2.11:4840', connectionTimeoutMs: 5000, retryIntervalMs: 10000, enabled: true, status: 'FAULT', controlMode: '手动', lastStatusChangeAt: '2026-11-06 09:47:33', currentAlarmCount: 3, runMinutesToday: 62, downMinutesToday: 58, outputToday: 41 },
  { equipmentId: 'EQ007', equipmentCode: 'EQ007', equipmentName: '温湿度传感器组', equipmentType: 'SENSOR', factoryId: 'F01', lineId: 'L01', stationId: 'ST02', brand: 'Siemens', model: 'SIRIUS', protocolDriverId: 'DRV01', endpoint: '10.128.1.41:502', connectionTimeoutMs: 2000, retryIntervalMs: 5000, enabled: true, status: 'ONLINE', controlMode: '自动', lastStatusChangeAt: '2026-11-06 08:00:30', currentAlarmCount: 0, runMinutesToday: 120, downMinutesToday: 0, outputToday: 0 },
  { equipmentId: 'EQ008', equipmentCode: 'EQ008', equipmentName: '产线 AGV-01', equipmentType: 'AGV', factoryId: 'F01', lineId: 'L01', stationId: 'ST01', brand: '海康', model: 'MR-Q3', protocolDriverId: 'DRV05', endpoint: 'mqtt://10.128.1.50:1883', connectionTimeoutMs: 3000, retryIntervalMs: 5000, enabled: false, status: 'DISABLED', controlMode: '本地', currentAlarmCount: 0, runMinutesToday: 0, downMinutesToday: 0, outputToday: 0 },
  { equipmentId: 'EQ009', equipmentCode: 'EQ009', equipmentName: '老线 PLC-legacy', equipmentType: 'PLC', factoryId: 'F02', lineId: 'L03', stationId: 'ST05', brand: 'Mitsubishi', model: 'FX5U', protocolDriverId: 'DRV01', endpoint: '10.129.1.11:502', connectionTimeoutMs: 5000, retryIntervalMs: 10000, enabled: true, status: 'OFFLINE', controlMode: '自动', lastStatusChangeAt: '2026-11-06 06:12:05', currentAlarmCount: 2, runMinutesToday: 0, downMinutesToday: 72, outputToday: 0 },
  { equipmentId: 'EQ010', equipmentCode: 'EQ010', equipmentName: '新购视觉相机', equipmentType: 'OTHER', factoryId: 'F01', lineId: 'L02', stationId: 'ST04', brand: 'Basler', model: 'acA2500', protocolDriverId: 'DRV01', endpoint: '', connectionTimeoutMs: 3000, retryIntervalMs: 5000, enabled: false, status: 'CONFIGURED', controlMode: '本地', description: '待安装，完成连接测试后启用', currentAlarmCount: 0, runMinutesToday: 0, downMinutesToday: 0, outputToday: 0 },
]

interface TagSeed {
  tag: Tag
  base: number
  amplitude: number
}

function tag(tagId: string, tagCode: string, tagName: string, equipmentId: string, address: string, dataType: Tag['dataType'], accessMode: Tag['accessMode'], unit: string | undefined, scanIntervalMs: number, extra?: Partial<Tag>): Tag {
  return {
    tagId, tagCode, tagName, equipmentId, address, dataType, accessMode, unit,
    scanIntervalMs, staleAfterMs: scanIntervalMs * 5, enabled: true,
    version: 3, updatedBy: 'admin', updatedAt: '2026-11-01 10:20:00', ...extra,
  }
}

export const tagSeeds: TagSeed[] = [
  { tag: tag('TAG001', 'Temperature', '温度', 'EQ001', 'DB1.DBW0', 'FLOAT', 'READ', 'degC', 1000, { minValue: 0, maxValue: 120 }), base: 62, amplitude: 8 },
  { tag: tag('TAG002', 'Pressure', '压力', 'EQ001', 'DB1.DBW2', 'FLOAT', 'READ', 'kPa', 1000, { minValue: 0, maxValue: 1000 }), base: 420, amplitude: 60 },
  { tag: tag('TAG003', 'MotorSpeed', '电机转速', 'EQ001', 'DB1.DBD4', 'INT32', 'READ_WRITE', 'rpm', 500, { writeWhitelist: true, writeAllowedRange: { min: 0, max: 3000 }, minValue: 0, maxValue: 3000 }), base: 1450, amplitude: 150 },
  { tag: tag('TAG004', 'AutoMode', '自动模式', 'EQ001', 'M0.0', 'BOOL', 'READ', undefined, 1000, { enumMap: { '0': '手动', '1': '自动' } }), base: 1, amplitude: 0 },
  { tag: tag('TAG005', 'CycleCount', '节拍计数', 'EQ002', 'DB2.DBD0', 'UINT32', 'READ', 'pcs', 1000), base: 86, amplitude: 1 },
  { tag: tag('TAG006', 'Torque', '拧紧扭矩', 'EQ002', 'DB2.DBD4', 'FLOAT', 'READ', 'Nm', 500, { minValue: 5, maxValue: 25 }), base: 12.5, amplitude: 1.2 },
  { tag: tag('TAG007', 'LeakRate', '泄漏率', 'EQ003', '40001', 'FLOAT', 'READ', 'Pa·m³/s', 2000, { minValue: 0, maxValue: 10 }), base: 2.1, amplitude: 1.6 },
  { tag: tag('TAG008', 'TestPressure', '测试压力', 'EQ003', '40003', 'FLOAT', 'READ', 'kPa', 2000, { minValue: 0, maxValue: 600 }), base: 350, amplitude: 40 },
  { tag: tag('TAG009', 'EolResult', 'EOL 结果', 'EQ004', 'DB10.DBW0', 'INT16', 'READ', undefined, 1000, { enumMap: { '0': '未测试', '1': '合格', '2': '不合格' } }), base: 1, amplitude: 0.6 },
  { tag: tag('TAG010', 'Voltage', '测试电压', 'EQ004', 'DB10.DBW2', 'FLOAT', 'READ', 'V', 1000, { minValue: 300, maxValue: 450 }), base: 380, amplitude: 12 },
  { tag: tag('TAG011', 'RobotStatus', '机器人状态', 'EQ005', 'ns=2;s=Robot.Status', 'INT16', 'READ', undefined, 1000, { enumMap: { '0': '待机', '1': '运行', '2': '报警', '3': '手动' } }), base: 1, amplitude: 0.4 },
  { tag: tag('TAG012', 'WeldCount', '焊接计数', 'EQ005', 'ns=2;s=Robot.WeldCount', 'UINT32', 'READ', 'pcs', 1000), base: 86, amplitude: 1 },
  { tag: tag('TAG013', 'SpindleSpeed', '主轴转速', 'EQ006', 'ns=2;s=CNC.Spindle', 'INT32', 'READ', 'rpm', 1000, { minValue: 0, maxValue: 12000 }), base: 0, amplitude: 4000 },
  { tag: tag('TAG014', 'Humidity', '湿度', 'EQ007', 'HR40001', 'FLOAT', 'READ', '%RH', 5000, { minValue: 10, maxValue: 90 }), base: 48, amplitude: 6 },
  { tag: tag('TAG015', 'RoomTemp', '环境温度', 'EQ007', 'HR40002', 'FLOAT', 'READ', 'degC', 5000, { minValue: -10, maxValue: 50 }), base: 24, amplitude: 2 },
  { tag: tag('TAG016', 'AlarmWord', '报警字', 'EQ009', 'D100', 'UINT16', 'READ', undefined, 2000), base: 2, amplitude: 1 },
]

export const tags: Tag[] = tagSeeds.map((s) => s.tag)

/** 实时值缓存：模拟漂移，由 tickRealtime 驱动 */
export const tagValues: TagValue[] = tagSeeds.map((s, i) => ({
  tagId: s.tag.tagId,
  value: formatValue(s.tag, s.base + wave(i, 0)),
  quality: s.tag.enabled ? 'GOOD' : 'NOT_CONFIGURED',
  sourceTimestamp: '2026-11-06 09:59:50',
  serverTimestamp: '2026-11-06 09:59:51',
  lastChangedAt: '2026-11-06 09:59:51',
}))

function wave(i: number, t: number): number {
  return Math.sin(i * 1.7 + t / 7) + Math.cos(i * 0.9 + t / 13) * 0.6
}

function formatValue(tagDef: Tag, num: number): number | string | boolean {
  if (tagDef.dataType === 'BOOL') return num >= 0.5
  if (tagDef.enumMap) {
    const keys = Object.keys(tagDef.enumMap).map(Number).sort((a, b) => a - b)
    return String(keys[Math.abs(Math.round(num)) % keys.length])
  }
  if (tagDef.dataType.startsWith('INT') || tagDef.dataType.startsWith('UINT')) return Math.max(0, Math.round(num))
  return Number(num.toFixed(2))
}

export { formatValue, wave }

export const collectTasks: CollectTask[] = [
  { taskId: 'CT01', name: '上料 PLC 周期采集', equipmentId: 'EQ001', tagCount: 4, mode: '周期采集', intervalMs: 1000, status: 'RUNNING', lastRunAt: '2026-11-06 09:59:51', nextRunAt: '2026-11-06 09:59:52', successRate: 99.8, queueDepth: 0, dropPolicy: '队列满记录告警，不静默丢数' },
  { taskId: 'CT02', name: '装配 PLC 高速采集', equipmentId: 'EQ002', tagCount: 2, mode: '周期采集', intervalMs: 500, status: 'RUNNING', lastRunAt: '2026-11-06 09:59:51', nextRunAt: '2026-11-06 09:59:52', successRate: 99.9, queueDepth: 0, dropPolicy: '队列满记录告警，不静默丢数' },
  { taskId: 'CT03', name: '气密仪变化采集', equipmentId: 'EQ003', tagCount: 2, mode: '变化采集', intervalMs: 2000, status: 'RUNNING', lastRunAt: '2026-11-06 09:59:50', nextRunAt: '2026-11-06 09:59:52', successRate: 96.2, queueDepth: 4, dropPolicy: '队列满记录告警，不静默丢数' },
  { taskId: 'CT04', name: '机器人 OPC 订阅', equipmentId: 'EQ005', tagCount: 2, mode: '变化采集', intervalMs: 1000, status: 'RUNNING', lastRunAt: '2026-11-06 09:59:51', nextRunAt: '2026-11-06 09:59:52', successRate: 99.7, queueDepth: 0, dropPolicy: '队列满记录告警，不静默丢数' },
  { taskId: 'CT05', name: 'EOL 完工触发批量读', equipmentId: 'EQ004', tagCount: 2, mode: '业务触发采集', intervalMs: 0, status: 'RUNNING', lastRunAt: '2026-11-06 09:58:10', successRate: 100, queueDepth: 0, dropPolicy: '队列满记录告警，不静默丢数' },
  { taskId: 'CT06', name: '老线 PLC 周期采集', equipmentId: 'EQ009', tagCount: 1, mode: '周期采集', intervalMs: 2000, status: 'PAUSED', lastRunAt: '2026-11-06 06:12:05', successRate: 0, queueDepth: 0, dropPolicy: '队列满记录告警，不静默丢数' },
]

export const commands: ControlCommand[] = [
  { commandId: 'CMD20261106001', equipmentId: 'EQ001', commandCode: 'START_REQUEST', parameters: {}, issuedBy: '张伟', issuedAt: '2026-11-06 08:00:10', expiresAt: '2026-11-06 08:05:10', status: 'SUCCEEDED', resultMessage: 'PLC 已执行启动' },
  { commandId: 'CMD20261106002', equipmentId: 'EQ002', commandCode: 'RECIPE_SELECT', parameters: { recipeCode: 'RC001', version: 'V3' }, issuedBy: '李芳', issuedAt: '2026-11-06 07:55:00', expiresAt: '2026-11-06 08:00:00', status: 'SUCCEEDED', resultMessage: '配方 V3 已切换' },
  { commandId: 'CMD20261106003', equipmentId: 'EQ006', commandCode: 'RESET_REQUEST', parameters: {}, issuedBy: '王强', issuedAt: '2026-11-06 09:48:12', expiresAt: '2026-11-06 09:53:12', status: 'FAILED', resultMessage: 'PLC 拒绝：设备处于手动模式，不满足联锁条件' },
  { commandId: 'CMD20261106004', equipmentId: 'EQ003', commandCode: 'PARAMETER_SET', parameters: { tag: 'TestPressure', value: '380' }, issuedBy: '李芳', issuedAt: '2026-11-06 09:30:00', expiresAt: '2026-11-06 09:35:00', status: 'SUCCEEDED', resultMessage: '参数已写入' },
  { commandId: 'CMD20261106005', equipmentId: 'EQ004', commandCode: 'STOP_REQUEST', parameters: {}, issuedBy: '系统(工单完工)', issuedAt: '2026-11-06 09:20:00', expiresAt: '2026-11-06 09:25:00', status: 'TIMEOUT', resultMessage: '分站无响应，禁止自动重发非幂等指令' },
]

/* ---------- 工业接口 ---------- */

export const opcUaServers: OpcUaServerConf[] = [
  {
    serverId: 'OPCS01', name: 'EAIP 北向 OPC UA Server', endpoint: 'opc.tcp://0.0.0.0', port: 4840,
    appUri: 'urn:eaip:server:f01', securityPolicy: 'Basic256Sha256', securityMode: 'SignAndEncrypt',
    authMode: '用户名密码', allowNetworks: '10.128.0.0/16', status: 'RUNNING', namespaceCount: 2,
    clients: [
      { clientUri: 'urn:mes:client:01', user: 'mes_svc', connectedAt: '2026-11-06 06:00:00', subscriptions: 12, status: 'CONNECTED' },
      { clientUri: 'urn:scada:client:02', user: 'scada_svc', connectedAt: '2026-11-06 08:00:00', subscriptions: 6, status: 'CONNECTED' },
      { clientUri: 'urn:old:client:09', user: 'legacy', connectedAt: '2026-11-05 22:10:00', subscriptions: 0, status: 'DISCONNECTED' },
    ],
  },
]

export const opcUaClients: OpcUaClientConf[] = [
  { clientId: 'OPCC01', name: '焊接机器人 OPC 连接', endpoint: 'opc.tcp://10.128.1.31:4840', securityPolicy: 'None', authMode: '匿名', mappedTagCount: 2, status: 'CONNECTED', reconnectCount: 0 },
  { clientId: 'OPCC02', name: 'CNC OPC 连接', endpoint: 'opc.tcp://10.128.2.11:4840', securityPolicy: 'Basic128Rsa15', authMode: '用户名密码', mappedTagCount: 1, status: 'DISCONNECTED', reconnectCount: 12, lastError: '证书不受信任，请导入到信任列表' },
  { clientId: 'OPCC03', name: '老线上位机 OPC 连接', endpoint: 'opc.tcp://10.129.1.11:4840', securityPolicy: 'None', authMode: '匿名', mappedTagCount: 1, status: 'CONNECTING', reconnectCount: 3 },
]

export const apiInterfaces: ApiInterface[] = [
  { interfaceCode: 'API-MES-WO', name: 'MES 工单接收', version: 'v1', direction: 'INBOUND', method: 'POST', path: '/api/v1/mes/work-orders', contentType: 'application/json', authType: 'API Key', timeoutMs: 5000, rateLimitPerMin: 120, idempotency: 'Idempotency-Key 请求头', enabled: true, calls: 156, successRate: 99.4, p95Ms: 210, owner: '集成管理员' },
  { interfaceCode: 'API-CHKIN', name: '工序进站校验', version: 'v1', direction: 'INBOUND', method: 'POST', path: '/api/v1/production/operations/check-in', contentType: 'application/json', authType: 'Token', timeoutMs: 2000, rateLimitPerMin: 600, idempotency: 'requestId 业务键', enabled: true, calls: 1240, successRate: 99.9, p95Ms: 45, owner: '集成管理员' },
  { interfaceCode: 'API-OP-COMPLETE', name: '工序完工上报', version: 'v1', direction: 'INBOUND', method: 'POST', path: '/api/v1/production/operations/complete', contentType: 'application/json', authType: 'Token', timeoutMs: 3000, rateLimitPerMin: 300, idempotency: '业务幂等键（工单+SN+工序）', enabled: true, calls: 812, successRate: 98.8, p95Ms: 120, owner: '集成管理员' },
  { interfaceCode: 'API-RT-QUERY', name: '设备实时值查询', version: 'v1', direction: 'INBOUND', method: 'GET', path: '/api/v1/equipment/{equipmentCode}/tags/realtime', contentType: 'application/json', authType: 'API Key', timeoutMs: 1000, rateLimitPerMin: 1200, idempotency: '只读接口', enabled: true, calls: 52310, successRate: 99.99, p95Ms: 18, owner: '自动化工程师' },
  { interfaceCode: 'API-QA-REPORT', name: '质量数据上报 MES', version: 'v1', direction: 'OUTBOUND', method: 'POST', path: '/mes/api/quality/report', contentType: 'application/json', authType: '双向TLS', timeoutMs: 5000, rateLimitPerMin: 60, idempotency: '业务幂等键', enabled: true, calls: 402, successRate: 97.5, p95Ms: 860, owner: '集成管理员' },
  { interfaceCode: 'API-AGV-CREATE', name: 'AGV 任务创建', version: 'v1', direction: 'INBOUND', method: 'POST', path: '/api/v1/logistics/tasks', contentType: 'application/json', authType: 'API Key', timeoutMs: 3000, rateLimitPerMin: 120, idempotency: 'businessTaskCode 幂等', enabled: false, calls: 0, successRate: 0, p95Ms: 0, owner: '集成管理员' },
]

export const mqttConfigs: MqttConfig[] = [
  { brokerId: 'MQTT01', name: '内部 Broker（北向）', brokerAddress: '10.128.0.5', port: 1883, clientId: 'eaip-server-01', username: 'eaip_svc', tlsEnabled: false, topicPrefix: 'eaip/F01/L01', defaultQos: 1, status: 'CONNECTED', messagesIn: 182340, messagesOut: 42012, backlog: 0 },
  { brokerId: 'MQTT02', name: 'AGV RCS Broker', brokerAddress: '10.128.1.50', port: 8883, clientId: 'eaip-agv-01', username: 'eaip_agv', tlsEnabled: true, topicPrefix: 'eaip/F01/L01', defaultQos: 1, status: 'DISCONNECTED', messagesIn: 0, messagesOut: 0, backlog: 26, lastError: 'Broker 连接超时（TLS 握手失败，检查证书有效期）' },
]

export const adapters: Adapter[] = [
  { adapterId: 'AD01', adapterCode: 'AD-HTTP-MES', adapterType: 'HTTP/REST Client', endpoint: 'https://mes.internal/api', credentialRef: 'cred-mes-tls', timeoutMs: 5000, retryPolicy: '指数退避，最大 5 次', healthStatus: 'HEALTHY', status: '运行中', lastSuccessAt: '2026-11-06 09:59:40' },
  { adapterId: 'AD02', adapterCode: 'AD-DB-REPORT', adapterType: '数据库', endpoint: 'jdbc:postgresql://10.128.0.8:5432/eaip_hist', credentialRef: 'cred-db-ro', timeoutMs: 8000, retryPolicy: '固定间隔 30s，最大 3 次', healthStatus: 'HEALTHY', status: '运行中', lastSuccessAt: '2026-11-06 09:59:45' },
  { adapterId: 'AD03', adapterCode: 'AD-FILE-EXCHANGE', adapterType: '文件', endpoint: '/data/exchange/mes', credentialRef: '-', timeoutMs: 0, retryPolicy: '人工重传', healthStatus: 'UNKNOWN', status: '已配置' },
  { adapterId: 'AD04', adapterCode: 'AD-WS-AGV', adapterType: 'WebSocket', endpoint: 'wss://10.128.1.50:443/rcs', credentialRef: 'cred-agv-token', timeoutMs: 3000, retryPolicy: '指数退避，最大 8 次', healthStatus: 'UNHEALTHY', status: '异常', lastError: '连接被拒绝，RCS 服务不可用' },
  { adapterId: 'AD05', adapterCode: 'AD-TCP-LEGACY', adapterType: 'TCP', endpoint: '10.129.1.20:9000', credentialRef: '-', timeoutMs: 5000, retryPolicy: '固定间隔 10s', healthStatus: 'UNKNOWN', status: '已停用' },
]

export const fieldMappings: FieldMapping[] = [
  { mappingId: 'FM01', name: 'MES 工单 → 内部工单', sourceSystem: 'MES', sourceObject: 'WorkOrder', targetSystem: 'EAIP', targetObject: 'WorkOrder', fieldCount: 12, transformSummary: '类型转换 ×6，时间时区转换 ×3，枚举映射 ×2，默认值 ×1', nullStrategy: '必填字段为空则拒绝', invalidStrategy: '记录字段级错误并整体拒绝', version: 'v1.3', effectiveTime: '2026-11-01 00:00:00', enabled: true },
  { mappingId: 'FM02', name: '内部完工 → MES 报工', sourceSystem: 'EAIP', sourceObject: 'ProductionRecord', targetSystem: 'MES', targetObject: 'OperationComplete', fieldCount: 15, transformSummary: '单位换算 ×2，字段派生 ×2，枚举映射 ×3', nullStrategy: '缺省字段填默认值', invalidStrategy: '记录字段级错误，允许部分上报', version: 'v1.1', effectiveTime: '2026-10-20 00:00:00', enabled: true },
  { mappingId: 'FM03', name: 'AGV RCS 状态 → 内部任务状态', sourceSystem: 'RCS', sourceObject: 'TaskStatus', targetSystem: 'EAIP', targetObject: 'AgvTask', fieldCount: 6, transformSummary: '枚举映射 ×6（保留原始状态值）', nullStrategy: '忽略空字段', invalidStrategy: '记录并跳过', version: 'v0.9', effectiveTime: '2026-11-05 00:00:00', enabled: true },
]

export const routeRules: RouteRule[] = [
  { ruleId: 'RR01', ruleCode: 'ROUTE-TELEMETRY', name: '遥测数据 → Historian + MES', messageType: 'telemetry', condition: '所有遥测消息', targets: ['Historian 存储', 'MQTT 北向', 'MES 订阅（按客户配置）'], enabled: true, lastTestAt: '2026-11-05 18:00:00', lastTestResult: '通过：输入 10 条，路由 10 条' },
  { ruleId: 'RR02', ruleCode: 'ROUTE-ALARM', name: '报警事件 → Andon + MES 事件', messageType: 'event', condition: "messageType='event' AND level IN ('L1','L2')", targets: ['Andon 事件中心', 'MQTT topic eaip/+/+/event'], enabled: true, lastTestAt: '2026-11-05 18:02:00', lastTestResult: '通过' },
  { ruleId: 'RR03', ruleCode: 'ROUTE-COMPLETE', name: '完工事件 → 生产上报任务', messageType: 'event', condition: "eventType='OPERATION_COMPLETE'", targets: ['上报任务 RT-COMPLETE', 'Historian 生产库'], enabled: true },
  { ruleId: 'RR04', ruleCode: 'ROUTE-AGV', name: 'AGV 状态 → 任务状态映射', messageType: 'event', condition: "source='AGV_RCS'", targets: ['AGV 任务管理'], enabled: false, lastTestResult: '待发布前模拟测试' },
]

const msgStatuses: IntegrationMessage['status'][] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'RETRYING', 'RETRYING', 'FAILED', 'DEAD_LETTER', 'PENDING', 'SENDING', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'RECEIVED', 'VALIDATING']

export const messages: IntegrationMessage[] = msgStatuses.map((s, i) => ({
  messageId: `MSG${String(20261106000 + i)}`,
  interfaceCode: ['API-MES-WO', 'API-OP-COMPLETE', 'API-QA-REPORT', 'API-RT-QUERY', 'API-CHKIN'][i % 5],
  businessKey: `WO20261106001-SN0000${10 + i}-PROC010-COMPLETE`,
  direction: i % 5 === 2 ? 'OUTBOUND' : 'INBOUND',
  status: s,
  retryCount: s === 'RETRYING' ? 2 : s === 'DEAD_LETTER' ? 6 : s === 'FAILED' ? 5 : 0,
  createdAt: `2026-11-06 09:${String(50 - i).padStart(2, '0')}:1${i % 10}`,
  updatedAt: `2026-11-06 09:${String(51 - i).padStart(2, '0')}:2${i % 10}`,
  lastError: ['FAILED', 'DEAD_LETTER'].includes(s) ? 'MES 接口超时（P95 860ms），超过最大重试次数' : s === 'RETRYING' ? '目标系统 503，等待下次重试' : undefined,
  payloadSummary: `{"workOrderCode":"WO20261106001","productSn":"SN0000${10 + i}","processCode":"PROC010"}`,
}))

/* ---------- 工业数据 ---------- */

export const productionRecords: ProductionRecord[] = [
  { recordId: 'PR001', workOrderId: 'WO001', workOrderCode: 'WO20261106001', productCode: 'P001', productSn: 'SN000001', lotNo: 'LOT202611A', lineId: 'L01', stationId: 'ST02', equipmentId: 'EQ002', processCode: 'PROC010', operationType: 'COMPLETE', startTime: '2026-11-06 08:05:12', endTime: '2026-11-06 08:06:02', inputQty: 1, goodQty: 1, defectQty: 0, operatorId: 'OP001', shiftCode: '早班', resultCode: 'OK', sourceSystem: 'PLC', eventId: 'EVT-PROC010-SN000001', mesReportStatus: 'SUCCESS' },
  { recordId: 'PR002', workOrderId: 'WO001', workOrderCode: 'WO20261106001', productCode: 'P001', productSn: 'SN000001', lotNo: 'LOT202611A', lineId: 'L01', stationId: 'ST02', equipmentId: 'EQ005', processCode: 'PROC020', operationType: 'COMPLETE', startTime: '2026-11-06 08:08:30', endTime: '2026-11-06 08:12:11', inputQty: 1, goodQty: 1, defectQty: 0, operatorId: 'OP001', shiftCode: '早班', resultCode: 'OK', sourceSystem: 'PLC', eventId: 'EVT-PROC020-SN000001', mesReportStatus: 'SUCCESS' },
  { recordId: 'PR003', workOrderId: 'WO001', workOrderCode: 'WO20261106001', productCode: 'P001', productSn: 'SN000001', lotNo: 'LOT202611A', lineId: 'L01', stationId: 'ST03', equipmentId: 'EQ003', processCode: 'PROC030', operationType: 'COMPLETE', startTime: '2026-11-06 08:15:00', endTime: '2026-11-06 08:16:40', inputQty: 1, goodQty: 1, defectQty: 0, operatorId: 'OP002', shiftCode: '早班', resultCode: 'OK', sourceSystem: 'PLC', eventId: 'EVT-PROC030-SN000001', mesReportStatus: 'SUCCESS' },
  { recordId: 'PR004', workOrderId: 'WO001', workOrderCode: 'WO20261106001', productCode: 'P001', productSn: 'SN000002', lotNo: 'LOT202611A', lineId: 'L01', stationId: 'ST02', equipmentId: 'EQ002', processCode: 'PROC010', operationType: 'COMPLETE', startTime: '2026-11-06 08:20:05', endTime: '2026-11-06 08:20:55', inputQty: 1, goodQty: 1, defectQty: 0, operatorId: 'OP001', shiftCode: '早班', resultCode: 'OK', sourceSystem: 'PLC', eventId: 'EVT-PROC010-SN000002', mesReportStatus: 'SUCCESS' },
  { recordId: 'PR005', workOrderId: 'WO001', workOrderCode: 'WO20261106001', productCode: 'P001', productSn: 'SN000003', lotNo: 'LOT202611A', lineId: 'L01', stationId: 'ST03', equipmentId: 'EQ004', processCode: 'PROC040', operationType: 'START', startTime: '2026-11-06 08:30:00', inputQty: 1, goodQty: 0, defectQty: 0, operatorId: 'OP003', shiftCode: '早班', resultCode: '-', sourceSystem: 'HMI', eventId: 'EVT-PROC040-SN000003', mesReportStatus: 'PENDING' },
  { recordId: 'PR006', workOrderId: 'WO002', workOrderCode: 'WO20261105002', productCode: 'P002', productSn: 'SN000101', lotNo: 'LOT202610Z', lineId: 'L02', stationId: 'ST04', equipmentId: 'EQ006', processCode: 'PROC050', operationType: 'COMPLETE', startTime: '2026-11-05 14:10:00', endTime: '2026-11-05 14:22:00', inputQty: 1, goodQty: 0, defectQty: 1, operatorId: 'OP004', shiftCode: '中班', resultCode: 'NG', sourceSystem: 'PLC', eventId: 'EVT-PROC050-SN000101', mesReportStatus: 'SUCCESS' },
  { recordId: 'PR007', workOrderId: 'WO001', workOrderCode: 'WO20261106001', productCode: 'P001', productSn: undefined, lotNo: 'LOT202611A', lineId: 'L01', stationId: 'ST02', equipmentId: 'EQ001', processCode: 'PROC010', operationType: 'PAUSE', startTime: '2026-11-06 09:00:00', inputQty: 0, goodQty: 0, defectQty: 0, operatorId: 'OP001', shiftCode: '早班', resultCode: '-', sourceSystem: 'HMI', eventId: 'EVT-PAUSE-01', mesReportStatus: 'SUCCESS' },
]

function rp(name: string, setValue: number, actual: number, upper?: number, lower?: number, unit?: string): RecipeParameter {
  return { name, setValue, actualValue: actual, upperLimit: upper, lowerLimit: lower, unit }
}

export const recipes: Recipe[] = [
  {
    recipeId: 'RC001', recipeCode: 'RC001', version: 'V3', processCode: 'PROC020', productCode: 'P001',
    status: '已发布', effectiveTime: '2026-11-01 00:00:00', source: 'EAIP',
    parameters: [
      rp('焊接电流', 220, 218.5, 240, 200, 'A'),
      rp('焊接电压', 24.5, 24.6, 26, 23, 'V'),
      rp('焊接时间', 3.2, 3.21, 3.5, 3.0, 's'),
      rp('保压时间', 1.5, 1.5, 2.0, 1.0, 's'),
      rp('气体流量', 15, 14.2, 18, 12, 'L/min'),
    ],
    updatedBy: '工艺工程师-李芳', updatedAt: '2026-11-01 09:30:00',
  },
  {
    recipeId: 'RC002', recipeCode: 'RC002', version: 'V1', processCode: 'PROC030', productCode: 'P001',
    status: '已发布', effectiveTime: '2026-10-15 00:00:00', source: 'MES同步',
    parameters: [
      rp('测试压力', 350, 352.4, 380, 320, 'kPa'),
      rp('稳压时间', 10, 10.1, 12, 8, 's'),
      rp('泄漏率上限', 5, 2.1, 5, 0, 'Pa·m³/s'),
    ],
    updatedBy: 'MES 同步', updatedAt: '2026-10-15 02:00:00',
  },
  {
    recipeId: 'RC003', recipeCode: 'RC003', version: 'V2', processCode: 'PROC040', productCode: 'P001',
    status: '草稿', source: 'EAIP',
    parameters: [
      rp('测试电压', 380, 0, 420, 350, 'V'),
      rp('绝缘电阻下限', 100, 0, undefined, 100, 'MΩ'),
    ],
    updatedBy: '工艺工程师-李芳', updatedAt: '2026-11-05 16:20:00',
  },
]

/* ---------- 生产监控 ---------- */

export const scadaScreens: ScadaScreen[] = [
  { screenId: 'SC01', name: '总装一线工艺画面', width: 1920, height: 1080, background: '#0f172a', gridEnabled: true, elementCount: 46, bindingValid: true, status: '已发布', version: 5, updatedBy: '自动化工程师-王强', updatedAt: '2026-11-04 15:00:00' },
  { screenId: 'SC02', name: '气密检测工位画面', width: 1366, height: 768, background: '#ffffff', gridEnabled: true, elementCount: 18, bindingValid: true, status: '已发布', version: 2, updatedBy: '自动化工程师-王强', updatedAt: '2026-10-28 11:30:00' },
  { screenId: 'SC03', name: 'AGV 接驳区画面', width: 1920, height: 1080, background: '#0f172a', gridEnabled: false, elementCount: 9, bindingValid: false, status: '草稿', version: 1, updatedBy: '自动化工程师-王强', updatedAt: '2026-11-06 10:00:00' },
]

export const boards: Board[] = [
  { boardId: 'BD01', name: '产线总览大屏', width: 3840, height: 1080, theme: '深色', refreshSeconds: 5, pages: 1, terminalBinding: '车间东侧大屏（TV-01）', accessMode: '匿名展示', status: '已发布', updatedAt: '2026-11-01 09:00:00' },
  { boardId: 'BD02', name: '设备状态看板', width: 1920, height: 1080, theme: '浅色', refreshSeconds: 3, pages: 2, terminalBinding: '维修间工控机（PC-03）', accessMode: '登录展示', status: '已发布', updatedAt: '2026-10-25 14:00:00' },
  { boardId: 'BD03', name: '异常 Andon 看板', width: 1920, height: 1080, theme: '深色', refreshSeconds: 2, pages: 1, terminalBinding: '未绑定', accessMode: '登录展示', status: '草稿', updatedAt: '2026-11-06 09:00:00' },
]

/* ---------- 异常管理 ---------- */

export const alarmRules: AlarmRule[] = [
  { ruleId: 'AR01', ruleCode: 'RULE-TEMP-HI', ruleName: '温度超限', eventType: '数据质量', ruleKind: '阈值', sourceType: 'TAG', sourceId: 'TAG001', conditionExpression: 'Temperature > 90', triggerDurationSec: 5, recoveryCondition: 'Temperature < 85', severity: 'L2', dedupKey: 'EQ001:Temperature:HI', suppressionWindowSec: 60, enabled: true, version: 2, effectiveTime: '2026-11-01 00:00:00', hitCountToday: 0, trialRun: false },
  { ruleId: 'AR02', ruleCode: 'RULE-LEAK-HI', ruleName: '泄漏率超限', eventType: '工艺', ruleKind: '阈值', sourceType: 'TAG', sourceId: 'TAG007', conditionExpression: 'LeakRate > 5', triggerDurationSec: 0, recoveryCondition: 'LeakRate <= 5', severity: 'L1', dedupKey: 'EQ003:LeakRate:HI', suppressionWindowSec: 30, enabled: true, version: 1, effectiveTime: '2026-10-20 00:00:00', hitCountToday: 2, trialRun: false },
  { ruleId: 'AR03', ruleCode: 'RULE-EQ-FAULT', ruleName: '设备故障状态', eventType: '设备', ruleKind: '状态', sourceType: 'EQUIPMENT', sourceId: 'EQ006', conditionExpression: "status == 'FAULT'", severity: 'L2', dedupKey: 'EQ006:FAULT', suppressionWindowSec: 0, enabled: true, version: 3, effectiveTime: '2026-10-01 00:00:00', hitCountToday: 3, trialRun: false },
  { ruleId: 'AR04', ruleCode: 'RULE-COMM-LOST', ruleName: '通信中断', eventType: '通信', ruleKind: '状态', sourceType: 'TAG', sourceId: '*', conditionExpression: "quality == 'COMM_LOST'", triggerDurationSec: 10, severity: 'L2', dedupKey: 'COMM:{equipmentCode}', suppressionWindowSec: 300, enabled: true, version: 1, effectiveTime: '2026-10-01 00:00:00', hitCountToday: 1, trialRun: false },
  { ruleId: 'AR05', ruleCode: 'RULE-SPEED-DEV', ruleName: '转速偏差持续', eventType: '设备', ruleKind: '持续时间', sourceType: 'TAG', sourceId: 'TAG003', conditionExpression: '|MotorSpeed - 1450| > 200', triggerDurationSec: 60, recoveryCondition: '|MotorSpeed - 1450| <= 200 持续 30s', severity: 'L3', dedupKey: 'EQ001:MotorSpeed:DEV', suppressionWindowSec: 600, enabled: true, version: 1, effectiveTime: '2026-11-03 00:00:00', hitCountToday: 0, trialRun: true },
  { ruleId: 'AR06', ruleCode: 'RULE-QA-FAIL-RATE', ruleName: '不良率计数', eventType: '质量', ruleKind: '计数', sourceType: 'EQUIPMENT', sourceId: 'EQ006', conditionExpression: "1h 内 resultCode='NG' 次数 > 3", severity: 'L3', dedupKey: 'EQ006:NG:COUNT', suppressionWindowSec: 3600, enabled: false, version: 1, effectiveTime: '2026-11-06 00:00:00', hitCountToday: 0, trialRun: true },
]

export const alarmEvents: AlarmEvent[] = [
  { eventId: 'EVT001', ruleCode: 'RULE-LEAK-HI', source: '气密检测仪', equipmentCode: 'EQ003', alarmCode: 'LEAK_HI', level: 'L1', status: 'PROCESSING', occurredAt: '2026-11-06 09:10:22', lastOccurredAt: '2026-11-06 09:10:22', acknowledgedBy: '王强', acknowledgedAt: '2026-11-06 09:11:05', occurrenceCount: 2, description: '泄漏率 6.8 超过上限 5 Pa·m³/s', dedupKey: 'EQ003:LeakRate:HI' },
  { eventId: 'EVT002', ruleCode: 'RULE-EQ-FAULT', source: '贴标 CNC-01', equipmentCode: 'EQ006', alarmCode: 'EQ_FAULT', level: 'L2', status: 'ACKNOWLEDGED', occurredAt: '2026-11-06 09:47:33', lastOccurredAt: '2026-11-06 09:47:33', acknowledgedBy: '赵磊', acknowledgedAt: '2026-11-06 09:49:10', occurrenceCount: 1, description: '设备进入故障状态：主轴驱动报警 E-204', dedupKey: 'EQ006:FAULT' },
  { eventId: 'EVT003', ruleCode: 'RULE-COMM-LOST', source: '老线 PLC-legacy', equipmentCode: 'EQ009', alarmCode: 'COMM_LOST', level: 'L2', status: 'ACTIVE', occurredAt: '2026-11-06 06:12:05', lastOccurredAt: '2026-11-06 06:12:05', occurrenceCount: 1, description: '通信中断超过 10s，最后心跳 06:12:03', dedupKey: 'COMM:EQ009' },
  { eventId: 'EVT004', ruleCode: 'RULE-TEMP-HI', source: '上料 PLC-01', equipmentCode: 'EQ001', alarmCode: 'TEMP_HI', level: 'L2', status: 'RECOVERED', occurredAt: '2026-11-05 22:30:11', lastOccurredAt: '2026-11-05 22:30:11', recoveredAt: '2026-11-05 22:36:40', acknowledgedBy: '王强', acknowledgedAt: '2026-11-05 22:31:00', occurrenceCount: 1, description: '温度 93.2 超过上限 90 degC', dedupKey: 'EQ001:Temperature:HI' },
  { eventId: 'EVT005', ruleCode: undefined, source: '人工报障', equipmentCode: 'EQ004', alarmCode: 'MANUAL-01', level: 'L3', status: 'CLOSED', occurredAt: '2026-11-05 15:02:00', lastOccurredAt: '2026-11-05 15:02:00', recoveredAt: '2026-11-05 15:20:00', closedAt: '2026-11-05 16:00:00', acknowledgedBy: '赵磊', acknowledgedAt: '2026-11-05 15:05:00', occurrenceCount: 1, description: 'EOL 工位扫码枪偶发无响应，已更换线缆', dedupKey: 'MANUAL:20261105-01' },
  { eventId: 'EVT006', ruleCode: 'RULE-SPEED-DEV', source: '上料 PLC-01', equipmentCode: 'EQ001', alarmCode: 'SPEED_DEV', level: 'L3', status: 'SUPPRESSED', occurredAt: '2026-11-06 07:58:00', lastOccurredAt: '2026-11-06 07:58:00', occurrenceCount: 1, description: '转速偏差（试运行模式，未推送通知）', dedupKey: 'EQ001:MotorSpeed:DEV' },
]

export const tickets: Ticket[] = [
  {
    ticketId: 'TK001', eventId: 'EVT001', title: '气密检测仪泄漏率超限处理', level: 'L1', category: '工艺',
    lineId: 'L01', stationId: 'ST03', equipmentId: 'EQ003', ownerId: '李芳', teamId: '工艺组', dueAt: '2026-11-06 09:25:00',
    status: '处理中', causeCode: 'SEAL-DEFECT', causeDescription: '待排查：密封圈磨损或夹具不到位',
    acknowledgedAt: '2026-11-06 09:11:05', startedAt: '2026-11-06 09:12:00', createdAt: '2026-11-06 09:10:30',
    timeline: [
      { at: '2026-11-06 09:10:30', actor: '系统', action: '按通知策略自动创建处理单' },
      { at: '2026-11-06 09:11:05', actor: '王强', action: '确认事件' },
      { at: '2026-11-06 09:12:00', actor: '李芳', action: '开始处理，初步判断密封圈问题' },
    ],
  },
  {
    ticketId: 'TK002', eventId: 'EVT002', title: 'CNC 主轴驱动报警维修', level: 'L2', category: '设备',
    lineId: 'L02', stationId: 'ST04', equipmentId: 'EQ006', ownerId: '赵磊', teamId: '维修组', dueAt: '2026-11-06 09:52:33',
    status: '待确认', acknowledgedAt: '2026-11-06 09:49:10', createdAt: '2026-11-06 09:47:40',
    timeline: [
      { at: '2026-11-06 09:47:40', actor: '系统', action: '按通知策略自动创建处理单' },
      { at: '2026-11-06 09:49:10', actor: '赵磊', action: '确认事件，准备现场检查' },
    ],
  },
  {
    ticketId: 'TK003', eventId: 'EVT005', title: 'EOL 扫码枪无响应', level: 'L3', category: '设备',
    lineId: 'L01', stationId: 'ST03', equipmentId: 'EQ004', ownerId: '赵磊', teamId: '维修组',
    status: '已关闭', causeCode: 'CABLE-LOOSE', causeDescription: '通讯线缆接触不良', actionDescription: '更换线缆并做 50 次扫码压测',
    acknowledgedAt: '2026-11-05 15:05:00', startedAt: '2026-11-05 15:10:00', recoveredAt: '2026-11-05 15:20:00',
    closedAt: '2026-11-05 16:00:00', closeReason: '现场验证通过', createdAt: '2026-11-05 15:02:10',
    timeline: [
      { at: '2026-11-05 15:02:10', actor: '系统', action: '人工创建处理单' },
      { at: '2026-11-05 15:10:00', actor: '赵磊', action: '开始处理' },
      { at: '2026-11-05 15:20:00', actor: '赵磊', action: '提交恢复：更换线缆' },
      { at: '2026-11-05 16:00:00', actor: '生产主管-张伟', action: '关闭处理单' },
    ],
  },
]

export const notifyPolicies: NotifyPolicy[] = [
  { policyId: 'NP01', policyCode: 'POL-L1', eventLevel: 'L1', channel: '声光Andon', receiverRule: '生产负责人 + 设备负责人', quietHours: '无', retryIntervalSec: 60, maxRetry: 5, escalationAfterSec: 300, escalationReceiver: '厂长', templateCode: 'TPL-L1', enabled: true, lastSendStatus: 'SENT' },
  { policyId: 'NP02', policyCode: 'POL-L1-IM', eventLevel: 'L1', channel: '企业微信', receiverRule: '值班工程师（按排班表）', quietHours: '无', retryIntervalSec: 120, maxRetry: 3, escalationAfterSec: 600, escalationReceiver: '生产负责人', templateCode: 'TPL-L1', enabled: true, lastSendStatus: 'SENT' },
  { policyId: 'NP03', policyCode: 'POL-L2', eventLevel: 'L2', channel: '企业微信', receiverRule: '班组长/主管', quietHours: '22:00-06:00', retryIntervalSec: 300, maxRetry: 3, escalationAfterSec: 1800, escalationReceiver: '生产负责人', templateCode: 'TPL-L2', enabled: true, lastSendStatus: 'SENT' },
  { policyId: 'NP04', policyCode: 'POL-L3', eventLevel: 'L3', channel: 'HMI弹窗', receiverRule: '专业责任人', quietHours: '无', retryIntervalSec: 600, maxRetry: 2, templateCode: 'TPL-L3', enabled: true, lastSendStatus: 'SENT' },
  { policyId: 'NP05', policyCode: 'POL-L4', eventLevel: 'L4', channel: 'HMI弹窗', receiverRule: '指定责任人', quietHours: '无', retryIntervalSec: 0, maxRetry: 0, templateCode: 'TPL-L4', enabled: false },
  { policyId: 'NP06', policyCode: 'POL-L2-SMS', eventLevel: 'L2', channel: '短信', receiverRule: '设备负责人', quietHours: '22:00-06:00', retryIntervalSec: 300, maxRetry: 2, escalationAfterSec: 3600, escalationReceiver: '厂长', templateCode: 'TPL-L2', enabled: true, lastSendStatus: 'FAILED' },
]

/* ---------- 业务集成 ---------- */

export const mesSystems: MesSystem[] = [
  { systemCode: 'MES-PRD', systemName: '生产 MES', baseUrl: 'https://mes.internal', authenticationType: '双向TLS', credentialRef: 'cred-mes-tls', timeoutMs: 5000, retryPolicy: '指数退避，最大 5 次', rateLimitPerMin: 120, interfaceVersion: 'v2.3', timezone: 'Asia/Shanghai', healthCheckPath: '/health', enabled: true, status: 'HEALTHY' },
  { systemCode: 'WMS-PRD', systemName: '仓储 WMS', baseUrl: 'https://wms.internal', authenticationType: 'API Key', credentialRef: 'cred-wms-key', timeoutMs: 8000, retryPolicy: '固定间隔 30s，最大 3 次', rateLimitPerMin: 60, interfaceVersion: 'v1.0', timezone: 'Asia/Shanghai', healthCheckPath: '/api/ping', enabled: true, status: 'HEALTHY' },
  { systemCode: 'AGV-RCS', systemName: 'AGV 调度 RCS', baseUrl: 'wss://10.128.1.50:443/rcs', authenticationType: 'Token', credentialRef: 'cred-agv-token', timeoutMs: 3000, retryPolicy: '指数退避，最大 8 次', rateLimitPerMin: 300, interfaceVersion: 'v3.1', timezone: 'Asia/Shanghai', healthCheckPath: '/ws/ping', enabled: true, status: 'UNHEALTHY' },
]

export const workOrders: WorkOrder[] = [
  { workOrderId: 'WO001', externalOrderCode: 'WO20261106001', productCode: 'P001', productName: '电池包A型', plannedQty: 100, completedQty: 86, goodQty: 84, defectQty: 2, priority: '高', plannedStart: '2026-11-06 08:00', plannedEnd: '2026-11-06 16:00', routeCode: 'ROUTE001', recipeCode: 'RC001', materialList: '电芯×96、模组外壳×1、Busbar×12', status: 'IN_PROGRESS', sourceSystem: 'MES-PRD', version: 2, receivedAt: '2026-11-06 06:12:00' },
  { workOrderId: 'WO002', externalOrderCode: 'WO20261105002', productCode: 'P002', productName: '控制柜B型', plannedQty: 40, completedQty: 40, goodQty: 39, defectQty: 1, priority: '中', plannedStart: '2026-11-05 14:00', plannedEnd: '2026-11-05 22:00', routeCode: 'ROUTE002', materialList: '柜体×1、PLC×1、线束×1套', status: 'COMPLETED', sourceSystem: 'MES-PRD', version: 1, receivedAt: '2026-11-05 10:00:00' },
  { workOrderId: 'WO003', externalOrderCode: 'WO20261106003', productCode: 'P003', productName: '传感器组件C', plannedQty: 200, completedQty: 0, goodQty: 0, defectQty: 0, priority: '低', plannedStart: '2026-11-07 08:00', plannedEnd: '2026-11-07 20:00', routeCode: 'ROUTE003', recipeCode: 'RC003', status: 'RELEASED', sourceSystem: 'MES-PRD', version: 1, receivedAt: '2026-11-06 07:30:00' },
  { workOrderId: 'WO004', externalOrderCode: 'WO20261106004', productCode: 'P004', productName: '试验品D（未定型）', plannedQty: 5, completedQty: 0, goodQty: 0, defectQty: 0, priority: '低', plannedStart: '2026-11-06 10:00', plannedEnd: '2026-11-06 12:00', routeCode: 'ROUTE009', status: 'REJECTED', sourceSystem: 'MES-PRD', version: 1, receivedAt: '2026-11-06 08:00:00' },
]

export const operationRecords: OperationRecord[] = [
  { operationRecordId: 'OPR00001', workOrderCode: 'WO20261106001', productSn: 'SN000001', processCode: 'PROC010', stationCode: 'ST02', equipmentCode: 'EQ002', operatorCode: 'OP001', checkinDecision: 'PASS', recipeCode: 'RC001', recipeVersion: 'V3', status: '已完工', startTime: '2026-11-06 08:05:12', endTime: '2026-11-06 08:06:02', goodQty: 1, defectQty: 0, mesReportStatus: 'SUCCESS' },
  { operationRecordId: 'OPR00002', workOrderCode: 'WO20261106001', productSn: 'SN000001', processCode: 'PROC020', stationCode: 'ST02', equipmentCode: 'EQ005', operatorCode: 'OP001', checkinDecision: 'PASS', recipeCode: 'RC001', recipeVersion: 'V3', status: '已完工', startTime: '2026-11-06 08:08:30', endTime: '2026-11-06 08:12:11', goodQty: 1, defectQty: 0, mesReportStatus: 'SUCCESS' },
  { operationRecordId: 'OPR00003', workOrderCode: 'WO20261106001', productSn: 'SN000002', processCode: 'PROC010', stationCode: 'ST02', equipmentCode: 'EQ002', operatorCode: 'OP001', checkinDecision: 'REJECT', reasonMessage: '前序工序 PROC010 已存在未结束记录（重复进站）', status: '在制', startTime: '2026-11-06 08:07:00', goodQty: 0, defectQty: 0, mesReportStatus: 'SUCCESS' },
  { operationRecordId: 'OPR00004', workOrderCode: 'WO20261106001', productSn: 'SN000001', processCode: 'PROC030', stationCode: 'ST03', equipmentCode: 'EQ003', operatorCode: 'OP002', checkinDecision: 'WARNING', reasonMessage: '配方版本 RC002/V1 与设备当前版本不一致，已授权确认', recipeCode: 'RC002', recipeVersion: 'V1', status: '暂停', pauseReason: '质量待判', startTime: '2026-11-06 08:15:00', goodQty: 0, defectQty: 0, mesReportStatus: 'PENDING' },
  { operationRecordId: 'OPR00005', workOrderCode: 'WO20261106001', productSn: 'SN000003', processCode: 'PROC040', stationCode: 'ST03', equipmentCode: 'EQ004', operatorCode: 'OP003', checkinDecision: 'PASS', recipeCode: 'RC003', recipeVersion: 'V2', status: '在制', startTime: '2026-11-06 08:30:00', goodQty: 0, defectQty: 0, mesReportStatus: 'PENDING' },
]

export const qualityRecords: QualityRecord[] = [
  { qualityId: 'QA001', productSn: 'SN000001', workOrderCode: 'WO20261106001', processCode: 'PROC030', checkItem: '泄漏率', measuredValue: 2.1, unit: 'Pa·m³/s', upperLimit: 5, lowerLimit: 0, result: '合格', checkedAt: '2026-11-06 08:16:40', equipmentCode: 'EQ003', operatorId: 'OP002', mesStatus: 'SUCCESS' },
  { qualityId: 'QA002', productSn: 'SN000002', workOrderCode: 'WO20261106001', processCode: 'PROC030', checkItem: '泄漏率', measuredValue: 6.8, unit: 'Pa·m³/s', upperLimit: 5, lowerLimit: 0, result: '不合格', defectCode: 'SEAL-LEAK', checkedAt: '2026-11-06 09:10:22', equipmentCode: 'EQ003', operatorId: 'OP002', mesStatus: 'SUCCESS' },
  { qualityId: 'QA003', productSn: 'SN000101', workOrderCode: 'WO20261105002', processCode: 'PROC050', checkItem: '贴标位置偏差', measuredValue: 3.2, unit: 'mm', upperLimit: 2, lowerLimit: -2, result: '不合格', defectCode: 'LABEL-OFF', checkedAt: '2026-11-05 14:21:00', equipmentCode: 'EQ006', operatorId: 'OP004', mesStatus: 'FAILED' },
  { qualityId: 'QA004', productSn: 'SN000003', workOrderCode: 'WO20261106001', processCode: 'PROC040', checkItem: '绝缘电阻', measuredValue: 152, unit: 'MΩ', upperLimit: 500, lowerLimit: 100, result: '合格', checkedAt: '2026-11-06 08:50:12', equipmentCode: 'EQ004', operatorId: 'OP003', mesStatus: 'PENDING' },
  { qualityId: 'QA005', productSn: 'SN000004', workOrderCode: 'WO20261106001', processCode: 'PROC030', checkItem: '泄漏率', measuredValue: 4.9, unit: 'Pa·m³/s', upperLimit: 5, lowerLimit: 0, result: '待定', checkedAt: '2026-11-06 09:30:00', equipmentCode: 'EQ003', operatorId: 'OP002', mesStatus: 'PENDING' },
]

export const agvStationMappings: AgvStationMapping[] = [
  { mappingId: 'ASM01', eaipStationCode: 'ST01-BUF01', agvSystemCode: 'RCS-F01', externalStationCode: 'F01-B01', stationType: 'BUFFER', bufferCapacity: 12, enabled: true },
  { mappingId: 'ASM02', eaipStationCode: 'WS010', agvSystemCode: 'RCS-F01', externalStationCode: 'F01-P01', stationType: 'PICKUP', enabled: true },
  { mappingId: 'ASM03', eaipStationCode: 'WS013', agvSystemCode: 'RCS-F01', externalStationCode: 'F01-D01', stationType: 'DROPOFF', enabled: true },
  { mappingId: 'ASM04', eaipStationCode: 'CHARGE-01', agvSystemCode: 'RCS-F01', externalStationCode: 'F01-C01', stationType: 'CHARGING', enabled: false },
]

export const agvTasks: AgvTask[] = [
  { taskId: 'TASK001', externalTaskId: 'RCS-8842', businessTaskCode: 'BT-20261106-001', taskType: 'LINE_FEED', materialCode: 'M-CELL-96', lotNo: 'LOT202611A', quantity: 96, containerCode: 'CTN-A01', fromStation: 'ST01-BUF01', toStation: 'WS010', priority: '高', requiredTime: '2026-11-06 08:00', relatedWorkOrder: 'WO20261106001', status: 'COMPLETED', createdAt: '2026-11-06 07:50:00', updatedAt: '2026-11-06 07:58:12' },
  { taskId: 'TASK002', externalTaskId: 'RCS-8851', businessTaskCode: 'BT-20261106-002', taskType: 'EMPTY_RETURN', containerCode: 'CTN-A02', fromStation: 'WS010', toStation: 'ST01-BUF01', priority: '中', relatedWorkOrder: 'WO20261106001', status: 'MOVING', createdAt: '2026-11-06 09:05:00', updatedAt: '2026-11-06 09:12:33' },
  { taskId: 'TASK003', externalTaskId: 'RCS-8855', businessTaskCode: 'BT-20261106-003', taskType: 'TRANSFER', materialCode: 'M-BUSBAR', lotNo: 'LOT202610Z', quantity: 12, containerCode: 'CTN-B07', fromStation: 'ST01-BUF01', toStation: 'WS013', priority: '中', requiredTime: '2026-11-06 10:00', relatedWorkOrder: 'WO20261106001', status: 'ARRIVED', createdAt: '2026-11-06 09:20:00', updatedAt: '2026-11-06 09:55:40' },
  { taskId: 'TASK004', businessTaskCode: 'BT-20261106-004', taskType: 'LINE_FEED', materialCode: 'M-CELL-96', quantity: 96, fromStation: 'ST01-BUF01', toStation: 'WS011', priority: '高', requiredTime: '2026-11-06 10:30', relatedWorkOrder: 'WO20261106001', status: 'SUBMITTED', createdAt: '2026-11-06 09:40:00', updatedAt: '2026-11-06 09:40:05', lastError: 'RCS 未返回 externalTaskId，等待受理' },
  { taskId: 'TASK005', externalTaskId: 'RCS-8700', businessTaskCode: 'BT-20261105-009', taskType: 'TRANSFER', materialCode: 'M-HARNESS', quantity: 1, containerCode: 'CTN-H01', fromStation: 'ST01-BUF01', toStation: 'WS013', priority: '低', relatedWorkOrder: 'WO20261105002', status: 'FAILED', createdAt: '2026-11-05 20:10:00', updatedAt: '2026-11-05 20:25:00', lastError: '车辆到站后接驳超时，RCS 标记 FAILED' },
]

export const reportTasks: ReportTask[] = [
  { taskCode: 'RT-COMPLETE', name: '工序完工数据上报 MES', sourceObject: 'ProductionRecord', targetSystem: 'MES-PRD', targetInterface: 'OperationComplete', triggerMode: 'EVENT', filterExpression: "operationType='COMPLETE'", batchSize: 50, retryPolicy: '指数退避 1m/5m/30m，最大 5 次', enabled: true, lastRunAt: '2026-11-06 09:59:30', nextRunAt: '2026-11-06 10:00:00', successCount: 812, failCount: 3, pendingCount: 2, retryCount: 2 },
  { taskCode: 'RT-QA', name: '质量数据定时上报', sourceObject: 'QualityRecord', targetSystem: 'MES-PRD', targetInterface: 'QualityReport', triggerMode: 'SCHEDULE', scheduleExpression: '每 5 分钟', batchSize: 100, retryPolicy: '固定间隔 5m，最大 3 次', enabled: true, lastRunAt: '2026-11-06 09:55:00', nextRunAt: '2026-11-06 10:00:00', successCount: 402, failCount: 10, pendingCount: 3, retryCount: 1 },
  { taskCode: 'RT-AGV', name: 'AGV 任务状态同步 WMS', sourceObject: 'AgvTask', targetSystem: 'WMS-PRD', targetInterface: 'TaskStatusSync', triggerMode: 'BUSINESS', batchSize: 20, retryPolicy: '指数退避，最大 3 次', enabled: false, successCount: 88, failCount: 0, pendingCount: 0, retryCount: 0 },
  { taskCode: 'RT-HIST', name: '小时级产量汇总上报', sourceObject: 'ProductionRecord(聚合)', targetSystem: 'MES-PRD', targetInterface: 'HourlyOutput', triggerMode: 'SCHEDULE', scheduleExpression: '每小时整点', batchSize: 500, retryPolicy: '固定间隔 10m，最大 3 次', enabled: true, lastRunAt: '2026-11-06 09:00:00', nextRunAt: '2026-11-06 10:00:00', successCount: 96, failCount: 0, pendingCount: 0, retryCount: 0 },
]

/* ---------- 系统管理 ---------- */

export const systemRoles: SystemRole[] = ['系统管理员', '自动化工程师', '生产主管', '设备维修人员', '操作员', '工艺工程师', '集成管理员', '只读访客']

export const users: UserAccount[] = [
  { userId: 'U001', login: 'admin', name: '系统管理员', email: 'admin@eaip.local', role: '系统管理员', department: 'IT', status: '启用', lastLoginAt: '2026-11-06 08:00:00', createdAt: '2026-10-01' },
  { userId: 'U002', login: 'zhangwei', name: '张伟', role: '生产主管', department: '生产部', status: '启用', lastLoginAt: '2026-11-06 07:45:12', createdAt: '2026-10-01' },
  { userId: 'U003', login: 'wangqiang', name: '王强', role: '自动化工程师', department: '自动化部', status: '启用', lastLoginAt: '2026-11-05 18:22:00', createdAt: '2026-10-01' },
  { userId: 'U004', login: 'lifang', name: '李芳', role: '工艺工程师', department: '工艺部', status: '启用', lastLoginAt: '2026-11-06 09:01:44', createdAt: '2026-10-01' },
  { userId: 'U005', login: 'zhaolei', name: '赵磊', role: '设备维修人员', department: '维修组', status: '启用', lastLoginAt: '2026-11-06 09:47:55', createdAt: '2026-10-01' },
  { userId: 'U006', login: 'chenjing', name: '陈静', role: '集成管理员', department: 'IT', status: '启用', lastLoginAt: '2026-11-04 16:30:00', createdAt: '2026-10-05' },
  { userId: 'U007', login: 'op001', name: '操作员-刘洋', role: '操作员', department: '生产部', status: '启用', lastLoginAt: '2026-11-06 06:30:00', createdAt: '2026-10-05' },
  { userId: 'U008', login: 'guest01', name: '访客-演示', role: '只读访客', department: '-', status: '停用', createdAt: '2026-10-10' },
]

export const configItems: ConfigItem[] = [
  { configKey: 'org.factory.f01', category: '组织和产线配置', name: '工厂 F01 时区', value: 'Asia/Shanghai', status: '已发布', version: 3, updatedBy: 'admin', updatedAt: '2026-10-01 08:00:00' },
  { configKey: 'collect.global.max-tags-per-device', category: '点位和采集策略', name: '单设备最大点位数', value: '2000', status: '已发布', version: 1, updatedBy: 'admin', updatedAt: '2026-10-01 08:00:00' },
  { configKey: 'collect.global.queue-limit', category: '点位和采集策略', name: '采集队列上限', value: '10000', status: '已发布', version: 2, updatedBy: '王强', updatedAt: '2026-10-20 14:00:00' },
  { configKey: 'interface.mes.timeout', category: 'MES/AGV 集成配置', name: 'MES 接口超时(ms)', value: '5000', status: '已发布', version: 4, updatedBy: '陈静', updatedAt: '2026-11-02 10:12:00' },
  { configKey: 'alarm.default-levels', category: '报警规则和通知策略', name: '默认事件等级模板', value: 'L1/L2/L3/L4（项目可配置）', status: '已发布', version: 1, updatedBy: 'admin', updatedAt: '2026-10-01 08:00:00' },
  { configKey: 'storage.raw.retention-days', category: '数据存储策略', name: '高频原始数据保留天数', value: '90', status: '草稿', version: 1, updatedBy: '王强', updatedAt: '2026-11-06 09:20:00' },
  { configKey: 'scada.screen-grid', category: '看板配置', name: '组态画布默认网格', value: '20px', status: '已停用', version: 2, updatedBy: '王强', updatedAt: '2026-10-28 11:00:00' },
]

const logLevels: SystemLog['level'][] = ['INFO', 'INFO', 'INFO', 'INFO', 'WARN', 'INFO', 'ERROR', 'INFO', 'INFO', 'WARN', 'INFO', 'INFO']
export const systemLogs: SystemLog[] = logLevels.map((lv, i) => ({
  logId: `LOG${String(100000 + i)}`,
  timestamp: `2026-11-06 09:${String(59 - i).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}`,
  level: lv,
  service: ['collect-service', 'api-gateway', 'rule-engine', 'opcua-server', 'report-engine'][i % 5],
  module: ['tag-scan', 'auth', 'rule-eval', 'subscription', 'task-run'][i % 5],
  userId: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'zhangwei' : undefined,
  requestId: `req-${1000 + i}`,
  operation: ['采集周期读取', '接口鉴权', '规则评估', 'OPC 订阅', '上报任务执行'][i % 5],
  result: lv === 'ERROR' ? '失败' : '成功',
  errorCode: lv === 'ERROR' ? 'COMM_TIMEOUT' : undefined,
  durationMs: 8 + i * 13,
  message: lv === 'ERROR' ? '设备 EQ009 读取超时，已按策略标记 COMM_LOST' : lv === 'WARN' ? '采集队列深度达到告警阈值 80%' : '处理完成',
}))

export const serviceHealth: ServiceHealth[] = [
  { service: 'api-gateway', status: 'UP', uptimeHours: 1523.4, detail: 'CPU 32% · 内存 41% · P95 45ms' },
  { service: 'collect-service', status: 'UP', uptimeHours: 1523.4, detail: '12 台设备在线 · 采集成功率 99.2% · 队列 16' },
  { service: 'opcua-server', status: 'UP', uptimeHours: 1523.4, detail: '2 个客户端连接 · 订阅 18' },
  { service: 'mqtt-broker-client', status: 'DEGRADED', uptimeHours: 1523.4, detail: 'AGV Broker 断开，本地队列积压 26' },
  { service: 'rule-engine', status: 'UP', uptimeHours: 1523.2, detail: '6 条规则运行中 · 今日命中 7' },
  { service: 'report-engine', status: 'UP', uptimeHours: 1523.4, detail: '4 个上报任务 · 待发送 5' },
  { service: 'historian-writer', status: 'DOWN', uptimeHours: 0, detail: '数据库连接失败，已触发告警 ALM-DB-01' },
]

export const backups: BackupRecord[] = [
  { backupId: 'BK20261106001', type: '数据库备份', sizeMb: 812, createdAt: '2026-11-06 02:00:00', status: '成功', verified: true, createdBy: '系统(定时)' },
  { backupId: 'BK20261106002', type: '配置包备份', sizeMb: 3.2, createdAt: '2026-11-06 02:05:00', status: '成功', verified: true, createdBy: '系统(定时)' },
  { backupId: 'BK20261105001', type: '数据库备份', sizeMb: 798, createdAt: '2026-11-05 02:00:00', status: '成功', verified: true, createdBy: '系统(定时)' },
  { backupId: 'BK20261104001', type: '证书密钥备份', sizeMb: 0.08, createdAt: '2026-11-04 10:00:00', status: '成功', verified: false, createdBy: 'admin' },
  { backupId: 'BK20261103001', type: '数据库备份', sizeMb: 0, createdAt: '2026-11-03 02:00:00', status: '失败', verified: false, createdBy: '系统(定时)' },
]

export const versions: VersionRecord[] = [
  { version: 'v1.0.0', channel: '当前版本', installedAt: '2026-10-01 08:30:00', installedBy: 'admin', checksum: 'sha256:9f2c…a81d', notes: 'V1.0 正式版：采集、接口、Historian、Andon、MES 集成全模块' },
  { version: 'v0.9.8-rc3', channel: '可回滚', installedAt: '2026-09-20 14:00:00', installedBy: 'admin', checksum: 'sha256:1ab3…77e0', notes: 'RC3：修复分站补传序号回退问题' },
  { version: 'v0.9.0-beta', channel: '历史版本', installedAt: '2026-09-01 09:00:00', installedBy: 'admin', checksum: 'sha256:44cd…09fa', notes: '首个内测版' },
]

export const processCodes = ['PROC010', 'PROC020', 'PROC030', 'PROC040', 'PROC050']

export function lineName(lineId: string): string {
  return lines.find((l) => l.lineId === lineId)?.name ?? lineId
}

export function stationName(stationId: string): string {
  return stations.find((s) => s.stationId === stationId)?.name ?? stationId
}

export function equipmentName(codeOrId: string): string {
  const e = equipments.find((x) => x.equipmentId === codeOrId || x.equipmentCode === codeOrId)
  return e ? `${e.equipmentName}（${e.equipmentCode}）` : codeOrId
}

export function tagDisplayValue(v: TagValue, tagDef?: Tag): string {
  const raw = String(v.value)
  if (tagDef?.enumMap && tagDef.enumMap[raw]) return `${tagDef.enumMap[raw]}（${raw}）`
  return raw
}
