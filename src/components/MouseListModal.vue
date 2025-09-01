<template>
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white w-full max-w-4xl rounded-xl shadow-lg p-5">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          📋 所有老鼠（{{ filteredMice.length }}）
        </h3>
        <div class="flex items-center gap-2">
          <input
            v-model="q"
            type="text"
            placeholder="搜索：名称 / 基因型 / 分组"
            class="border rounded px-3 py-1 text-sm w-64"
          />
          <button
            class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            @click="$emit('close')"
          >
            关闭
          </button>
        </div>
      </div>

      <!-- 空态 -->
      <div v-if="!filteredMice.length" class="text-center text-gray-500 py-8">
        暂无数据或未匹配到结果
      </div>

      <!-- 列表 -->
      <div v-else class="overflow-auto max-h-[65vh]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-50">
            <tr class="text-gray-600">
              <th class="text-left px-3 py-2">名称</th>
              <th class="text-left px-3 py-2">性别</th>
              <th class="text-left px-3 py-2">基因型</th>
              <th class="text-left px-3 py-2">分组</th>
              <th class="text-left px-3 py-2">所在笼位</th>
              <th class="text-right px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mouse in filteredMice" :key="mouse.id" class="border-t">
              <td class="px-3 py-2 font-medium text-gray-800">
                {{ mouse.name || '未命名' }}
              </td>
              <td class="px-3 py-2">
                {{ displaySex(mouse.sex) }}
              </td>
              <td class="px-3 py-2">
                {{ mouse.genotype || '—' }}
              </td>
              <td class="px-3 py-2">
                {{ mouse.group || '—' }}
              </td>
              <td class="px-3 py-2">
                {{ getCageName(mouse.cageId) }}
              </td>
              <td class="px-3 py-2 text-right">
                <!-- 关键：不再用 v-if 限制，任何老鼠都可以“分笼/移动” -->
                <button
                  @click="$emit('assign-to-cage', mouse)"
                  class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  :title="mouse.cageId ? '移动到其他笼位' : '分笼'"
                >
                  {{ mouse.cageId ? '移动' : '分笼' }}
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
import { computed, ref } from 'vue'
import { useMiceStore } from '@/stores/mice'

const emit = defineEmits(['close', 'assign-to-cage'])
const miceStore = useMiceStore()

// 统一后的数据：确保 sex 为 'male'/'female'
const mice = computed(() => miceStore.normalizedMice)

// 搜索
const q = ref('')
const filteredMice = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) return mice.value
  return mice.value.filter(m => {
    const name = (m.name || '').toLowerCase()
    const genotype = (m.genotype || '').toLowerCase()
    const group = (m.group || '').toLowerCase()
    return name.includes(keyword) || genotype.includes(keyword) || group.includes(keyword)
  })
})

// 展示性别符号
function displaySex(sex) {
  if (sex === 'male' || sex === '♂') return '♂'
  if (sex === 'female' || sex === '♀') return '♀'
  return '—'
}

// 笼位名称
function getCageName(cageId) {
  return miceStore.getCageName(cageId)
}
</script>
