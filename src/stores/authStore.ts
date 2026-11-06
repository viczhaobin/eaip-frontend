// 登录态存储（plain module，不入 React 状态树）：
// token / userInfo 落 localStorage，24h 过期兜底。

export interface UserInfo {
  login: string
  userId: string
  userName: string
  nickName: string
  avatar?: string
  email?: string
  phone?: string
}

const TOKEN_KEY = 'edgelink.access_token'
const USER_KEY = 'edgelink.user_info'
const EXPIRES_KEY = 'edgelink.auth_expires_at'
const TTL_MS = 24 * 60 * 60 * 1000

export interface AuthState {
  token: string
  userInfo: UserInfo | null
}

function readUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserInfo) : null
  } catch {
    return null
  }
}

function isExpired(): boolean {
  const at = Number(localStorage.getItem(EXPIRES_KEY) ?? 0)
  return !at || Date.now() > at
}

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export const authStore = {
  setAuth(token: string, userInfo: UserInfo) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + TTL_MS))
    notify()
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    notify()
  },
  getState(): AuthState {
    const token = localStorage.getItem(TOKEN_KEY) ?? ''
    if (!token || isExpired()) {
      if (token) authStore.clear()
      return { token: '', userInfo: null }
    }
    return { token, userInfo: readUser() }
  },
  /** 订阅登录态变化（登录成功/退出登录时触发），返回取消函数 */
  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

export function currentLogin(): string {
  return authStore.getState().userInfo?.login ?? ''
}

export function currentNickName(): string {
  return authStore.getState().userInfo?.nickName ?? ''
}

/** 成员匹配：login 优先、nickName 兜底（项目成员可能登记其中任一种） */
export function identityMatches(memberUser: string): boolean {
  const u = authStore.getState().userInfo
  if (!u) return false
  return (!!u.login && memberUser === u.login) || (!!u.nickName && memberUser === u.nickName)
}
