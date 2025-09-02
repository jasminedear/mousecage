<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-2xl w-[1100px] max-h-[90vh] overflow-y-auto p-6 relative">
      <button class="absolute top-3 right-3 text-gray-500 hover:text-gray-800" @click="$emit('close')">✕</button>

      <div class="mb-4 flex items-center gap-3">
        <h2 class="text-2xl font-bold">🗺️ 笼位一览</h2>

        <!-- 行筛选 -->
        <select v-model="rowFilter" class="ml-auto border px-2 py-1 rounded">
          <option value="">全部排</option>
          <option v-for="r in allRows" :key="r" :value="r">第{{ r }}排</option>
        </select>
        <!-- 列数(每排) -->
        <label class="text-sm text-gray-600 flex items-center gap-1">
          每排列数
          <input v-model.number="colsPerRow" type="number" min="1" class="w-16 border px-2 py-1 rounded">
        </label>
      </div>

      <!-- 每一排渲染一个表格 -->
      <div v-for="row in shownRows" :key="row" class="mb-8">
        <div class="text-lg font-semibold mb-2">第{{ row }}排</div>
        <div class="overflow-x-auto rounded border">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-2 py-2 text-left w-24">#</th>
                <th v-for="col in colsPerRow" :key="col" class="px-2 py-2 text-center">
                  {{ two(col) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 横向一行 -->
              <tr>
                <td class="px-2 py-2 font-medium bg-gray-50">笼位</td>
                <td v-for="col in colsPerRow" :key="'n-'+col" class="px-2 py-2 text-center">
                  {{ cell(row, col)?.name || '-' }}
                </td>
              </tr>
              <tr>
                <td class="px-2 py-2 font-medium bg-gray-50">数量</td>
                <td v-for="col in colsPerRow" :key="'c-'+col" class="px-2 py-2 text-center">
                  <span v-if="cell(row, col)">
                    {{ cell(row, col).mice.length }}只
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
              <tr>
                <td class="px-2 py-2 font-medium bg-gray-50">基因型</td>
                <td v-for="col in colsPerRow" :key="'g-'+col" class="px-2 py-2 text-center">
                  <span v-if="cell(row, col)">
                    {{ summarizeGenotype(cell(row, col).mice) || '—' }}
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
              <tr>
                <td class="px-2 py-2 font-medium bg-gray-50">个体</td>
                <td v-for="col in colsPerRow" :key="'l-'+col" class="px-2 py-2 align-top">
                  <div
                    v-if="cell(row, col)"
                    :class="['rounded p-2 border', bgClass(cell(row, col).mice), 'min-h-[60px]']"
                  >
                    <div class="leading-6">
                      <template v-for="(m, idx) in cell(row, col).mice" :key="m.id">
                        <span
                          :class="[
                            'px-1 rounded',
                            m.sex==='male' ? 'text-blue-700' :
                            m.sex==='female' ? 'text-red-700' : 'text-gray-700'
                          ]"
                          :title="m.genotype || ''"
                        >
                          {{ m.name }}
                        </span>
                        <span v-if="idx < cell(row, col).mice.length - 1">、</span>
                      </template>
                      <span v-if="!cell(row, col).mice.length" class="text-gray-400">—</span>
                    </div>
                  </div>
                  <div v-else class="text-center text-gray-400">—</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMiceStore } from '@/stores/mice'

const props = defineProps({
  cages: { type: Array, default: () => [] }
})
defineEmits(['close'])
const miceStore = useMiceStore()

// 工具：列头两位数
function two(v) {
  return String(v).padStart(2, '0')
}

// 解析：假设 cage.name 类似 “A-01-03”，取第1段为排，最后一段为列号
function parseRow(name) {
  if (!name) return '未分组'
  const parts = String(name).split('-').map(s => s.trim()).filter(Boolean)
  if (parts.length === 1) return parts[0]
  return parts[0]
}
function parseCol(name) {
  if (!name) return null
  const parts = String(name).split('-').map(s => s.trim()).filter(Boolean)
  const last = parts[parts.length - 1]
  const n = parseInt(last, 10)
  return isNaN(n) ? null : n
}

// 所有 cages 源
const cagesAll = computed(() => (props.cages?.length ? props.cages : miceStore.cages))

// 行列表 & 每排的“列→cage”映射
const rowMap = computed(() => {
  const map = {}
  for (const c of cagesAll.value) {
    const r = parseRow(c.name) || '未分组'
    const col = parseCol(c.name)
    if (!map[r]) map[r] = {}
    if (col != null) map[r][col] = c
  }
  return map
})

const allRows = computed(() => Object.keys(rowMap.value).sort((a, b) => a.localeCompare(b, 'zh')))

const rowFilter = ref('')
const colsPerRow = ref(4) // 你图里每排 4 列

const shownRows = computed(() => (rowFilter.value ? [rowFilter.value] : allRows.value))

// 单元格数据
function cell(row, col) {
  const cage = rowMap.value?.[row]?.[col]
  if (!cage) return null
  const mice = miceStore.normalizedMice
    .filter(m => m.cageId === cage.id)
    .sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh'))
  return { cage, name: cage.name, mice }
}

function summarizeGenotype(mice) {
  const set = new Set(mice.map(m => m.genotype).filter(Boolean))
  if (!set.size) return ''
  if (set.size === 1) return [...set][0]
  return [...set].join(' / ')
}

function bgClass(mice) {
  // 混合=粉，纯雄=蓝，纯雌=红，含幼鼠=紫
  const hasPup = mice.some(m => Array.isArray(m.statuses) && m.statuses.includes('幼鼠'))
  const males = mice.filter(m => m.sex === 'male').length
  const females = mice.filter(m => m.sex === 'female').length
  if (hasPup) return 'bg-purple-50 border-purple-200'
  if (males && females) return 'bg-pink-50 border-pink-200'
  if (males) return 'bg-blue-50 border-blue-200'
  if (females) return 'bg-red-50 border-red-200'
  return 'bg-gray-50 border-gray-200'
}
</script>

<style scoped>
/* 适度紧凑的表格 */
table { border-collapse: separate; border-spacing: 0; }
th, td { border-bottom: 1px solid #e5e7eb; }
tbody tr:last-child td { border-bottom: 0; }
</style>
