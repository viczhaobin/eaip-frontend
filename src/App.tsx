import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { authStore } from '@/stores/authStore'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const OverviewLine = lazy(() => import('./pages/overview/LineOverview'))
const OverviewEquipment = lazy(() => import('./pages/overview/EquipmentStatus'))
const OverviewRealtime = lazy(() => import('./pages/overview/RealtimeData'))
const OverviewSystem = lazy(() => import('./pages/overview/SystemStatus'))
const DeviceEquipments = lazy(() => import('./pages/device/Equipments'))
const DeviceDrivers = lazy(() => import('./pages/device/Drivers'))
const DeviceConnections = lazy(() => import('./pages/device/Connections'))
const DeviceTags = lazy(() => import('./pages/device/Tags'))
const DeviceCollectTasks = lazy(() => import('./pages/device/CollectTasks'))
const DeviceMonitor = lazy(() => import('./pages/device/Monitor'))
const DeviceCommands = lazy(() => import('./pages/device/Commands'))
const DeviceStations = lazy(() => import('./pages/device/Stations'))
const IfOpcua = lazy(() => import('./pages/interface/Opcua'))
const IfApi = lazy(() => import('./pages/interface/ApiManage'))
const IfMqtt = lazy(() => import('./pages/interface/Mqtt'))
const IfAdapters = lazy(() => import('./pages/interface/Adapters'))
const IfMappings = lazy(() => import('./pages/interface/Mappings'))
const IfRoutes = lazy(() => import('./pages/interface/Routes'))
const IfMessages = lazy(() => import('./pages/interface/Messages'))
const IfDeadLetters = lazy(() => import('./pages/interface/DeadLetters'))
const DataRealtime = lazy(() => import('./pages/data/RealtimeData'))
const DataHistory = lazy(() => import('./pages/data/HistoryData'))
const DataTrends = lazy(() => import('./pages/data/Trends'))
const DataProduction = lazy(() => import('./pages/data/ProductionRecords'))
const DataRecipes = lazy(() => import('./pages/data/RecipeRecords'))
const DataTrace = lazy(() => import('./pages/data/TraceQuery'))
const ScadaScreens = lazy(() => import('./pages/scada/Screens'))
const ScadaEquipment = lazy(() => import('./pages/scada/EquipmentMonitor'))
const ScadaLine = lazy(() => import('./pages/scada/LineMonitor'))
const ScadaProcess = lazy(() => import('./pages/scada/ProcessMonitor'))
const ScadaBoards = lazy(() => import('./pages/scada/Boards'))
const AlarmRealtime = lazy(() => import('./pages/alarm/RealtimeAlarms'))
const AlarmRules = lazy(() => import('./pages/alarm/Rules'))
const AlarmTickets = lazy(() => import('./pages/alarm/Tickets'))
const AlarmPolicies = lazy(() => import('./pages/alarm/Policies'))
const AlarmAnalysis = lazy(() => import('./pages/alarm/Analysis'))
const IntMes = lazy(() => import('./pages/integration/MesSystems'))
const IntWorkorders = lazy(() => import('./pages/integration/WorkOrders'))
const IntOperations = lazy(() => import('./pages/integration/Operations'))
const IntReport = lazy(() => import('./pages/integration/ProductionReport'))
const IntQuality = lazy(() => import('./pages/integration/QualityData'))
const IntAgv = lazy(() => import('./pages/integration/AgvInterface'))
const IntTasks = lazy(() => import('./pages/integration/ReportTasks'))
const SysOrg = lazy(() => import('./pages/system/OrgStructure'))
const SysUsers = lazy(() => import('./pages/system/Users'))
const SysRoles = lazy(() => import('./pages/system/Roles'))
const SysConfigs = lazy(() => import('./pages/system/ConfigCenter'))
const SysLogs = lazy(() => import('./pages/system/SystemLogs'))
const SysMonitor = lazy(() => import('./pages/system/RuntimeMonitor'))
const SysBackup = lazy(() => import('./pages/system/BackupRestore'))
const SysUpgrade = lazy(() => import('./pages/system/VersionUpgrade'))
/** 登录守卫：无 token → /login?redirect=<当前路径+query> */
function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { token } = authStore.getState()
  if (!token) {
    const target = location.pathname + location.search + location.hash
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-slate-400">页面加载中…</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/overview/line" replace />} />

        {/* 运行总览 */}
        <Route path="/overview/line" element={<RequireAuth><OverviewLine /></RequireAuth>} />
        <Route path="/overview/equipment" element={<RequireAuth><OverviewEquipment /></RequireAuth>} />
        <Route path="/overview/realtime" element={<RequireAuth><OverviewRealtime /></RequireAuth>} />
        <Route path="/overview/system" element={<RequireAuth><OverviewSystem /></RequireAuth>} />

        {/* 设备采控 */}
        <Route path="/device/equipments" element={<RequireAuth><DeviceEquipments /></RequireAuth>} />
        <Route path="/device/drivers" element={<RequireAuth><DeviceDrivers /></RequireAuth>} />
        <Route path="/device/connections" element={<RequireAuth><DeviceConnections /></RequireAuth>} />
        <Route path="/device/tags" element={<RequireAuth><DeviceTags /></RequireAuth>} />
        <Route path="/device/collect-tasks" element={<RequireAuth><DeviceCollectTasks /></RequireAuth>} />
        <Route path="/device/monitor" element={<RequireAuth><DeviceMonitor /></RequireAuth>} />
        <Route path="/device/commands" element={<RequireAuth><DeviceCommands /></RequireAuth>} />
        <Route path="/device/stations" element={<RequireAuth><DeviceStations /></RequireAuth>} />

        {/* 工业接口 */}
        <Route path="/interface/opcua" element={<RequireAuth><IfOpcua /></RequireAuth>} />
        <Route path="/interface/api" element={<RequireAuth><IfApi /></RequireAuth>} />
        <Route path="/interface/mqtt" element={<RequireAuth><IfMqtt /></RequireAuth>} />
        <Route path="/interface/adapters" element={<RequireAuth><IfAdapters /></RequireAuth>} />
        <Route path="/interface/mappings" element={<RequireAuth><IfMappings /></RequireAuth>} />
        <Route path="/interface/routes" element={<RequireAuth><IfRoutes /></RequireAuth>} />
        <Route path="/interface/messages" element={<RequireAuth><IfMessages /></RequireAuth>} />
        <Route path="/interface/dead-letters" element={<RequireAuth><IfDeadLetters /></RequireAuth>} />

        {/* 工业数据 */}
        <Route path="/data/realtime" element={<RequireAuth><DataRealtime /></RequireAuth>} />
        <Route path="/data/history" element={<RequireAuth><DataHistory /></RequireAuth>} />
        <Route path="/data/trends" element={<RequireAuth><DataTrends /></RequireAuth>} />
        <Route path="/data/production" element={<RequireAuth><DataProduction /></RequireAuth>} />
        <Route path="/data/recipes" element={<RequireAuth><DataRecipes /></RequireAuth>} />
        <Route path="/data/trace" element={<RequireAuth><DataTrace /></RequireAuth>} />

        {/* 生产监控 */}
        <Route path="/scada/screens" element={<RequireAuth><ScadaScreens /></RequireAuth>} />
        <Route path="/scada/equipment" element={<RequireAuth><ScadaEquipment /></RequireAuth>} />
        <Route path="/scada/line" element={<RequireAuth><ScadaLine /></RequireAuth>} />
        <Route path="/scada/process" element={<RequireAuth><ScadaProcess /></RequireAuth>} />
        <Route path="/scada/boards" element={<RequireAuth><ScadaBoards /></RequireAuth>} />

        {/* 异常管理 */}
        <Route path="/alarm/realtime" element={<RequireAuth><AlarmRealtime /></RequireAuth>} />
        <Route path="/alarm/rules" element={<RequireAuth><AlarmRules /></RequireAuth>} />
        <Route path="/alarm/tickets" element={<RequireAuth><AlarmTickets /></RequireAuth>} />
        <Route path="/alarm/policies" element={<RequireAuth><AlarmPolicies /></RequireAuth>} />
        <Route path="/alarm/analysis" element={<RequireAuth><AlarmAnalysis /></RequireAuth>} />

        {/* 业务集成 */}
        <Route path="/integration/mes" element={<RequireAuth><IntMes /></RequireAuth>} />
        <Route path="/integration/workorders" element={<RequireAuth><IntWorkorders /></RequireAuth>} />
        <Route path="/integration/operations" element={<RequireAuth><IntOperations /></RequireAuth>} />
        <Route path="/integration/report" element={<RequireAuth><IntReport /></RequireAuth>} />
        <Route path="/integration/quality" element={<RequireAuth><IntQuality /></RequireAuth>} />
        <Route path="/integration/agv" element={<RequireAuth><IntAgv /></RequireAuth>} />
        <Route path="/integration/tasks" element={<RequireAuth><IntTasks /></RequireAuth>} />

        {/* 系统管理 */}
        <Route path="/system/org" element={<RequireAuth><SysOrg /></RequireAuth>} />
        <Route path="/system/users" element={<RequireAuth><SysUsers /></RequireAuth>} />
        <Route path="/system/roles" element={<RequireAuth><SysRoles /></RequireAuth>} />
        <Route path="/system/configs" element={<RequireAuth><SysConfigs /></RequireAuth>} />
        <Route path="/system/logs" element={<RequireAuth><SysLogs /></RequireAuth>} />
        <Route path="/system/monitor" element={<RequireAuth><SysMonitor /></RequireAuth>} />
        <Route path="/system/backup" element={<RequireAuth><SysBackup /></RequireAuth>} />
        <Route path="/system/upgrade" element={<RequireAuth><SysUpgrade /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/overview/line" replace />} />
      </Routes>
      </Suspense>
      <Toaster position="top-center" richColors />
    </>
  )
}
