<template>
  <div class="max-w-sm mx-auto p-6 border rounded shadow">
    <h2 class="text-xl font-bold mb-4">登录 / 注册</h2>

    <input v-model="email" placeholder="邮箱" class="w-full border p-2 mb-3 rounded" />
    <input v-model="password" type="password" placeholder="密码" class="w-full border p-2 mb-3 rounded" />

    <div class="flex gap-2">
      <button @click="register" class="flex-1 bg-green-500 text-white py-2 rounded">注册</button>
      <button @click="login" class="flex-1 bg-blue-500 text-white py-2 rounded">登录</button>
    </div>

    <p v-if="userStore.message" class="mt-3 text-sm text-gray-600">{{ userStore.message }}</p>
    <p v-if="userStore.currentUser" class="mt-2 text-sm">
      当前用户: {{ userStore.currentUser.getUsername() }}
    </p>
    <button v-if="userStore.currentUser" @click="logout" class="mt-2 bg-gray-300 px-3 py-1 rounded">
      退出登录
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const email = ref('')
const password = ref('')
const userStore = useUserStore()

function register() {
  userStore.register(email.value, password.value)
}
function login() {
  userStore.login(email.value, password.value)
}
function logout() {
  userStore.logout()
}
</script>
