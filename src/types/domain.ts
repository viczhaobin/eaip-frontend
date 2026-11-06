/* EAIP 领域模型类型（对应规格书 1.4 公共数据对象及各模块定义） */

/* ---------- 组织 ---------- */

export interface Factory {
  factoryId: string
  factoryCode: string
  name: string
  timezone: string
  description?: string
}

export interface ProductionLine {
  lineId: string
  lineCode: string
  factoryId: string
  name: string
  description?: string
}

export type StationKind = 'MASTER' | 'SUB_STATION' | 'EDGE_NODE'

/** 站点（总站/分站/边缘节点），F1.3 */
export interface StationNode {
  stationId: string
  stationCode: string
  name: string
  stationKind: StationKind
  lineId: string
  parentStationId?: string
  /** 边缘代理 ID */
  edgeAgentId?: string
  /** 通信地址 */
  endpoint?: string
  heartbeatIntervalSec: number
  offlineThreshold: number
  syncStrategy: string
  enabled: boolean
  /* 运行态（注册/心跳） */
  status: 'ONLINE' | 'OFFLINE' | 'RECOVERING'
  softwareVersion?: string
  configVersion?: string
  queueBacklog: number
  lastHeartbeatAt?: string
  registeredAt?: string
}

export interface Workstation {
  workstationId: string
  workstationCode: string
  stationId: string
  processCode: string
  name: string
}

/* ---------- 设备采控 ---------- */

export type EquipmentType = 'PLC' | 'ROBOT' | 'CNC' | 'METER' | 'SENSOR' | 'AGV' | 'OTHER'

export type EquipmentStatus =
  | 'DISABLED' | 'CONFIGURED' | 'CONNECTING'
  | 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'FAULT'

export interface Equipment {
  equipmentId: string
  equipmentCode: string
  equipmentName: string
  equipmentType: EquipmentType
  factoryId: string
  lineId: string
  stationId: string
  brand?: string
  model?: string
  protocolDriverId: string
  endpoint: string
  connectionTimeoutMs: number
  retryIntervalMs: number
  enabled: boolean
  status: EquipmentStatus
  description?: string
  controlMode: '自动' | '手动' | '本地'
  lastStatusChangeAt?: string
  /* 运行统计 */
  currentAlarmCount: number
  runMinutesToday: number
  downMinutesToday: number
  currentWorkOrder?: string
  currentProduct?: string
  outputToday: number
  cycleTimeSec?: number
}

export interface Driver {
  driverId: string
  name: string
  protocol: 'Modbus TCP' | 'Modbus RTU' | 'OPC UA Client' | 'Siemens S7' | 'MQTT Client'
  version: string
  applicableTypes: EquipmentType[]
  status: 'RUNNING' | 'STOPPED'
  connections: number
  errorCount: number
  lastHeartbeatAt?: string
  uptimeHours: number
  installedAt: string
}

export type TagDataType = 'BOOL' | 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'FLOAT' | 'DOUBLE' | 'STRING' | 'DATETIME'
export type AccessMode = 'READ' | 'WRITE' | 'READ_WRITE'

export type QualityCode =
  | 'GOOD' | 'UNCERTAIN' | 'BAD' | 'STALE' | 'COMM_LOST' | 'NOT_CONFIGURED' | 'OUT_OF_RANGE'

export interface Tag {
  tagId: string
  tagCode: string
  tagName: string
  equipmentId: string
  address: string
  dataType: TagDataType
  accessMode: AccessMode
  unit?: string
  scale?: number
  offset?: number
  enumMap?: Record<string, string>
  deadband?: number
  scanIntervalMs: number
  staleAfterMs: number
  minValue?: number
  maxValue?: number
  enabled: boolean
  /** 写点位额外安全限制 */
  writeWhitelist?: boolean
  writeAllowedRange?: { min: number; max: number }
  version: number
  updatedBy: string
  updatedAt: string
}

export interface TagValue {
  tagId: string
  value: number | string | boolean
  quality: QualityCode
  sourceTimestamp: string
  serverTimestamp: string
  lastChangedAt: string
}

export interface CollectTask {
  taskId: string
  name: string
  equipmentId: string
  tagCount: number
  mode: '周期采集' | '变化采集' | '业务触发采集'
  intervalMs: number
  status: 'RUNNING' | 'PAUSED' | 'STOPPED'
  lastRunAt?: string
  nextRunAt?: string
  successRate: number
  queueDepth: number
  dropPolicy: string
}

export type CommandCode =
  | 'START_REQUEST' | 'STOP_REQUEST' | 'RESET_REQUEST' | 'PAUSE_REQUEST'
  | 'RESUME_REQUEST' | 'RECIPE_SELECT' | 'PARAMETER_SET'

export type CommandStatus =
  | 'CREATED' | 'VALIDATING' | 'SENT' | 'RECEIVED' | 'EXECUTING'
  | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT'

export interface ControlCommand {
  commandId: string
  equipmentId: string
  commandCode: CommandCode
  parameters: Record<string, string>
  issuedBy: string
  issuedAt: string
  expiresAt: string
  status: CommandStatus
  resultMessage?: string
}

/* ---------- 工业接口 ---------- */

export interface OpcUaServerConf {
  serverId: string
  name: string
  endpoint: string
  port: number
  appUri: string
  securityPolicy: string
  securityMode: string
  authMode: '用户名密码' | '证书' | '匿名（已禁用）'
  allowNetworks: string
  status: 'RUNNING' | 'STOPPED'
  namespaceCount: number
  clients: OpcUaClientConn[]
}

export interface OpcUaClientConn {
  clientUri: string
  user: string
  connectedAt: string
  subscriptions: number
  status: 'CONNECTED' | 'DISCONNECTED'
}

export interface OpcUaClientConf {
  clientId: string
  name: string
  endpoint: string
  securityPolicy: string
  authMode: string
  mappedTagCount: number
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
  reconnectCount: number
  lastError?: string
}

export type InterfaceDirection = 'INBOUND' | 'OUTBOUND'

export interface ApiInterface {
  interfaceCode: string
  name: string
  version: string
  direction: InterfaceDirection
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  contentType: string
  authType: string
  timeoutMs: number
  rateLimitPerMin: number
  idempotency: string
  enabled: boolean
  calls: number
  successRate: number
  p95Ms: number
  owner: string
}

export interface MqttConfig {
  brokerId: string
  name: string
  brokerAddress: string
  port: number
  clientId: string
  username: string
  tlsEnabled: boolean
  topicPrefix: string
  defaultQos: 0 | 1 | 2
  status: 'CONNECTED' | 'DISCONNECTED'
  messagesIn: number
  messagesOut: number
  backlog: number
  lastError?: string
}

export type AdapterType = 'HTTP/REST Client' | 'HTTP/REST Server' | 'WebSocket' | 'MQTT' | 'TCP' | '数据库' | '文件' | 'OPC UA'
export type AdapterStatus = '未配置' | '已配置' | '测试中' | '已连接' | '运行中' | '异常' | '已停用'

export interface Adapter {
  adapterId: string
  adapterCode: string
  adapterType: AdapterType
  endpoint: string
  credentialRef: string
  timeoutMs: number
  retryPolicy: string
  healthStatus: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN'
  status: AdapterStatus
  lastSuccessAt?: string
  lastError?: string
}

export interface FieldMapping {
  mappingId: string
  name: string
  sourceSystem: string
  sourceObject: string
  targetSystem: string
  targetObject: string
  fieldCount: number
  transformSummary: string
  nullStrategy: string
  invalidStrategy: string
  version: string
  effectiveTime: string
  enabled: boolean
}

export interface RouteRule {
  ruleId: string
  ruleCode: string
  name: string
  messageType: string
  condition: string
  targets: string[]
  enabled: boolean
  lastTestAt?: string
  lastTestResult?: string
}

export type MessageStatus =
  | 'RECEIVED' | 'VALIDATING' | 'PENDING' | 'SENDING' | 'SUCCESS'
  | 'RETRYING' | 'FAILED' | 'DEAD_LETTER' | 'CANCELLED'

export interface IntegrationMessage {
  messageId: string
  interfaceCode: string
  businessKey: string
  direction: InterfaceDirection
  status: MessageStatus
  retryCount: number
  createdAt: string
  updatedAt: string
  lastError?: string
  payloadSummary: string
}

/* ---------- 工业数据 ---------- */

export interface ProductionRecord {
  recordId: string
  workOrderId: string
  workOrderCode: string
  productCode: string
  productSn?: string
  lotNo?: string
  lineId: string
  stationId: string
  equipmentId: string
  processCode: string
  operationType: 'START' | 'COMPLETE' | 'PAUSE' | 'RESUME' | 'REWORK'
  startTime: string
  endTime?: string
  inputQty: number
  goodQty: number
  defectQty: number
  operatorId: string
  shiftCode: string
  resultCode: string
  sourceSystem: string
  eventId: string
  mesReportStatus: 'PENDING' | 'SUCCESS' | 'RETRYING' | 'FAILED'
}

export interface RecipeParameter {
  name: string
  setValue: number
  actualValue: number
  upperLimit?: number
  lowerLimit?: number
  unit?: string
}

export interface Recipe {
  recipeId: string
  recipeCode: string
  version: string
  processCode: string
  productCode?: string
  status: '草稿' | '已发布' | '已停用'
  effectiveTime?: string
  parameters: RecipeParameter[]
  updatedBy: string
  updatedAt: string
  source: 'EAIP' | 'MES同步'
}

export type AggFunc = 'MIN' | 'MAX' | 'AVG' | 'SUM' | 'COUNT' | 'FIRST' | 'LAST'

/* ---------- 生产监控 ---------- */

export interface ScadaScreen {
  screenId: string
  name: string
  width: number
  height: number
  background: string
  gridEnabled: boolean
  elementCount: number
  bindingValid: boolean
  status: '草稿' | '已发布'
  version: number
  updatedBy: string
  updatedAt: string
}

export interface Board {
  boardId: string
  name: string
  width: number
  height: number
  theme: '深色' | '浅色'
  refreshSeconds: number
  pages: number
  terminalBinding: string
  accessMode: '匿名展示' | '登录展示'
  status: '草稿' | '已发布'
  updatedAt: string
}

/* ---------- 异常管理 ---------- */

export type AlarmLevel = 'L1' | 'L2' | 'L3' | 'L4'

export interface AlarmRule {
  ruleId: string
  ruleCode: string
  ruleName: string
  eventType: string
  ruleKind: '阈值' | '状态' | '持续时间' | '变化率' | '计数' | '组合'
  sourceType: 'TAG' | 'EQUIPMENT' | 'INTERFACE' | 'MANUAL'
  sourceId: string
  conditionExpression: string
  triggerDurationSec?: number
  recoveryCondition?: string
  severity: AlarmLevel
  dedupKey: string
  suppressionWindowSec: number
  enabled: boolean
  version: number
  effectiveTime: string
  hitCountToday: number
  trialRun: boolean
}

export type AlarmEventStatus =
  | 'ACTIVE' | 'ACKNOWLEDGED' | 'PROCESSING' | 'RECOVERED' | 'CLOSED'
  | 'ESCALATED' | 'REOPENED' | 'SUPPRESSED' | 'CANCELLED'

export interface AlarmEvent {
  eventId: string
  ruleCode?: string
  source: string
  equipmentCode?: string
  alarmCode: string
  level: AlarmLevel
  status: AlarmEventStatus
  occurredAt: string
  lastOccurredAt: string
  recoveredAt?: string
  closedAt?: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  occurrenceCount: number
  description: string
  dedupKey: string
}

export interface Ticket {
  ticketId: string
  eventId: string
  title: string
  level: AlarmLevel
  category: string
  lineId?: string
  stationId?: string
  equipmentId?: string
  ownerId?: string
  teamId?: string
  dueAt?: string
  status: '待确认' | '处理中' | '待关闭' | '已关闭' | '已重开'
  causeCode?: string
  causeDescription?: string
  actionDescription?: string
  acknowledgedAt?: string
  startedAt?: string
  recoveredAt?: string
  closedAt?: string
  closeReason?: string
  createdAt: string
  timeline: { at: string; actor: string; action: string }[]
}

export interface NotifyPolicy {
  policyId: string
  policyCode: string
  eventLevel: AlarmLevel
  channel: 'HMI弹窗' | '声光Andon' | '企业微信' | '钉钉' | '邮件' | '短信' | 'MES事件'
  receiverRule: string
  quietHours?: string
  retryIntervalSec: number
  maxRetry: number
  escalationAfterSec?: number
  escalationReceiver?: string
  templateCode: string
  enabled: boolean
  lastSendStatus?: 'SENT' | 'FAILED' | 'RETRYING' | 'EXPIRED'
}

/* ---------- 业务集成 ---------- */

export interface MesSystem {
  systemCode: string
  systemName: string
  baseUrl: string
  authenticationType: 'API Key' | 'Token' | '双向TLS' | '无'
  credentialRef: string
  timeoutMs: number
  retryPolicy: string
  rateLimitPerMin: number
  interfaceVersion: string
  timezone: string
  healthCheckPath: string
  enabled: boolean
  status: 'HEALTHY' | 'UNHEALTHY'
}

export type WorkOrderStatus =
  | 'RECEIVED' | 'VALIDATED' | 'READY' | 'RELEASED' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'REJECTED'

export interface WorkOrder {
  workOrderId: string
  externalOrderCode: string
  productCode: string
  productName: string
  plannedQty: number
  completedQty: number
  goodQty: number
  defectQty: number
  priority: '高' | '中' | '低'
  plannedStart: string
  plannedEnd: string
  routeCode: string
  recipeCode?: string
  materialList?: string
  status: WorkOrderStatus
  sourceSystem: string
  version: number
  receivedAt: string
}

export interface OperationRecord {
  operationRecordId: string
  workOrderCode: string
  productSn: string
  processCode: string
  stationCode: string
  equipmentCode: string
  operatorCode: string
  checkinDecision: 'PASS' | 'REJECT' | 'WARNING'
  reasonMessage?: string
  recipeCode?: string
  recipeVersion?: string
  status: '在制' | '暂停' | '已完工'
  pauseReason?: string
  startTime: string
  endTime?: string
  goodQty: number
  defectQty: number
  mesReportStatus: 'PENDING' | 'SUCCESS' | 'RETRYING' | 'FAILED'
}

export interface QualityRecord {
  qualityId: string
  productSn: string
  workOrderCode: string
  processCode: string
  checkItem: string
  measuredValue: number
  unit: string
  upperLimit: number
  lowerLimit: number
  result: '合格' | '不合格' | '待定'
  defectCode?: string
  checkedAt: string
  equipmentCode: string
  operatorId: string
  mesStatus: 'SUCCESS' | 'PENDING' | 'FAILED'
}

export interface AgvStationMapping {
  mappingId: string
  eaipStationCode: string
  agvSystemCode: string
  externalStationCode: string
  stationType: 'PICKUP' | 'DROPOFF' | 'BUFFER' | 'CHARGING' | 'OTHER'
  bufferCapacity?: number
  enabled: boolean
}

export type AgvTaskStatus =
  | 'CREATED' | 'SUBMITTED' | 'ACCEPTED' | 'DISPATCHED' | 'MOVING'
  | 'ARRIVED' | 'HANDOVER' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface AgvTask {
  taskId: string
  externalTaskId?: string
  businessTaskCode: string
  taskType: 'LINE_FEED' | 'EMPTY_RETURN' | 'TRANSFER'
  materialCode?: string
  lotNo?: string
  quantity?: number
  containerCode?: string
  fromStation: string
  toStation: string
  priority: '高' | '中' | '低'
  requiredTime?: string
  relatedWorkOrder?: string
  status: AgvTaskStatus
  createdAt: string
  updatedAt: string
  lastError?: string
}

export interface ReportTask {
  taskCode: string
  name: string
  sourceObject: string
  targetSystem: string
  targetInterface: string
  triggerMode: 'SCHEDULE' | 'EVENT' | 'BUSINESS'
  scheduleExpression?: string
  filterExpression?: string
  batchSize: number
  retryPolicy: string
  enabled: boolean
  lastRunAt?: string
  nextRunAt?: string
  successCount: number
  failCount: number
  lastError?: string
  pendingCount: number
  retryCount: number
}

/* ---------- 系统管理 ---------- */

export type SystemRole =
  | '系统管理员' | '自动化工程师' | '生产主管' | '设备维修人员'
  | '操作员' | '工艺工程师' | '集成管理员' | '只读访客'

export interface UserAccount {
  userId: string
  login: string
  name: string
  email?: string
  phone?: string
  role: SystemRole
  department: string
  status: '启用' | '停用'
  lastLoginAt?: string
  createdAt: string
}

export type PermAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'EXECUTE' | 'EXPORT' | 'ADMIN'

export interface ConfigItem {
  configKey: string
  category: string
  name: string
  value: string
  status: '草稿' | '已发布' | '已停用'
  version: number
  updatedBy: string
  updatedAt: string
}

export interface SystemLog {
  logId: string
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  service: string
  module: string
  userId?: string
  requestId?: string
  operation: string
  result: '成功' | '失败'
  errorCode?: string
  durationMs?: number
  message: string
}

export interface ServiceHealth {
  service: string
  status: 'UP' | 'DOWN' | 'DEGRADED'
  uptimeHours: number
  detail: string
}

export interface BackupRecord {
  backupId: string
  type: '数据库备份' | '配置包备份' | '证书密钥备份'
  sizeMb: number
  createdAt: string
  status: '成功' | '失败'
  verified: boolean
  createdBy: string
}

export interface VersionRecord {
  version: string
  channel: '当前版本' | '历史版本' | '可回滚'
  installedAt: string
  installedBy: string
  checksum: string
  notes: string
}
