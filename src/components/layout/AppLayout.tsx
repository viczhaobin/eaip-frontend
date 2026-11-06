import { useLocation, useNavigate, NavLink } from 'react-router'
import { Boxes, ChevronsUpDown, ChevronsRight, Ellipsis, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { navGroups, crumbsFor } from '@/lib/nav'
import { logout } from '@/services/auth'
import { authStore } from '@/stores/authStore'

const COLLAPSED_KEY = 'eaip.sidebar.collapsed'
const CLOSED_GROUPS_KEY = 'eaip.sidebar.closedGroups'

function readClosedGroups(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLOSED_GROUPS_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userInfo = authStore.getState().userInfo
  const displayName = userInfo?.nickName || userInfo?.login || '未登录'
  const crumbs = crumbsFor(pathname)

  // 整栏收缩（移动端恒为图标栏）
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')
  // 二级菜单分组折叠
  const [closedGroups, setClosedGroups] = useState<Set<string>>(readClosedGroups)

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])
  useEffect(() => {
    localStorage.setItem(CLOSED_GROUPS_KEY, JSON.stringify([...closedGroups]))
  }, [closedGroups])

  const toggleGroup = (label: string) => {
    setClosedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // 当前路由所在分组自动展开
  const activeGroup = navGroups.find((g) => g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`)))?.label
  const isGroupOpen = (label: string) => label === activeGroup || !closedGroups.has(label)

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      <aside className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${collapsed ? 'w-14' : 'w-56'}`}>
        <div className={`flex h-14 shrink-0 items-center gap-2 border-b border-slate-100 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-2 ${collapsed ? '' : 'min-w-0'}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Boxes className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-tight">EAIP</div>
                <div className="truncate text-[11px] leading-tight text-slate-400">工业边缘采控与集成平台</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="hidden shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:block"
              title="收缩菜单栏"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 lg:px-3 lg:py-2">
          {navGroups.map((group, index) => {
            const open = collapsed || isGroupOpen(group.label)
            return (
              <div key={group.label} className={index > 0 ? 'mt-3 lg:mt-4' : ''}>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className="hidden w-full items-center justify-between rounded-md px-2.5 pb-1 text-left text-[11px] font-medium tracking-wide text-slate-400 hover:text-slate-600 lg:flex"
                    title={open ? '收起分组' : '展开分组'}
                  >
                    <span>{group.label}</span>
                    <ChevronsRight className={`h-3 w-3 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
                  </button>
                )}
                {open && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          title={collapsed ? item.label : undefined}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                            collapsed ? 'justify-center' : 'lg:justify-start'
                          } ${
                            active
                              ? 'bg-indigo-50 font-medium text-indigo-700'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-2">
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mb-1 hidden w-full items-center justify-center rounded-md py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:flex"
              title="展开菜单栏"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : 'lg:flex-row lg:gap-2 lg:px-1'}`}>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700"
              title={displayName}
            >
              {displayName[0] ?? '·'}
            </span>
            {!collapsed && <span className="hidden min-w-0 flex-1 truncate text-sm text-slate-700 lg:block">{displayName}</span>}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="账户菜单"
              >
                <Ellipsis className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align={collapsed ? 'center' : 'end'} className="w-52">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                {userInfo?.login && userInfo.login !== displayName && (
                  <div className="truncate px-2 pb-1 text-xs text-slate-400">{userInfo.login}</div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut /> 退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Breadcrumb className="hidden min-w-0 sm:block">
            <BreadcrumbList className="flex-nowrap text-xs sm:gap-1.5">
              {crumbs.map((crumb, i) => {
                const last = i === crumbs.length - 1
                return (
                  <Fragment key={`${crumb.label}-${i}`}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0">
                      {last || !crumb.to ? (
                        <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <button type="button" className="truncate" onClick={() => crumb.to && navigate(crumb.to)}>
                            {crumb.label}
                          </button>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-slate-400 md:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              演示数据模式
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-left transition-colors hover:border-slate-300 hover:bg-white">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium leading-tight">{userInfo?.login ?? '未登录'}</span>
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>当前登录</DropdownMenuLabel>
                <DropdownMenuItem disabled>
                  <span className="text-xs text-slate-500">{displayName}（{userInfo?.login}）</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut /> 退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="relative flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
