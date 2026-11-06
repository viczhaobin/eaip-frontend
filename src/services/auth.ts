// 纯本地演示模式登录：不发起任何后端请求，任意账号密码直接放行
// 后端就绪后恢复为：POST /api/v1/auth/login 换取 token，前端以 Authorization: Bearer 携带
import { authStore, type UserInfo } from '@/stores/authStore'

/** 演示登录：以输入的用户名作为身份，token 为本地标记（密码不校验） */
export async function loginByAccount(username: string, password: string) {
  void password
  const login = username.trim() || 'demo'
  const userInfo: UserInfo = {
    login,
    userId: login,
    userName: login,
    nickName: login,
  }
  authStore.setAuth(`demo-token-${Date.now()}`, userInfo)
  return { token: 'demo', user: userInfo }
}

/** 退出登录：本地清理（演示模式无后端会话） */
export async function logout() {
  authStore.clear()
}
