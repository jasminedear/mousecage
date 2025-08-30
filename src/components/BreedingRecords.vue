<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[900px] max-h-[90vh] overflow-y-auto p-6 relative">
      <!-- 关闭按钮 -->
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        @click="$emit('close')"
      >
        ✕
      </button>

      <!-- 顶部标题 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-pink-600 flex items-center gap-2">
          🍼 繁育记录
        </h1>
      </div>

      <!-- 筛选区 -->
      <div class="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg shadow-inner">
        <!-- 时间范围 -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">开始日期</label>
          <input type="date" v-model="startDate" class="border px-3 py-2 rounded" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">结束日期</label>
          <input type="date" v-model="endDate" class="border px-3 py-2 rounded" />
        </div>

        <!-- 类型筛选 -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">日志类型</label>
          <select v-model="filterType" class="border px-3 py-2 rounded">
            <option value="全部">全部</option>
            <option value="配种">配种</option>
            <option value="分笼">分笼</option>
            <option value="生产">生产</option>
            <option value="新生小鼠">新生小鼠</option>
          </select>
        </div>

        <!-- 清除筛选 -->
        <div class="flex items-end">
          <button
            @click="clearFilter"
            class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            清除筛选
          </button>
        </div>
      </div>

      <!-- 记录展示（卡片风格） -->
      <div class="space-y-4">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="bg-white p-4 rounded-lg shadow flex items-start gap-4 hover:bg-pink-50 transition"
        >
          <!-- 时间 -->
          <div class="text-gray-500 text-sm w-40 shrink-0">
            {{ record.time }}
          </div>

          <!-- 内容 -->
          <div class="flex-1">
            <!-- 标签 -->
            <span
              v-if="record.action.includes('配种')"
              class="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded mr-2"
            >
              配种
            </span>
            <span
              v-else-if="record.action.includes('分笼')"
              class="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded mr-2"
            >
              分笼
            </span>
            <span
              v-else-if="record.action.includes('生产')"
              class="inline-block px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded mr-2"
            >
              生产
            </span>
            <span
              v-else-if="record.action.includes('新生小鼠')"
              class="inline-block px-2 py-1 text-xs font-semibold text-pink-700 bg-pink-100 rounded mr-2"
            >
              新生
            </span>

            <!-- 描述 -->
            <span class="text-gray-800 break-words">{{ record.action }}</span>
          </div>
        </div>

        <!-- 空数据提示 -->
        <div v-if="filteredRecords.length === 0" class="text-center text-gray-400 py-10">
          没有符合条件的繁育记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useMiceStore } from "@/stores/mice"

const miceStore = useMiceStore()
defineEmits(["close"]) // 用于关闭弹窗

// 时间筛选
const startDate = ref("")
const endDate = ref("")
const filterType = ref("全部")

// 只取繁育相关的记录
const records = computed(() =>
  miceStore.records.filter(r =>
    ["配种", "分笼", "生产", "新生小鼠"].some(k => r.action.includes(k))
  )
)

// 过滤逻辑
const filteredRecords = computed(() => {
  return records.value.filter(r => {
    const recordTime = new Date(r.time.replace(/\//g, "-"))

    // 时间过滤
    const startOk = !startDate.value || recordTime >= new Date(startDate.value)
    const endOk = !endDate.value || recordTime <= new Date(endDate.value)

    // 类型过滤
    const typeOk =
      filterType.value === "全部" || r.action.includes(filterType.value)

    return startOk && endOk && typeOk
  })
})

// 清除筛选
function clearFilter() {
  startDate.value = ""
  endDate.value = ""
  filterType.value = "全部"
}
</script>
