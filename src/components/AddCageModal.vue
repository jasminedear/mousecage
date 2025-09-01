<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-[520px] p-6 relative">
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        @click="emit('close')"
        aria-label="关闭"
      >
        ✕
      </button>

      <h2 class="text-xl font-bold mb-4">添加笼位</h2>

      <!-- 模式切换 -->
      <div class="mb-4 inline-flex rounded-lg overflow-hidden border">
        <button
          class="px-4 py-2 text-sm"
          :class="mode === 'single' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'"
          @click="mode = 'single'"
        >
          单个添加
        </button>
        <button
          class="px-4 py-2 text-sm border-l"
          :class="mode === 'batch' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'"
          @click="mode = 'batch'"
        >
          批量添加
        </button>
      </div>

      <!-- 单个添加 -->
      <div v-if="mode === 'single'" class="space-y-4">
        <label class="block">
          <span class="text-gray-700">笼位名称</span>
          <input
            v-model="cageName"
            type="text"
            class="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如：A-1"
            @keydown.enter.prevent="submitSingle"
          />
        </label>

        <div class="flex items-center justify-end gap-2">
          <button class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" @click="emit('close')">取消</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" @click="submitSingle">
            添加
          </button>
        </div>
      </div>

      <!-- 批量添加 -->
      <div v-else class="space-y-4">
        <div class="rounded-lg border p-3 bg-gray-50">
          <div class="text-sm text-gray-600 mb-2">
            支持以下格式（可以混用）：
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>逐行：<code>A-1</code> 换行 <code>A-2</code></li>
              <li>逗号/空格分隔：<code>A-1, A-2, B-1</code></li>
              <li>范围：<code>A-1..A-10</code> 或 <code>A-01..20</code>（自动保留前导 0）</li>
            </ul>
          </div>

          <!-- 小生成器 -->
          <div class="grid grid-cols-2 gap-2 items-end mb-2">
            <label class="block">
              <span class="text-gray-700 text-sm">前缀（可含排名和连字符，例如 A-）</span>
              <input v-model="genPrefix" type="text" class="mt-1 w-full border rounded-lg px-3 py-1.5" placeholder="A-" />
            </label>
            <div class="grid grid-cols-3 gap-2">
              <label class="block">
                <span class="text-gray-700 text-sm">起</span>
                <input v-model.number="genStart" type="number" class="mt-1 w-full border rounded-lg px-3 py-1.5" placeholder="1" />
              </label>
              <label class="block">
                <span class="text-gray-700 text-sm">止</span>
                <input v-model.number="genEnd" type="number" class="mt-1 w-full border rounded-lg px-3 py-1.5" placeholder="12" />
              </label>
              <label class="block">
                <span class="text-gray-700 text-sm">位数</span>
                <input v-model.number="genPad" type="number" class="mt-1 w-full border rounded-lg px-3 py-1.5" placeholder="可空" min="0" />
              </label>
            </div>
            <div class="col-span-2 text-right">
              <button class="px-3 py-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm" @click="appendGenerated">
                生成加入文本框
              </button>
            </div>
          </div>

          <textarea
            v-model="batchText"
            rows="8"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="示例：&#10;A-1..A-12&#10;B-1, B-2, B-3&#10;C-01..20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-500">
          <div>最多一次添加 {{ MAX_BATCH }} 个，自动跳过重复名称。</div>
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" @click="emit('close')">取消</button>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" @click="submitBatch">
              批量添加
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMiceStore } from '@/stores/mice'

const emit = defineEmits(['close'])
const miceStore = useMiceStore()

// ✅ 纯 JS（不要写 TS 泛型）
const mode = ref('single')     // 'single' | 'batch'
const cageName = ref('')

// 批量
const batchText = ref('')
const MAX_BATCH = 200

// 生成器
const genPrefix = ref('A-')
const genStart = ref(1)
const genEnd = ref(12)
const genPad = ref(null)       // 位数，可为空

function pad(n, len) {
  const s = String(n)
  if (!len || len <= 0) return s
  return s.padStart(len, '0')
}

function appendGenerated() {
  if (!genPrefix.value || !Number.isFinite(genStart.value) || !Number.isFinite(genEnd.value)) {
    alert('请填写前缀、起止数字')
    return
  }
  const a = Number(genStart.value)
  const b = Number(genEnd.value)
  const from = Math.min(a, b)
  const to = Math.max(a, b)
  const names = []
  const padLen = Number.isFinite(genPad.value) ? Number(genPad.value) : 0
  for (let i = from; i <= to; i++) {
    names.push(`${genPrefix.value}${pad(i, padLen)}`)
  }
  const joined = names.join('\n')
  batchText.value = batchText.value ? (batchText.value.trim() + '\n' + joined) : joined
}

function submitSingle() {
  const name = (cageName.value || '').trim()
  if (!name) {
    alert('请输入笼位名称')
    return
  }
  if (miceStore.cages.some(c => c.name === name)) {
    alert(`已存在笼位：${name}`)
    return
  }
  miceStore.addCage({ name })
  cageName.value = ''
  emit('close')
}

// —— 批量解析 —— //
function parseBatchInput(text) {
  const raw = text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .flatMap(s => s.split(/\s+/))
    .filter(Boolean)

  const names = []
  const invalid = []

  for (const token of raw) {
    // 范围：A-1..A-12 / A-1..12 / A-01..20
    const m = token.match(/^([^\d]*)(\d+)\.\.(?:([^\d]*))?(\d+)$/)
    if (m) {
      const p1 = m[1], s1 = m[2], p2 = m[3], s2 = m[4]
      const prefix = (p2 != null ? p2 : p1) || ''
      const start = parseInt(s1, 10)
      const end = parseInt(s2, 10)
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        invalid.push(token)
        continue
      }
      const from = Math.min(start, end)
      const to = Math.max(start, end)
      const padLen = s1.length > 1 ? s1.length : 0
      for (let i = from; i <= to; i++) {
        names.push(`${prefix}${pad(i, padLen)}`)
      }
      continue
    }
    names.push(token)
  }
  return { names, invalid }
}

function submitBatch() {
  const text = (batchText.value || '').trim()
  if (!text) {
    alert('请在文本框中输入笼位名称或范围')
    return
  }

  const { names, invalid } = parseBatchInput(text)

  if (!names.length) {
    alert('没有解析到有效的笼位名称')
    return
  }
  if (names.length > MAX_BATCH) {
    alert(`一次最多添加 ${MAX_BATCH} 个（本次共 ${names.length} 个）`)
    return
  }

  const existing = new Set(miceStore.cages.map(c => c.name))
  const addedSet = new Set()
  const final = []
  for (const n of names) {
    if (!n) continue
    if (existing.has(n)) continue
    if (addedSet.has(n)) continue
    addedSet.add(n)
    final.push(n)
  }

  if (!final.length) {
    alert('解析成功，但全部与现有笼位重复，未添加。')
    return
  }

  final.forEach(name => miceStore.addCage({ name }))

  const report = [
    `成功添加：${final.length} 个`,
    invalid.length ? `无效项：${invalid.length} 个（如：${invalid.slice(0, 3).join('、')}）` : null,
    final.length + invalid.length < names.length ? `重复已跳过：${names.length - final.length - invalid.length} 个` : null
  ].filter(Boolean).join('\n')

  alert(report)
  batchText.value = ''
  emit('close')
}
</script>
