/* Mock 服务层：模拟后端 API（延迟 + 内存数据 + 实时漂移）。
 * 后端就绪后，将各页面从 @/services/mock 切换到 @/services/api 即可。 */
import {
  adapters, agvStationMappings, agvTasks, alarmEvents, alarmRules,
  apiInterfaces, backups, boards, collectTasks, commands, configItems, drivers, equipments,
  factories, fieldMappings, lines, mesSystems, messages, mqttConfigs, notifyPolicies,
  opcUaClients, opcUaServers, operationRecords, productionRecords, qualityRecords, recipes,
  reportTasks, routeRules, scadaScreens, serviceHealth, stations, systemLogs, systemRoles,
  tags, tagSeeds, tagValues, tickets, users, versions, workstations, formatValue, wave, workOrders,
} from './db'
import type {
  Adapter, AgvTask, AlarmRule, ControlCommand, Equipment, StationNode,
  SystemRole, Tag, Ticket, UserAccount, QualityCode,
} from '@/types/domain'
import type { TagValue } from '@/types/domain'

const delay = (ms = 180) => new Promise<void>((r) => setTimeout(r, ms))

function nextId(prefix: string): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`
}

export function includes(v: unknown, k: string): boolean {
  return String(v ?? '').toLowerCase().includes(k.toLowerCase())
}

/* ---------- 实时值模拟 ---------- */

const rtListeners = new Set<() => void>()
let tick = 0

/** 推进一轮实时数据漂移（数值随机游走 + 偶发质量码） */
export function tickRealtime() {
  tick += 1
  const now = new Date()
  const ts = now.toISOString().slice(0, 19).replace('T', ' ')
  tagSeeds.forEach((s, i) => {
    const v = tagValues[i]
    const eq = equipments.find((e) => e.equipmentId === s.tag.equipmentId)
    const eqDown = !eq || !eq.enabled || eq.status === 'OFFLINE' || eq.status === 'FAULT'
    if (eqDown) {
      v.quality = 'COMM_LOST'
    } else if (s.tag.dataType === 'BOOL' || s.tag.enumMap) {
      v.quality = 'GOOD'
      v.value = formatValue(s.tag, s.base + wave(i, tick) + (i % 3))
    } else {
      // 偶发非 GOOD 质量码，演示状态展示
      const r = Math.abs(wave(i * 3, tick))
      v.quality = r > 1.45 ? 'UNCERTAIN' : s.tag.minValue != null && s.tag.maxValue != null && r > 1.53 ? 'OUT_OF_RANGE' : 'GOOD'
      v.value = formatValue(s.tag, s.base + wave(i, tick) * s.amplitude)
    }
    v.sourceTimestamp = ts
    v.serverTimestamp = ts
    v.lastChangedAt = ts
  })
  rtListeners.forEach((fn) => fn())
}

export function subscribeRealtime(fn: () => void): () => void {
  rtListeners.add(fn)
  return () => {
    rtListeners.delete(fn)
  }
}

export async function getRealtimeValues(tagIds?: string[]): Promise<TagValue[]> {
  await delay(60)
  return tagIds ? tagValues.filter((v) => tagIds.includes(v.tagId)) : [...tagValues]
}

/** 历史序列：确定性伪随机游走（同一 tag+时间点 序列稳定） */
export function historySeries(tagId: string, points: number, minutesStep = 1): { t: string; v: number; q: QualityCode }[] {
  const seed = tags.find((t) => t.tagId === tagId)
  const base = tagSeeds.find((s) => s.tag.tagId === tagId)
  const b = base?.base ?? 50
  const a = base?.amplitude || b * 0.1
  const out: { t: string; v: number; q: QualityCode }[] = []
  const end = Date.now()
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(end - i * minutesStep * 60000)
    const label = t.toISOString().slice(11, 16)
    const idx = points - 1 - i
    const v = Number((b + wave(seed ? tags.indexOf(seed) : 0, idx) * a).toFixed(2))
    out.push({ t: label, v, q: idx % 37 === 0 ? 'UNCERTAIN' : 'GOOD' })
  }
  return out
}

/* ---------- 设备采控 ---------- */

export const deviceApi = {
  listEquipments: async (f?: { keyword?: string; status?: string; type?: string; lineId?: string }) => {
    await delay()
    return equipments.filter((e) =>
      (!f?.keyword || includes(e.equipmentCode, f.keyword) || includes(e.equipmentName, f.keyword))
      && (!f?.status || e.status === f.status)
      && (!f?.type || e.equipmentType === f.type)
      && (!f?.lineId || e.lineId === f.lineId),
    )
  },
  getEquipment: async (id: string) => {
    await delay(80)
    const e = equipments.find((x) => x.equipmentId === id || x.equipmentCode === id)
    if (!e) throw new Error('设备不存在')
    return e
  },
  saveEquipment: async (e: Equipment) => {
    await delay(200)
    if (equipments.some((x) => x.equipmentId !== e.equipmentId && x.equipmentCode === e.equipmentCode)) {
      throw new Error(`设备编码 ${e.equipmentCode} 已存在，编码全局唯一`)
    }
    const i = equipments.findIndex((x) => x.equipmentId === e.equipmentId)
    if (i >= 0) equipments[i] = e
    else equipments.unshift({ ...e, equipmentId: e.equipmentId || nextId('EQ') })
    return e
  },
  /** 连接测试：只有配置了 endpoint 且引用有效驱动才能通过 */
  testConnection: async (equipmentId: string) => {
    await delay(900)
    const e = equipments.find((x) => x.equipmentId === equipmentId)
    if (!e) throw new Error('设备不存在')
    if (!e.endpoint) return { ok: false, message: '未配置通信地址（endpoint）', suggestions: ['按驱动类型填写 IP/端口或串口参数'] }
    if (!drivers.find((d) => d.driverId === e.protocolDriverId && d.status === 'RUNNING')) {
      return { ok: false, message: '驱动未运行或不存在', suggestions: ['在驱动管理启动对应驱动实例'] }
    }
    if (e.equipmentId === 'EQ009') return { ok: false, message: '连接超时（3000ms）', suggestions: ['检查网络连通性', '检查 PLC 是否上电', '检查端口/机架槽号配置'] }
    return { ok: true, message: `连接成功：读取到驱动识别信息 ${e.brand ?? ''} ${e.model ?? ''}`, suggestions: [] }
  },
  setEnabled: async (equipmentId: string, enabled: boolean) => {
    await delay(200)
    const e = equipments.find((x) => x.equipmentId === equipmentId)
    if (!e) throw new Error('设备不存在')
    e.enabled = enabled
    if (!enabled) {
      e.status = 'DISABLED'
    } else if (e.status === 'DISABLED' || e.status === 'CONFIGURED') {
      e.status = 'CONNECTING'
      setTimeout(() => {
        e.status = e.equipmentId === 'EQ009' ? 'OFFLINE' : 'ONLINE'
        e.lastStatusChangeAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      }, 1200)
    }
    return e
  },
  listDrivers: async () => {
    await delay()
    return [...drivers]
  },
  setDriverStatus: async (driverId: string, running: boolean) => {
    await delay(150)
    const d = drivers.find((x) => x.driverId === driverId)
    if (d) d.status = running ? 'RUNNING' : 'STOPPED'
    return d
  },
  listTags: async (f?: { keyword?: string; equipmentId?: string; accessMode?: string }) => {
    await delay()
    return tags.filter((t) =>
      (!f?.keyword || includes(t.tagCode, f.keyword) || includes(t.tagName, f.keyword))
      && (!f?.equipmentId || t.equipmentId === f.equipmentId)
      && (!f?.accessMode || t.accessMode === f.accessMode),
    )
  },
  saveTag: async (t: Tag) => {
    await delay(200)
    const i = tags.findIndex((x) => x.tagId === t.tagId)
    if (i >= 0) {
      t.version = tags[i].version + 1
      t.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      tags[i] = t
    } else {
      tags.push({ ...t, tagId: nextId('TAG') })
    }
    return t
  },
  listCollectTasks: async () => {
    await delay()
    return [...collectTasks]
  },
  setTaskStatus: async (taskId: string, status: 'RUNNING' | 'PAUSED' | 'STOPPED') => {
    await delay(150)
    const t = collectTasks.find((x) => x.taskId === taskId)
    if (t) t.status = status
    return t
  },
  listCommands: async (f?: { keyword?: string; status?: string }) => {
    await delay()
    return commands.filter((c) =>
      (!f?.keyword || includes(c.commandId, f.keyword) || includes(c.commandCode, f.keyword))
      && (!f?.status || c.status === f.status),
    )
  },
  /** 控制指令下发：完整走「角色/白名单/模式/范围/二次确认」前端校验链 */
  issueCommand: async (cmd: Omit<ControlCommand, 'commandId' | 'issuedAt' | 'status'>) => {
    await delay(600)
    const e = equipments.find((x) => x.equipmentId === cmd.equipmentId)
    if (!e) throw new Error('目标设备不存在')
    const full: ControlCommand = {
      ...cmd,
      commandId: nextId('CMD'),
      issuedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      status: 'SUCCEEDED',
      resultMessage: 'PLC 已受理并执行（模拟）',
    }
    commands.unshift(full)
    return full
  },
  listStations: async () => {
    await delay()
    return [...stations]
  },
  saveStation: async (s: StationNode) => {
    await delay(200)
    // 防循环父子：父链上不能出现自己
    let p = s.parentStationId
    while (p) {
      if (p === s.stationId) throw new Error('父子关系存在循环，禁止保存')
      p = stations.find((x) => x.stationId === p)?.parentStationId
    }
    const i = stations.findIndex((x) => x.stationId === s.stationId)
    if (i >= 0) stations[i] = s
    else stations.push({ ...s, stationId: nextId('ST') })
    return s
  },
}

/* ---------- 工业接口 ---------- */

export const interfaceApi = {
  listOpcServers: async () => {
    await delay()
    return [...opcUaServers]
  },
  listOpcClients: async () => {
    await delay()
    return [...opcUaClients]
  },
  listApiInterfaces: async (f?: { keyword?: string; direction?: string }) => {
    await delay()
    return apiInterfaces.filter((a) =>
      (!f?.keyword || includes(a.interfaceCode, f.keyword) || includes(a.name, f.keyword) || includes(a.path, f.keyword))
      && (!f?.direction || a.direction === f.direction),
    )
  },
  saveApiInterface: async (a: (typeof apiInterfaces)[number]) => {
    await delay(200)
    const i = apiInterfaces.findIndex((x) => x.interfaceCode === a.interfaceCode)
    if (i >= 0) apiInterfaces[i] = a
    else apiInterfaces.unshift(a)
    return a
  },
  listMqtt: async () => {
    await delay()
    return [...mqttConfigs]
  },
  listAdapters: async (f?: { keyword?: string; type?: string }) => {
    await delay()
    return adapters.filter((a) =>
      (!f?.keyword || includes(a.adapterCode, f.keyword) || includes(a.endpoint, f.keyword))
      && (!f?.type || a.adapterType === f.type),
    )
  },
  saveAdapter: async (a: Adapter) => {
    await delay(200)
    const i = adapters.findIndex((x) => x.adapterId === a.adapterId)
    if (i >= 0) adapters[i] = a
    else adapters.unshift({ ...a, adapterId: nextId('AD') })
    return a
  },
  listMappings: async () => {
    await delay()
    return [...fieldMappings]
  },
  listRouteRules: async () => {
    await delay()
    return [...routeRules]
  },
  listMessages: async (f?: { keyword?: string; status?: string }) => {
    await delay()
    return messages.filter((m) =>
      (!f?.keyword || includes(m.messageId, f.keyword) || includes(m.businessKey, f.keyword))
      && (!f?.status || m.status === f.status),
    )
  },
  /** 模拟测试路由规则 */
  testRouteRule: async (ruleId: string) => {
    await delay(700)
    const r = routeRules.find((x) => x.ruleId === ruleId)
    if (r) {
      r.lastTestAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      r.lastTestResult = r.enabled ? '通过：输入 10 条样例消息，路由 10 条' : '规则已停用，请先启用再测试'
    }
    return r
  },
  resendMessage: async (messageId: string) => {
    await delay(400)
    const m = messages.find((x) => x.messageId === messageId)
    if (m) {
      m.status = 'SENDING'
      m.retryCount += 1
      m.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      m.lastError = undefined
    }
    return m
  },
}

/* ---------- 工业数据 / 生产监控 ---------- */

export const dataApi = {
  listProductionRecords: async (f?: { keyword?: string; workOrderCode?: string }) => {
    await delay()
    return productionRecords.filter((r) =>
      (!f?.keyword || includes(r.productSn, f.keyword) || includes(r.recordId, f.keyword))
      && (!f?.workOrderCode || r.workOrderCode === f.workOrderCode),
    )
  },
  listRecipes: async () => {
    await delay()
    return [...recipes]
  },
  listScreens: async () => {
    await delay()
    return [...scadaScreens]
  },
  listBoards: async () => {
    await delay()
    return [...boards]
  },
}

/* ---------- 异常管理 ---------- */

export const alarmApi = {
  listRules: async () => {
    await delay()
    return [...alarmRules]
  },
  saveRule: async (r: AlarmRule) => {
    await delay(200)
    const i = alarmRules.findIndex((x) => x.ruleId === r.ruleId)
    if (i >= 0) {
      alarmRules[i] = { ...r, version: alarmRules[i].version + 1, effectiveTime: new Date().toISOString().slice(0, 19).replace('T', ' ') }
    } else {
      alarmRules.unshift({ ...r, ruleId: nextId('AR') })
    }
    return r
  },
  listEvents: async (f?: { keyword?: string; level?: string; status?: string }) => {
    await delay()
    return alarmEvents.filter((e) =>
      (!f?.keyword || includes(e.eventId, f.keyword) || includes(e.source, f.keyword) || includes(e.alarmCode, f.keyword))
      && (!f?.level || e.level === f.level)
      && (!f?.status || e.status === f.status),
    )
  },
  acknowledgeEvent: async (eventId: string, user: string) => {
    await delay(200)
    const e = alarmEvents.find((x) => x.eventId === eventId)
    if (!e) throw new Error('事件不存在')
    if (!['ACTIVE', 'REOPENED', 'ESCALATED'].includes(e.status)) throw new Error(`当前状态 ${e.status} 不允许确认`)
    e.status = 'ACKNOWLEDGED'
    e.acknowledgedBy = user
    e.acknowledgedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    return e
  },
  cancelEvent: async (eventId: string, reason: string, user: string) => {
    await delay(200)
    const e = alarmEvents.find((x) => x.eventId === eventId)
    if (!e) throw new Error('事件不存在')
    e.status = 'CANCELLED'
    e.description += `【取消原因：${reason}（${user}）】`
    return e
  },
  recoverEvent: async (eventId: string) => {
    await delay(200)
    const e = alarmEvents.find((x) => x.eventId === eventId)
    if (!e) throw new Error('事件不存在')
    if (['CLOSED', 'CANCELLED'].includes(e.status)) throw new Error('已关闭/取消的事件不能标记恢复')
    e.status = 'RECOVERED'
    e.recoveredAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    return e
  },
  listTickets: async (f?: { keyword?: string; status?: string }) => {
    await delay()
    return tickets.filter((t) =>
      (!f?.keyword || includes(t.ticketId, f.keyword) || includes(t.title, f.keyword))
      && (!f?.status || t.status === f.status),
    )
  },
  saveTicket: async (t: Ticket) => {
    await delay(200)
    const i = tickets.findIndex((x) => x.ticketId === t.ticketId)
    if (i >= 0) tickets[i] = t
    else tickets.unshift({ ...t, ticketId: nextId('TK'), createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '), timeline: [{ at: new Date().toISOString().slice(0, 19).replace('T', ' '), actor: t.ownerId ?? '系统', action: '创建处理单' }] })
    return t
  },
  listPolicies: async () => {
    await delay()
    return [...notifyPolicies]
  },
  stats: async () => {
    await delay()
    const total = alarmEvents.length
    const active = alarmEvents.filter((e) => ['ACTIVE', 'ACKNOWLEDGED', 'PROCESSING', 'ESCALATED', 'REOPENED'].includes(e.status)).length
    const closed = alarmEvents.filter((e) => ['CLOSED', 'CANCELLED'].includes(e.status)).length
    return { total, active, closed, byLevel: (['L1', 'L2', 'L3', 'L4'] as const).map((l) => ({ level: l, count: alarmEvents.filter((e) => e.level === l).length })) }
  },
}

/* ---------- 业务集成 ---------- */

export const integrationApi = {
  listMesSystems: async () => {
    await delay()
    return [...mesSystems]
  },
  listWorkOrders: async (f?: { keyword?: string; status?: string }) => {
    await delay()
    return workorders().filter((w) =>
      (!f?.keyword || includes(w.externalOrderCode, f.keyword) || includes(w.productName, f.keyword))
      && (!f?.status || w.status === f.status),
    )
  },
  listOperationRecords: async (f?: { keyword?: string }) => {
    await delay()
    return operationRecords.filter((o) => !f?.keyword || includes(o.productSn, f.keyword) || includes(o.operationRecordId, f.keyword) || includes(o.workOrderCode, f.keyword))
  },
  listQualityRecords: async (f?: { keyword?: string; result?: string }) => {
    await delay()
    return qualityRecords.filter((q) =>
      (!f?.keyword || includes(q.productSn, f.keyword) || includes(q.qualityId, f.keyword))
      && (!f?.result || q.result === f.result),
    )
  },
  listAgvMappings: async () => {
    await delay()
    return [...agvStationMappings]
  },
  listAgvTasks: async (f?: { keyword?: string; status?: string }) => {
    await delay()
    return agvTasks.filter((t) =>
      (!f?.keyword || includes(t.taskId, f.keyword) || includes(t.businessTaskCode, f.keyword))
      && (!f?.status || t.status === f.status),
    )
  },
  saveAgvTask: async (t: AgvTask) => {
    await delay(250)
    // businessTaskCode 幂等：重复提交返回原任务
    const dup = agvTasks.find((x) => x.businessTaskCode === t.businessTaskCode && x.taskId !== t.taskId)
    if (dup) return dup
    agvTasks.unshift({ ...t, taskId: nextId('TASK'), createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '), updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), status: 'CREATED' })
    return agvTasks[0]
  },
  listReportTasks: async () => {
    await delay()
    return [...reportTasks]
  },
}

function workorders() {
  return workOrders
}

/* ---------- 系统管理 ---------- */

export const systemApi = {
  listFactories: async () => {
    await delay()
    return [...factories]
  },
  listLines: async () => {
    await delay()
    return [...lines]
  },
  listWorkstations: async () => {
    await delay()
    return [...workstations]
  },
  listStations: deviceApi.listStations,
  listUsers: async (f?: { keyword?: string; role?: string }) => {
    await delay()
    return users.filter((u) =>
      (!f?.keyword || includes(u.login, f.keyword) || includes(u.name, f.keyword))
      && (!f?.role || u.role === f.role),
    )
  },
  saveUser: async (u: UserAccount) => {
    await delay(200)
    const i = users.findIndex((x) => x.userId === u.userId)
    if (i >= 0) users[i] = u
    else users.unshift({ ...u, userId: nextId('U'), createdAt: new Date().toISOString().slice(0, 10) })
    return u
  },
  listRoles: async (): Promise<SystemRole[]> => {
    await delay(80)
    return [...systemRoles]
  },
  listConfigs: async (f?: { keyword?: string; category?: string }) => {
    await delay()
    return configItems.filter((c) =>
      (!f?.keyword || includes(c.configKey, f.keyword) || includes(c.name, f.keyword))
      && (!f?.category || c.category === f.category),
    )
  },
  saveConfig: async (c: (typeof configItems)[number]) => {
    await delay(200)
    const i = configItems.findIndex((x) => x.configKey === c.configKey)
    if (i >= 0) configItems[i] = { ...c, version: configItems[i].version + 1, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), updatedBy: 'admin' }
    else configItems.unshift(c)
    return c
  },
  listLogs: async (f?: { keyword?: string; level?: string; service?: string }) => {
    await delay()
    return systemLogs.filter((l) =>
      (!f?.keyword || includes(l.message, f.keyword) || includes(l.operation, f.keyword) || includes(l.requestId, f.keyword))
      && (!f?.level || l.level === f?.level)
      && (!f?.service || l.service === f.service),
    )
  },
  listServiceHealth: async () => {
    await delay()
    return [...serviceHealth]
  },
  listBackups: async () => {
    await delay()
    return [...backups]
  },
  listVersions: async () => {
    await delay()
    return [...versions]
  },
}

/* ---------- 组织名称查询（供页面展示） ---------- */

export { lines, stations, equipments, tags, factories }
export { lineName, stationName, equipmentName, tagDisplayValue } from './db'
