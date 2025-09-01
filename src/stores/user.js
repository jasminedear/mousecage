import { defineStore } from 'pinia'
import AV from '@/leancloud'
import { useMiceStore } from '@/stores/mice'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: AV.User.current() || null,
    message: ''
  }),

  actions: {
    async register(email, password) {
      try {
        const user = new AV.User()
        user.setUsername(email)
        user.setPassword(password)
        user.setEmail(email)
        await user.signUp()
        this.message = '✅ 注册成功，请登录'
      } catch (err) {
        this.message = '❌ 注册失败: ' + err.message
      }
    },

    async login(email, password) {
      try {
        const user = await AV.User.logIn(email, password)
        this.currentUser = user
        this.message = '✅ 登录成功'
      } catch (err) {
        this.message = '❌ 登录失败: ' + err.message
      }
    },

    async logout() {
      await AV.User.logOut()
      this.currentUser = null
      this.message = '已退出登录'

      // 清空 miceStore 的所有数据（笼位、老鼠、记录等）
      const miceStore = useMiceStore()
      miceStore.$reset()

      // 如果用了本地持久化，彻底清空存储
      localStorage.removeItem('mice')
      localStorage.removeItem('user')
    }
  }
})
