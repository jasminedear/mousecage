<template>
<!-- 页面标题 -->
<div class="text-center mb-6">
  <h1 class="text-3xl font-bold text-purple-700 flex items-center justify-center gap-2">
    🐭 鼠笼管理系统
  </h1>
</div>

  <div class="p-6 bg-gray-50 min-h-screen">
    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
  <!-- 添加笼子 -->
  <button
    @click="showAddCage = true"
    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
  >
    🏠 添加笼子
  </button>

  <!-- 添加老鼠 -->
  <button
    @click="openAddMouse(null)"
    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
  >
    🐭 添加老鼠
  </button>

  <!-- 导出 -->
   <ExportDropdown :mice="miceStore.mice" :cages="miceStore.cages" />

    
  <!-- 导入档案 -->
  <button
    @click="triggerFileInput"
    class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
  >
    📂 导入档案
  </button>
  <input
    type="file"
    ref="fileInput"
    class="hidden"
    @change="handleImport"
    accept=".json,.csv,.xlsx"
  />

  <!-- 保存数据 -->
  <button
    @click="saveData"
    class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
  >
    💾 保存数据
  </button>

  <!-- 繁育 -->
  <button
    @click="showBreeding = true"
    class="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
  >
    🍼 繁育
  </button>

  <!-- 繁育记录 -->
  <button
  @click="showBreedingRecords = true"
  class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
>
    📖 繁育记录
  </button>
</div>

    <!-- 笼位分组 -->
    <div
      v-for="row in groupedRows"
      :key="row.name"
      class="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
    >
      <!-- 排标题 -->
      <div
        class="flex justify-between items-center px-4 py-3 bg-gray-100 cursor-pointer"
        @click="toggleRow(row.name)"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-800">
            第{{ row.name }}排笼子 ({{ row.cages.length }} 笼)
          </h2>
          <!-- 编辑按钮 -->
          <button
            class="text-blue-500 hover:text-blue-700 transition-colors duration-200"
            @click.stop="editRow(row.name)"
          >
            ✏️
          </button>
          <!-- 删除按钮 -->
          <button
            class="text-red-500 hover:text-red-700 transition-colors duration-200"
            @click.stop="deleteRow(row.name)"
          >
            🗑️
          </button>
        </div>
        <span class="text-gray-500 select-none">
          {{ collapsedRows[row.name] ? "▶ 展开" : "▼ 折叠" }}
        </span>
      </div>

      <!-- 笼位展示 -->
      <div v-show="!collapsedRows[row.name]" class="p-4 bg-white">
        <div v-for="cage in row.cages" :key="cage.id" class="mb-4 border p-3 rounded-lg">
          <!-- 笼子标题 + 按钮 -->
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold text-gray-700">{{ cage.name }}</h3>
            <div class="flex gap-2">
              <!-- 添加老鼠按钮 -->
              <button
                class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                @click="openAddMouse(cage.id)"
              >
                ➕ 添加老鼠
              </button>
              <!-- 删除笼子按钮 -->
              <button
                class="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                @click="deleteCage(cage.id)"
              >
                🗑️ 删除笼子
              </button>
            </div>
          </div>

          <!-- 老鼠卡片 -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MouseCard
              v-for="mouse in getMiceByCage(cage.id)"
              :key="mouse.id"
              :mouse="mouse"
              @view="openDetail"
              @move="openMoveMouse"
              @delete="deleteMouse"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ⚠️ 弹窗必须放在这里（循环结束之后） -->
    <AddCageModal v-if="showAddCage" @close="showAddCage = false" />
    <AddMouseModal
      v-if="showAddMouse"
      :cage-id="selectedCageId"
      @close="showAddMouse = false"
    />
    
   <MouseDetail
  v-if="selectedMouse"
  :mouse="selectedMouse"
  @close="selectedMouse = null"
  @open-other="openDetail"
/>

    <MoveMouseModal
      v-if="showMoveMouse"
      :mouse="movingMouse"
      :cages="miceStore.cages"
      @close="showMoveMouse = false"
    />
    <BreedingModal v-if="showBreeding" @close="showBreeding = false" />
    <BreedingRecords v-if="showBreedingRecords" @close="showBreedingRecords = false" />

  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useMiceStore } from "@/stores/mice"
import AddCageModal from "./AddCageModal.vue"
import AddMouseModal from "./AddMouseModal.vue"
import MouseCard from "./MouseCard.vue"
import MouseDetail from "./MouseDetail.vue"
import MoveMouseModal from "./MoveMouseModal.vue"
import BreedingModal from "./BreedingModal.vue"
import ExportDropdown from "./ExportDropdown.vue"
import BreedingRecords from "./BreedingRecords.vue"
import { importFile } from "@/utils/import"
import { onMounted } from "vue"

onMounted(() => {
  loadData()
})

// 状态
const miceStore = useMiceStore()
const selectedCageId = ref(null)
const selectedMouse = ref(null)   // 当前查看详情的老鼠
const movingMouse = ref(null)     // 当前要移动的老鼠
const showBreedingRecords = ref(false)
const showAddCage = ref(false)
const showAddMouse = ref(false)
const showMoveMouse = ref(false)  // 控制移动弹窗
const showBreeding = ref(false)

// ✅ 导入文件 input
const fileInput = ref(null)

function triggerFileInput() {
  if (!fileInput.value) {
    console.error("⚠️ fileInput 还没挂载成功")
    return
  }
  fileInput.value.click()
}



// 删除笼子
function deleteCage(cageId) {
  if (confirm("确定要删除这个笼子吗？该笼子里的老鼠也会被移除！")) {
    miceStore.deleteCage(cageId)
  }
}

// 打开“添加老鼠”弹窗
function openAddMouse(cageId) {
  selectedCageId.value = cageId || null // 顶栏点的传 null
  showAddMouse.value = true
}

// 打开“老鼠详情”弹窗
function openDetail(mouse) {
  selectedMouse.value = mouse
}

// 删除老鼠
function deleteMouse(mouseId) {
  if (confirm("确定要删除这只老鼠吗？")) {
    miceStore.mice = miceStore.mice.filter((m) => m.id !== mouseId)
    miceStore.addRecord(`删除老鼠 ID:${mouseId}`)
  }
}

// 打开移动弹窗
function openMoveMouse(mouse) {
  console.log("openMoveMouse 被调用:", mouse)
  movingMouse.value = mouse
  showMoveMouse.value = true
}

// 按 row 分组
const groupedRows = computed(() => {
  const groups = {}
  miceStore.cages.forEach((cage) => {
    const rowName = cage.row || "未分组"
    if (!groups[rowName]) groups[rowName] = []
    groups[rowName].push(cage)
  })
  return Object.keys(groups).map((name) => ({
    name,
    cages: groups[name]
  }))
})

// 折叠状态
const collapsedRows = ref({})
function toggleRow(rowName) {
  collapsedRows.value[rowName] = !collapsedRows.value[rowName]
}

// 编辑排
function editRow(rowName) {
  const newName = prompt("请输入新的排名：", rowName)
  if (newName && newName.trim() !== "" && newName !== rowName) {
    miceStore.renameRow(rowName, newName.trim())
  }
}

// 删除排
function deleteRow(rowName) {
  if (confirm(`确定要删除 "${rowName}" 吗？\n该排下的所有笼位和老鼠也会被删除！`)) {
    miceStore.deleteRow(rowName)
  }
}

// 获取某笼子的老鼠（加容错）
function getMiceByCage(cageId) {
  if (!Array.isArray(miceStore.mice)) {
    return []
  }
  return miceStore.mice.filter((m) => m.cageId === cageId)
}

// ✅ 导入
async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = await importFile(file)
    console.log("📂 导入数据:", data)

    data.forEach(item => {
      if (item.type === "cage") {
        miceStore.addCage(item)
      } else if (item.type === "mouse") {
        miceStore.addMouse(item)
      }
    })

    miceStore.addRecord(`📂 导入成功，文件 ${file.name}`)
    alert("导入成功！")
  } catch (err) {
    console.error("导入失败:", err)
    alert("导入失败，请检查文件格式")
  } finally {
    e.target.value = null
  }
}

// 保存数据到 localStorage
function saveData() {
  const data = {
    cages: miceStore.cages,
    mice: miceStore.mice,
    records: miceStore.records,
    breeding: miceStore.breeding,
  }
  localStorage.setItem("mouseCageData", JSON.stringify(data))
  miceStore.addRecord("💾 数据已保存到本地存档")
  alert("保存成功！")
}

// 从 localStorage 读取数据
function loadData() {
  const raw = localStorage.getItem("mouseCageData")
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    if (data.cages) miceStore.cages = data.cages
    if (data.mice) miceStore.mice = data.mice
    if (data.records) miceStore.records = data.records
    if (data.breeding) miceStore.breeding = data.breeding
    miceStore.addRecord("📂 已从本地存档加载数据")
  } catch (err) {
    console.error("加载失败:", err)
  }
}


</script>
