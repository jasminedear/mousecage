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
  // ✅ 核心改动：在导出前处理数据
  const miceWithShortIds = props.mice.map((mouse, index) => ({
    ...mouse,
    id: `M-${index + 1}`, // 生成一个简短的 ID
    originalId: mouse.id  // 保留原始 ID 以备追溯
  }));

  const cagesWithShortIds = props.cages.map((cage, index) => ({
    ...cage,
    id: `C-${index + 1}`, // 生成一个简短的 ID
    originalId: cage.id   // 保留原始 ID
  }));
  
  // 更新老鼠的 cageId 以匹配新的笼位短 ID
  const finalMice = miceWithShortIds.map(mouse => {
    const originalCage = props.cages.find(c => c.id === mouse.cageId);
    if (originalCage) {
      const newCage = cagesWithShortIds.find(c => c.originalId === originalCage.id);
      if (newCage) {
        mouse.cageId = newCage.id;
      }
    }
    return mouse;
  });

  if (type === "json") {
    exportToJSON(finalMice, cagesWithShortIds);
  } else if (type === "csv") {
    exportToCSV(finalMice, cagesWithShortIds);
  } else if (type === "excel") {
    exportToExcel(finalMice, cagesWithShortIds);
  }
  show.value = false;
}

</script>