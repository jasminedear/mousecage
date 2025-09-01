<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          💀 死亡老鼠（{{ deadMice.length }}）
        </h3>
        <div class="flex items-center gap-2">
          <button
            v-if="deadMice.length"
            class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            @click="handleClearAll"
          >
            全部删除
          </button>
          <button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" @click="$emit('close')">
            关闭
          </button>
        </div>
      </div>

      <div v-if="!deadMice.length" class="text-center text-gray-500 py-8">
        暂无死亡记录
      </div>

      <div v-else class="overflow-auto max-h-[60vh]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-50">
            <tr class="text-gray-600">
              <th class="text-left px-3 py-2">名称</th>
              <th class="text-left px-3 py-2">性别</th>
              <th class="text-left px-3 py-2">基因型</th>
              <th class="text-left px-3 py-2">分组</th>
              <th class="text-left px-3 py-2">死亡日期</th>
              <th class="text-left px-3 py-2">死亡原因</th>
              <th class="text-right px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in deadMice" :key="m.id" class="border-t">
              <td class="px-3 py-2 font-medium text-gray-800">{{ m.name || '未命名' }}</td>
              <td class="px-3 py-2">{{ displaySex(m.sex) }}</td>
              <td class="px-3 py-2">{{ m.genotype || '—' }}</td>
              <td class="px-3 py-2">{{ m.group || '—' }}</td>
              <td class="px-3 py-2 whitespace-nowrap">{{ m.deathDate || '—' }}</td>
              <td class="px-3 py-2">{{ m.causeOfDeath || '未填写' }}</td>
              <td class="px-3 py-2 text-right">
                <button
                  class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  @click="handleDelete(m)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMiceStore } from '@/stores/mice'

const emit = defineEmits(['close'])
const miceStore = useMiceStore()

const deadMice = computed(() => miceStore.deadMice)

// 仅展示用：英文 -> 符号
function displaySex(sex) {
  if (sex === 'male' || sex === '♂') return '♂'
  if (sex === 'female' || sex === '♀') return '♀'
  return '—'
}

function handleDelete(m) {
  if (confirm(`确定删除这条死亡记录？\n${m.name || '未命名'}（原因：${m.causeOfDeath || '未填写'}）`)) {
    miceStore.deleteDeadMouse(m.id)
    // 如需立刻落库可同时执行：
    // miceStore.saveToCloud({ silent: true })
  }
}

function handleClearAll() {
  if (!deadMice.value.length) return
  if (confirm(`确定清空全部 ${deadMice.value.length} 条死亡记录？该操作不可恢复。`)) {
    miceStore.clearAllDeadMice()
    // 如需立刻落库可同时执行：
    // miceStore.saveToCloud({ silent: true })
  }
}
</script>
