<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-96 p-6 relative">
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        @click="emit('close')"
      >
        ✕
      </button>

      <h2 class="text-xl font-bold mb-4">添加笼位</h2>

      <div class="space-y-3">
        <label class="block">
          <span class="text-gray-700">笼位名称</span>
          <input
            v-model="cageName"
            type="text"
            class="w-full border px-3 py-2 rounded mt-1"
            placeholder="如：A-01"
          />
        </label>
      </div>

      <div class="mt-4 flex justify-end space-x-2">
        <button
          class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          @click="handleAddCage"
        >
          确认添加
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useMiceStore } from "@/stores/mice"

const cageName = ref("")
const miceStore = useMiceStore()
const emit = defineEmits(["close"])

function handleAddCage() {
  // ✅ 修正了逻辑：如果笼位名称为空，直接返回，不再执行后续代码
  if (!cageName.value.trim()) {
    alert("请输入笼位名称，例如 A-01")
    return
  }
  
  // ✅ 将正确的逻辑移到 if 块之外
  console.log("调用 addCage:", cageName.value)
  miceStore.addCage({ name: cageName.value })
  console.log("store.cages:", miceStore.cages)

  // ✅ 清空输入框
  cageName.value = ""

  // ✅ 关闭弹窗
  emit("close")
}
</script>