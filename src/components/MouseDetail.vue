<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto p-6 relative">
      <!-- 关闭按钮 -->
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>

      <h2 class="text-2xl font-bold mb-4">🐭 {{ localMouse.name }} 详情</h2>

      <!-- 基本信息编辑 -->
      <div class="space-y-3">
        <label class="block">
          <span class="text-gray-700">编号</span>
          <input
            v-model="localMouse.name"
            @input="autoSetSex"
            type="text"
            class="w-full border px-3 py-2 rounded mt-1"
            placeholder="如 M01 / F01"
          />
        </label>

        <label class="block">
          <span class="text-gray-700">性别</span>
          <select v-model="localMouse.sex" class="w-full border px-3 py-2 rounded mt-1">
            <option value="♂">雄性 (♂)</option>
            <option value="♀">雌性 (♀)</option>
          </select>
        </label>

        <label class="block">
          <span class="text-gray-700">基因型</span>
          <input v-model="localMouse.genotype" type="text" class="w-full border px-3 py-2 rounded mt-1" />
        </label>

        <label class="block">
          <span class="text-gray-700">出生日期</span>
          <input v-model="localMouse.birthDate" type="date" class="w-full border px-3 py-2 rounded mt-1" />
        </label>

        <label class="block">
          <span class="text-gray-700">实验分组</span>
          <input v-model="localMouse.group" type="text" class="w-full border px-3 py-2 rounded mt-1" />
        </label>

        <label class="block">
          <span class="text-gray-700">备注</span>
          <textarea v-model="localMouse.notes" class="w-full border px-3 py-2 rounded mt-1"></textarea>
        </label>

        <!-- 状态多选 -->
        <div>
          <span class="text-gray-700">状态</span>
          <div class="flex gap-4 mt-1">
            <label v-for="s in statusOptions" :key="s" class="flex items-center gap-1">
              <input type="checkbox" v-model="localMouse.statuses" :value="s" />
              {{ s }}
            </label>
          </div>
        </div>
      </div>

      <hr class="my-4"/>

      <!-- 配偶 -->
      <div>
        <h3 class="text-lg font-semibold mb-2">❤️ 配偶</h3>
        <div v-if="spouses.length">
          <ul class="list-disc list-inside">
            <li
              v-for="s in spouses"
              :key="s.id"
              class="cursor-pointer text-blue-600 hover:underline"
              @click="openOtherDetail(s)"
            >
              {{ s.name }} ({{ s.sex }})
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- 子女 -->
      <div>
        <h3 class="text-lg font-semibold mb-2">👶 子女</h3>
        <div v-if="children.length">
          <ul class="list-disc list-inside">
            <li
              v-for="c in children"
              :key="c.id"
              class="cursor-pointer text-green-600 hover:underline"
              @click="openOtherDetail(c)"
            >
              {{ c.name }} ({{ c.sex }})
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- 父母 -->
      <div>
        <h3 class="text-lg font-semibold mb-2">👨‍👩‍👧 父母</h3>
        <div v-if="father || mother">
          <p v-if="father" class="cursor-pointer text-purple-600 hover:underline" @click="openOtherDetail(father)">
            父：{{ father.name }} (♂)
          </p>
          <p v-if="mother" class="cursor-pointer text-pink-600 hover:underline" @click="openOtherDetail(mother)">
            母：{{ mother.name }} (♀)
          </p>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" @click="emit('close')">取消</button>
        <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" @click="saveChanges">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from "vue"
import { useMiceStore } from "@/stores/mice"

const props = defineProps({
  mouse: { type: Object, required: true }
})
const emit = defineEmits(["close", "open-other"]) // open-other 用来点配偶/子女时打开详情
const miceStore = useMiceStore()

const statusOptions = ["怀孕", "哺乳", "幼鼠", "其他"]

// === 本地副本 ===
const localMouse = reactive({ statuses: [], ...props.mouse })

// === 配偶 ===
const spouses = computed(() => {
  if (!props.mouse.spouseIds) return []
  return props.mouse.spouseIds.map(id => miceStore.mice.find(m => m.id === id)).filter(Boolean)
})

// === 子女 ===
const children = computed(() => {
  if (!props.mouse.childrenIds) return []
  return props.mouse.childrenIds.map(id => miceStore.mice.find(m => m.id === id)).filter(Boolean)
})

// === 父母 ===
const father = computed(() => props.mouse.fatherId ? miceStore.mice.find(m => m.id === props.mouse.fatherId) : null)
const mother = computed(() => props.mouse.motherId ? miceStore.mice.find(m => m.id === props.mouse.motherId) : null)

// === 自动识别性别 ===
function autoSetSex() {
  if (localMouse.name?.startsWith("M")) {
    localMouse.sex = "♂"
  } else if (localMouse.name?.startsWith("F")) {
    localMouse.sex = "♀"
  }
}

// === 保存 ===
function saveChanges() {
  miceStore.mice = miceStore.mice.map(m => m.id === props.mouse.id ? { ...localMouse } : m)
  miceStore.addRecord(`更新老鼠 ${localMouse.name} 信息`)
  emit("close")
}

// === 打开配偶/子女详情 ===
function openOtherDetail(mouse) {
  emit("open-other", mouse)
}
</script>
