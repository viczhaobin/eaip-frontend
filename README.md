# EAIP 工业边缘采控与集成平台 — 前端

基于《EAIP_工业边缘采控与集成平台_产品功能详细设计规格书_V1.0》实现的前端：**React 19 + Vite 7 + TypeScript + Tailwind CSS 3 + shadcn/ui + React Router 7 + Recharts**。

## 功能覆盖（对应规格书附录 A 菜单，51 个页面）

| 模块 | 页面 |
| --- | --- |
| 运行总览 | 产线总览、设备状态、实时数据（2s 实时漂移模拟）、系统运行状态 |
| 设备采控 | 设备台账（编码唯一/连接测试/启停）、驱动管理、设备连接、点位管理（写白名单/版本）、采集任务、实时监控（受控写入）、控制指令（二次确认下发）、总站分站（循环父子校验） |
| 工业接口 | OPC UA 服务（Server/Client）、API 管理（目录/启停/统计）、MQTT 管理、数据适配器、字段映射、路由规则（模拟测试）、消息监控（重试/重发）、死信队列 |
| 工业数据 | 实时数据（质量码过滤/CSV 导出）、历史数据（聚合粒度）、趋势分析（多点位同图/报警区间叠加）、生产记录、工艺记录（配方版本/上下限偏差）、追溯查询（SN→工序→质量→报警） |
| 生产监控 | 组态画面（列表/预览/绑定校验占位）、设备监控、产线监控、工艺监控、看板管理 |
| 异常管理 | 实时报警（确认/取消/恢复状态机）、异常规则（6 类规则/试运行）、异常处理（工单闭环+时间轴）、通知策略、异常分析（MTTR/MTBF 口径说明） |
| 业务集成 | MES 系统、工单管理（版本幂等）、工序管控（进站校验 PASS/REJECT/WARNING）、生产上报（待补传/人工补传）、质量数据、AGV 接口（站点映射/任务幂等创建）、上报任务（暂停/恢复/补传） |
| 系统管理 | 工厂/产线（组织层级）、组织/用户、角色/权限（8 角色 RBAC 矩阵）、配置中心（草稿/发布/停用+二次确认）、系统日志（脱敏要求）、运行监控、备份恢复、版本升级（回滚） |

规格书关键约束已在交互中体现：质量码七态展示、sourceTimestamp/serverTimestamp 双时间戳、写 PLC 高风险操作二次确认与审计、状态机（设备/指令/消息/AGV/Andon）完整呈现、幂等键防重复、配置发布二次确认、状态颜色+文字双呈现。

## 数据模式

- **演示模式（当前）**：`src/services/mock/` 提供内存数据层与模拟延迟，实时值每 2s 漂移并偶发非 GOOD 质量码；登录页任意账号密码可登录（后端不可达时自动回退演示身份）。
- **接后端**：页面统一从 `@/services/mock` 取数；后端就绪后在该层替换为 `fetch('/api/v1/...')` 实现（接口形状见规格书第 9 章），页面代码无需改动。

## 开发

```bash
npm install
npm run dev      # http://localhost:3000，/api 代理到 http://localhost:9096
npm run build    # tsc -b && vite build（路由级代码分割）
npm run lint
```

## 目录

```
src/
├── pages/           # 51 个页面（overview/device/interface/data/scada/alarm/integration/system + LoginPage）
├── services/mock/   # Mock 数据层（db.ts 种子数据 + index.ts 服务函数 + 实时漂移）
├── types/domain.ts  # 领域模型（对应规格书 1.4 公共数据对象）
├── lib/             # nav 菜单（附录 A）、status 状态映射（质量码/状态机）
├── hooks/           # useRealtimeValues（实时订阅）
└── components/      # ui（shadcn 全量）/ common / layout（AppLayout）
```
