<template>
  <div>
    <!-- 未登录：显示登录按钮和登录界面 -->
    <div v-if="!userStore.currentUser">
      <button
        class="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded"
        @click="showLogin = !showLogin"
      >
        {{ showLogin ? '关闭' : '登录/注册' }}
      </button>
      <Login v-if="showLogin" />
    </div>

    <!-- 已登录：显示用户名 + 退出按钮 + CageGrid -->
    <div v-else>
      <div class="absolute top-4 right-4 flex items-center gap-2">
        <span class="text-gray-700">👤 {{ userStore.currentUser.getUsername() }}</span>
        <button @click="logout" class="bg-gray-300 px-3 py-1 rounded">退出</button>
      </div>
      <CageGrid />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { useMiceStore } from '@/stores/mice';
import CageGrid from '@/components/CageGrid.vue';
import Login from '@/components/Login.vue';

const showLogin = ref(false);
const userStore = useUserStore();
const miceStore = useMiceStore();

function logout() {
  userStore.logout();
  miceStore.resetState(); // 退出时清空数据
}

// 核心修复：监听用户状态变化
watch(
  () => userStore.currentUser,
  (newCurrentUser, oldCurrentUser) => {
    // 登录：从无到有
    if (newCurrentUser && !oldCurrentUser) {
      miceStore.loadFromCloud(newCurrentUser.id);
    } 
    // 退出：从有到无
    else if (!newCurrentUser && oldCurrentUser) {
      miceStore.resetState();
    }
  },
  { immediate: true }
);

</script>
