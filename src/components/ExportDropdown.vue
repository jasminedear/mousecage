<template>
  <div class="relative inline-block">
    <button
      @click="toggleDropdown"
      class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
    >
      导出 ▼
    </button>

    <div
      v-if="show"
      class="absolute mt-2 w-40 bg-white border rounded-lg shadow-lg z-50"
    >
      <button
        class="block w-full px-4 py-2 text-left hover:bg-gray-100"
        @click="download('json')"
      >
        📦 存档 JSON
      </button>
      <button
        class="block w-full px-4 py-2 text-left hover:bg-gray-100"
        @click="download('csv')"
      >
        📄 CSV
      </button>
      <button
       class="block w-full px-4 py-2 text-left hover:bg-gray-100"
       @click="download('excel')"
     >
       📊 Excel
</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { exportToJSON, exportToCSV, exportToExcel } from "@/utils/export"

const props = defineProps({
  mice: { type: Array, default: () => [] },
  cages: { type: Array, default: () => [] }
})

const show = ref(false)

function toggleDropdown() {
  show.value = !show.value
}

function download(type) {
  console.log("点击导出：", type)
  if (type === "json") {
    exportToJSON(props.mice, props.cages)
  } else if (type === "csv") {
    exportToCSV(props.mice, props.cages)
  } else if (type === "excel") {
    console.log("调用 Excel 导出函数")   // ✅ 看看能不能打印
    exportToExcel(props.mice, props.cages)
  }
  show.value = false
}

</script>
