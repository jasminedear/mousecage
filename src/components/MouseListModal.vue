<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto p-6 relative">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="$emit('close')">✕</button>
      
      <h2 class="text-2xl font-bold mb-4">所有小鼠列表</h2>
      
      <div class="flex justify-between items-center mb-4">
        <input
          v-model="searchText"
          type="text"
          placeholder="按名字、基因型或笼位搜索..."
          class="flex-1 border px-3 py-2 rounded-md mr-4"
        />
        <div class="flex-shrink-0 text-sm text-gray-600">
          <span>共找到 {{ filteredMice.length }} 只老鼠</span>
          <span v-if="filteredMice.length > 0">
            | ♂ {{ summary.maleCount }} | ♀ {{ summary.femaleCount }}
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">编号</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">性别</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基因型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在笼位</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="mouse in filteredMice" :key="mouse.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ mouse.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ mouse.sex === 'male' ? '♂' : '♀' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ mouse.genotype }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ getCageName(mouse.cageId) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="!mouse.cageId"
                  @click="$emit('assign-to-cage', mouse)"
                  class="text-indigo-600 hover:text-indigo-900"
                >
                  分笼
                </button>
              </td>
            </tr>
            <tr v-if="filteredMice.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">没有找到匹配的老鼠</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMiceStore } from "@/stores/mice";

const emit = defineEmits(['close', 'assign-to-cage']); // 新增 assign-to-cage 事件
const miceStore = useMiceStore();
const searchText = ref('');

// 规范化后的老鼠数据
const normalizedMice = computed(() => miceStore.normalizedMice);

// 筛选功能
const filteredMice = computed(() => {
  const query = searchText.value.toLowerCase();
  if (!query) {
    return normalizedMice.value;
  }
  return normalizedMice.value.filter(mouse =>
    mouse.name.toLowerCase().includes(query) ||
    mouse.genotype.toLowerCase().includes(query) ||
    getCageName(mouse.cageId).toLowerCase().includes(query)
  );
});

// 统计功能
const summary = computed(() => {
  let maleCount = 0;
  let femaleCount = 0;
  
  filteredMice.value.forEach(mouse => {
    if (mouse.sex === 'male') {
      maleCount++;
    } else if (mouse.sex === 'female') {
      femaleCount++;
    }
  });
  
  return { maleCount, femaleCount };
});

function getCageName(cageId) {
  const cage = miceStore.cages.find(c => c.id === cageId);
  return cage ? cage.name : '未分笼';
}
</script>

<style scoped>
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.bg-black { background-color: #000; }
.bg-opacity-40 { background-color: rgba(0, 0, 0, 0.4); }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.z-50 { z-index: 50; }
.w-\[800px\] { width: 800px; }
.max-h-\[90vh\] { max-height: 90vh; }
.overflow-y-auto { overflow-y: auto; }
.p-6 { padding: 1.5rem; }
.relative { position: relative; }
</style>