import { defineStore } from 'pinia'
import AV from '@/leancloud'

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
        return true
      } catch (err) {
        this.message = '❌ 注册失败: ' + err.message
        return false
      }
    },

    async login(email, password) {
      try {
        const user = await AV.User.logIn(email, password)
        this.currentUser = user
        this.message = '✅ 登录成功'
        return true
      } catch (err) {
        this.message = '❌ 登录失败: ' + err.message
        this.currentUser = null
        return false
      }
    },

    async logout() {
      await AV.User.logOut()
      this.currentUser = null
      this.message = '已退出登录'
    }
  }
})