<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">📂 测试导入</h2>

    <!-- 导入按钮 -->
    <button
      @click="triggerFileInput"
      class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
    >
      📂 导入档案
    </button>

    <!-- 隐藏文件选择 -->
    <input
      type="file"
      ref="fileInput"
      class="hidden"
      @change="handleImport"
      accept=".json,.csv,.xlsx"
    />

    <pre class="mt-4 bg-gray-100 p-2 text-sm">{{ preview }}</pre>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { importFile } from "@/utils/import"

const fileInput = ref(null)
const preview = ref("（导入的数据会显示在这里）")

function triggerFileInput() {
  if (!fileInput.value) {
    console.error("⚠️ fileInput 没挂载成功")
    return
  }
  fileInput.value.click()
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) {
    console.warn("没有选中文件")
    return
  }

  try {
    const data = await importFile(file)
    console.log("✅ 导入结果:", data)
    preview.value = JSON.stringify(data, null, 2)
  } catch (err) {
    console.error("❌ 导入失败:", err)
    preview.value = "❌ 导入失败，请检查控制台"
  } finally {
    e.target.value = null
  }
}
</script>
