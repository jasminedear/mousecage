<template>
  <div>
    <!-- 未登录：直接显示居中遮罩登录弹窗 -->
    <Login v-if="!userStore.currentUser" />

    <!-- 已登录：显示用户名 + 退出 + 主页面 -->
    <div v-else>
      <div class="fixed top-4 right-4 z-40 flex items-center gap-2">
        <span class="text-gray-700">👤 {{ userStore.currentUser.getUsername() }}</span>
        <button @click="logout" class="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">退出</button>
      </div>
      <CageGrid />
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useMiceStore } from '@/stores/mice'
import CageGrid from '@/components/CageGrid.vue'
import Login from '@/components/Login.vue'

const userStore = useUserStore()
const miceStore = useMiceStore()

function logout() {
  userStore.logout()
  miceStore.resetState() // 退出时清空数据
}

// 监听登录状态，登录后加载云端数据，退出时清空
watch(
  () => userStore.currentUser,
  (newU, oldU) => {
    if (newU && !oldU) {
      miceStore.loadFromCloud(newU.id)
    } else if (!newU && oldU) {
      miceStore.resetState()
    }
  },
  { immediate: true }
)
</script>
