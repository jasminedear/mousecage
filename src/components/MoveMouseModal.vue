<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-96 relative shadow-lg">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>

      <h2 class="text-xl font-bold mb-4">✈️ 移动老鼠</h2>
      <p class="mb-2">当前老鼠：<strong>{{ mouse.name }}</strong></p>

      <label class="block mb-4">
        <span class="text-gray-700">选择目标笼子</span>
        <select v-model="targetCageId" class="w-full border px-3 py-2 rounded mt-1">
          <option disabled value="">请选择笼子</option>
          <option v-for="cage in cages" :key="cage.id" :value="cage.id">
            {{ cage.name }}
          </option>
        </select>
      </label>

      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" @click="emit('close')">取消</button>
        <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" @click="moveMouse">确认移动</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useMiceStore } from "@/stores/mice"

const props = defineProps({
  mouse: { type: Object, required: true },
  cages: { type: Array, required: true }
})
const emit = defineEmits(["close"])
const miceStore = useMiceStore()

const targetCageId = ref("")

function moveMouse() {
  if (!targetCageId.value) {
    alert("请选择目标笼子")
    return
  }
  miceStore.mice = miceStore.mice.map(m =>
    m.id === props.mouse.id ? { ...m, cageId: targetCageId.value } : m
  )
  miceStore.addRecord(`移动老鼠 ${props.mouse.name} → 笼位ID:${targetCageId.value}`)
  emit("close")
}
</script>
