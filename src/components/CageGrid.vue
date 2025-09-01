<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="text-center mb-6">
      <h1 class="text-3xl font-bold text-purple-700 flex items-center justify-center gap-2">
        🐭 鼠笼管理系统
      </h1>
    </div>

    <!-- 顶部工具条 -->
    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
      <button
        @click="showAddCage = true"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        🏠 添加笼子
      </button>

      <button
        @click="openAddMouse(null)"
        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        🐭 添加老鼠
      </button>

      <ExportDropdown :mice="normalizedMice" :cages="miceStore.cages" />

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

      <button
        @click="saveData"
        class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
      >
        💾 保存数据
      </button>

      <button
        @click="showBreeding = true"
        class="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
      >
        🍼 繁育小鼠
      </button>

      <button
        @click="showBreedingRecords = true"
        class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        📖 繁育记录
      </button>

      <button
        @click="showMouseListModal = true"
        class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
      >
        📋 所有老鼠
      </button>

      <button
        @click="showDeadMiceModal = true"
        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        💀 死亡老鼠
      </button>

      <!-- 右侧筛选栏（带徽标+漏斗图标） -->
      <div class="ml-auto flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border">
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
          </svg>
          筛选
        </span>

        <select v-model="filterSex" class="border rounded px-2 py-1">
          <option value="">全部性别</option>
          <option value="male">♂ 公</option>
          <option value="female">♀ 母</option>
        </select>

        <select v-model="filterGenotype" class="border rounded px-2 py-1">
          <option value="">全部基因型</option>
          <option v-for="g in miceStore.allGenotypes" :key="g" :value="g">{{ g || '未填写' }}</option>
        </select>

        <label class="flex items-center gap-1 text-sm">
          <input type="checkbox" v-model="onlyWithPups" />
          仅有幼鼠
        </label>

        <label class="flex items-center gap-1 text-sm">
          <input type="checkbox" v-model="onlyEmptyCages" />
          仅空笼
        </label>
      </div>
    </div>

    <!-- 颜色图例 -->
    <div class="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-x-6 gap-y-2 justify-center">
      <div v-for="legend in colorLegends" :key="legend.name" class="flex items-center gap-2">
        <div :class="[legend.bgColor, 'w-4 h-4 rounded-full border border-gray-300']"></div>
        <span class="text-sm text-gray-600">{{ legend.name }}</span>
      </div>
    </div>

    <!-- 分排渲染 -->
    <div
      v-for="row in groupedRows"
      :key="row.name"
      class="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
    >
      <div
        class="flex justify-between items-center px-4 py-3 bg-gray-100 cursor-pointer"
        @click="toggleRow(row.name)"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-800">
            第{{ row.name }}排笼子 ({{ row.cages.length }} 笼)
          </h2>
          <button
            class="text-blue-500 hover:text-blue-700 transition-colors duration-200"
            @click.stop="editRow(row.name)"
          >
            ✏️
          </button>
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

      <div v-show="!collapsedRows[row.name]" class="p-4 bg-white">
        <div
          v-for="cage in row.cages"
          :key="cage.id"
          :class="['mb-4 rounded-lg border p-3', cageClass(cage.id)]"
        >
          <div class="flex justify-between items-center mb-2">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-gray-800">{{ cage.name }}</h3>
                <span
                  v-if="cageBadge(cage.id)"
                  :class="['text-xs px-2 py-0.5 rounded-full', cageBadge(cage.id).cls]"
                >
                  {{ cageBadge(cage.id).text }}
                </span>
              </div>
  
              <div v-if="getMiceByCage(cage.id).length > 0" class="flex flex-wrap text-sm text-gray-600 gap-x-2">
                <span class="font-semibold">{{ getMiceByCage(cage.id).length }}只老鼠</span>
                <span v-for="(count, key) in getCageSummary(cage.id).genotype" :key="key">
                  {{ key }} {{ count }}
                </span>
                <span v-for="(count, key) in getCageSummary(cage.id).sex" :key="key">
                  {{ key }} {{ count }}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                @click="openAddMouse(cage.id)"
              >
                ➕ 添加老鼠
              </button>
              <button
                class="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                @click="deleteCage(cage.id)"
              >
                🗑️ 删除笼子
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MouseCard
              v-for="mouse in getMiceByCage(cage.id)"
              :key="mouse.id"
              :mouse="mouse"
              @view="openDetail"
              @move="openMoveMouse"
              @delete="deleteMouse"
              @record-death-clicked="handleRecordDeathClicked"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 死亡原因下拉 -->
    <div
      v-if="showDeathReasonDropdown"
      class="fixed z-50 bg-white border rounded-lg shadow p-3 w-56"
      :style="{ top: dropdownY + 'px', left: dropdownX + 'px' }"
      @click.stop
    >
      <label class="block text-sm mb-1">死亡原因</label>
      <select v-model="selectedDeathReason" class="w-full border rounded px-2 py-1 mb-2">
        <option value="" disabled>请选择</option>
        <option v-for="opt in deathReasonOptions" :key="opt" :value="opt">{{ opt }}</option>
        <option value="自定义">自定义</option>
      </select>

      <input
        v-if="selectedDeathReason === '自定义'"
        v-model="customDeathReason"
        placeholder="输入自定义原因"
        class="w-full border rounded px-2 py-1 mb-2"
      />

      <div class="flex justify-end gap-2">
        <button class="px-2 py-1 text-sm bg-gray-100 rounded" @click="showDeathReasonDropdown = false">取消</button>
        <button class="px-2 py-1 text-sm bg-red-500 text-white rounded" @click="confirmDeath">确定</button>
      </div>
    </div>

    <!-- 各弹窗 -->
    <AddCageModal v-if="showAddCage" @close="showAddCage = false" />
    <AddMouseModal v-if="showAddMouse" :cage-id="selectedCageId" @close="showAddMouse = false" />
    <MouseDetail
      v-if="selectedDetailMouse"
      :mouse="selectedDetailMouse"
      @close="selectedDetailMouse = null"
      @open-other="openDetail"
      @open-pedigree="openPedigree"
    />
    <MoveMouseModal v-if="showMoveMouse" :mouse="movingMouse" :cages="miceStore.cages" @close="showMoveMouse = false" />

    <PedigreeView
      v-if="selectedPedigreeMouse"
      :mouse="selectedPedigreeMouse"
      @close="selectedPedigreeMouse = null"
      @open-other="openDetail"
    />

    <MouseListModal v-if="showMouseListModal" @close="showMouseListModal = false" @assign-to-cage="openMoveMouseFromList" />
    <DeadMouseListModal v-if="showDeadMiceModal" @close="showDeadMiceModal = false" />
    <BreedingModal v-if="showBreeding" @close="showBreeding = false" />
    <BreedingRecords v-if="showBreedingRecords" @close="showBreedingRecords = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useMiceStore } from "@/stores/mice";
import AddCageModal from "./AddCageModal.vue";
import AddMouseModal from "./AddMouseModal.vue";
import MouseCard from "./MouseCard.vue";
import MouseDetail from "./MouseDetail.vue";
import MoveMouseModal from "./MoveMouseModal.vue";
import BreedingModal from "./BreedingModal.vue";
import ExportDropdown from "./ExportDropdown.vue";
import BreedingRecords from "./BreedingRecords.vue";
import PedigreeView from "./PedigreeView.vue";
import MouseListModal from "./MouseListModal.vue";
import DeadMouseListModal from "./DeadMouseListModal.vue";
import { importFile } from "@/utils/import";

const miceStore = useMiceStore();

onMounted(() => {
  miceStore.loadFromCloud();
});

// 不受筛选影响的“原始”取笼内老鼠（用于判定笼子类型）
function getMiceInCageRaw(cageId) {
  return miceStore.normalizedMice.filter((m) => m.cageId === cageId);
}

function hasPregnant(mice) {
  return mice.some(
    (m) => Array.isArray(m.statuses) && m.statuses.includes("怀孕")
  );
}

function hasPups(mice) {
  return mice.some(
    (m) => Array.isArray(m.statuses) && m.statuses.includes("幼鼠")
  );
}

function hasBreedingPair(mice) {
  // 只看成体
  const adults = mice.filter(
    (m) => !(Array.isArray(m.statuses) && m.statuses.includes("幼鼠"))
  );
  const hasMale = adults.some((m) => m.sex === "male");
  const hasFemale = adults.some((m) => m.sex === "female");
  return hasMale && hasFemale;
}

// 优先级：哺育 > 保胎 > 繁育 > 普通
function getCageType(cageId) {
  const mice = getMiceInCageRaw(cageId);
  if (mice.length === 0) return "normal";
  if (hasPups(mice)) return "nursing";       // 哺育笼
  if (hasPregnant(mice)) return "pregnancy"; // 保胎笼
  if (hasBreedingPair(mice)) return "breeding"; // 繁育笼
  return "normal";
}

function cageClass(cageId) {
  switch (getCageType(cageId)) {
    case "nursing":
      return "border-purple-400 bg-purple-50";
    case "pregnancy":
      return "border-green-500 bg-green-50";
    case "breeding":
      return "border-pink-400 bg-pink-50";
    default:
      return "border-gray-200 bg-white";
  }
}

function cageBadge(cageId) {
  switch (getCageType(cageId)) {
    case "nursing":
      return { text: "哺育笼", cls: "bg-purple-100 text-purple-700" };
    case "pregnancy":
      return { text: "保胎笼", cls: "bg-green-100 text-green-700" };
    case "breeding":
      return { text: "繁育笼", cls: "bg-pink-100 text-pink-700" };
    default:
      return null;
  }
}


// 视图与弹窗状态
const selectedCageId = ref(null);
const selectedDetailMouse = ref(null);
const selectedPedigreeMouse = ref(null);
const movingMouse = ref(null);
const showBreedingRecords = ref(false);
const showAddCage = ref(false);
const showAddMouse = ref(false);
const showMoveMouse = ref(false);
const showBreeding = ref(false);
const fileInput = ref(null);
const showDeadMiceModal = ref(false);
const showMouseListModal = ref(false);

// 死亡原因下拉状态
const showDeathReasonDropdown = ref(false);
const dropdownX = ref(0);
const dropdownY = ref(0);
const currentMouseId = ref(null);
const selectedDeathReason = ref("");
const customDeathReason = ref("");
const deathReasonOptions = ["生病", "老死", "实验"];

// 统一后的 mice
const normalizedMice = computed(() => miceStore.normalizedMice);

// 颜色图例
const colorLegends = computed(() => [
  { name: "雄性", bgColor: "bg-blue-500" },
  { name: "雌性", bgColor: "bg-red-500" },
  { name: "幼鼠", bgColor: "bg-purple-500" },
  { name: "怀孕", bgColor: "bg-green-500" },
  { name: "哺乳", bgColor: "bg-orange-500" }
]);

// —— 筛选状态 —— //
const filterSex = ref("");          // '', 'male', 'female'
const filterGenotype = ref("");     // 基因型
const onlyWithPups = ref(false);    // 仅含“幼鼠”状态个体
const onlyEmptyCages = ref(false);  // 仅空笼（应用筛选后仍为空）

// 带筛选的取笼内老鼠
function getMiceByCage(cageId) {
  let arr = miceStore.normalizedMice.filter((m) => m.cageId === cageId);

  if (filterSex.value) {
    arr = arr.filter((m) => m.sex === filterSex.value);
  }
  if (filterGenotype.value) {
    arr = arr.filter((m) => (m.genotype || "") === filterGenotype.value);
  }
  if (onlyWithPups.value) {
    arr = arr.filter(
      (m) => Array.isArray(m.statuses) && m.statuses.includes("幼鼠")
    );
  }
  return arr;
}

// 分排（当“仅空笼”时，按筛选结果过滤空笼）
const groupedRows = computed(() => {
  const groups = {};
  miceStore.cages.forEach((cage) => {
    const rowName = cage.row || "未分组";
    if (!groups[rowName]) groups[rowName] = [];
    // 仅空笼：只收录筛选后为 0 的笼位
    if (onlyEmptyCages.value) {
      if (getMiceByCage(cage.id).length === 0) groups[rowName].push(cage);
    } else {
      groups[rowName].push(cage);
    }
  });
  return Object.keys(groups).map((name) => ({
    name,
    cages: groups[name]
  }));
});

// 折叠排
const collapsedRows = ref({});
function toggleRow(rowName) {
  collapsedRows.value[rowName] = !collapsedRows.value[rowName];
}

// 行为函数
function editRow(rowName) {
  const newName = prompt("请输入新的排名：", rowName);
  if (newName && newName.trim() !== "" && newName !== rowName) {
    miceStore.renameRow(rowName, newName.trim());
  }
}

function triggerFileInput() {
  if (!fileInput.value) return;
  fileInput.value.click();
}

function deleteRow(rowName) {
  if (confirm(`确定要删除 "${rowName}" 吗？\n该排下的所有笼位和老鼠也会被删除！`)) {
    miceStore.deleteRow(rowName);
  }
}

function deleteCage(cageId) {
  if (confirm("确定要删除这个笼子吗？该笼子里的老鼠也会被移除！")) {
    miceStore.deleteCage(cageId);
  }
}

function deleteMouse(mouseId) {
  if (confirm("确定要删除这只老鼠吗？删除后将无法恢复！")) {
    miceStore.deleteMouse(mouseId);
  }
}

function openAddMouse(cageId) {
  selectedCageId.value = cageId || null;
  showAddMouse.value = true;
}

function openDetail(mouse) {
  selectedPedigreeMouse.value = null;
  selectedDetailMouse.value = mouse;
}

function openPedigree(mouse) {
  selectedDetailMouse.value = null;
  selectedPedigreeMouse.value = mouse;
}

function openMoveMouse(mouse) {
  movingMouse.value = mouse;
  showMoveMouse.value = true;
}

function openMoveMouseFromList(mouse) {
  showMouseListModal.value = false;
  movingMouse.value = mouse;
  showMoveMouse.value = true;
}

// 笼内统计（受筛选影响）
function getCageSummary(cageId) {
  const miceInCage = getMiceByCage(cageId);
  const summary = { genotype: {}, sex: {} };

  miceInCage.forEach((mouse) => {
    const genotype = mouse.genotype || "未知";
    summary.genotype[genotype] = (summary.genotype[genotype] || 0) + 1;

    const sex = mouse.sex === "male" ? "♂" : mouse.sex === "female" ? "♀" : "未知";
    summary.sex[sex] = (summary.sex[sex] || 0) + 1;
  });

  return summary;
}

// 卡片“死亡”点击（定位弹层）
function handleRecordDeathClicked(payload) {
  const { mouse, event } = payload;
  currentMouseId.value = mouse.id;
  selectedDeathReason.value = "";
  customDeathReason.value = "";

  const rect = event.currentTarget.getBoundingClientRect();
  dropdownX.value = rect.right;
  dropdownY.value = rect.bottom;

  showDeathReasonDropdown.value = true;
}

// 死亡确认
function confirmDeath() {
  let cause = "";
  if (selectedDeathReason.value === "自定义") {
    if (!customDeathReason.value.trim()) {
      alert("请输入自定义死亡原因");
      return;
    }
    cause = customDeathReason.value.trim();
  } else {
    cause = selectedDeathReason.value;
  }

  if (cause) {
    if (confirm("确定要记录这只老鼠已死亡吗？它将从笼位中移除。")) {
      miceStore.recordDeath(currentMouseId.value, cause);
    }
    showDeathReasonDropdown.value = false;
  } else {
    alert("请选择或输入死亡原因");
  }
}

// 导入
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = await importFile(file);
    data.forEach((item) => {
      if (item.type === "cage") miceStore.addCage(item);
      else if (item.type === "mouse") miceStore.addMouse(item);
    });
    miceStore.addRecord(`📂 导入成功，文件 ${file.name}`);
    alert("导入成功！");
  } catch (err) {
    console.error("导入失败:", err);
    alert("导入失败，请检查文件格式");
  } finally {
    e.target.value = null;
  }
}

// 手动保存（写记录）
function saveData() {
  miceStore.saveToCloud({ silent: false });
  alert("保存成功！");
}

// 自动保存（静默，不写记录，避免触发记录回环）
const AUTO_SAVE_INTERVAL_MS = 15000; // 可改为 10000 / 30000
let autoSaveTimer = null;
watch(
  () => ({
    cages: miceStore.cages,
    mice: miceStore.mice,
    deadMice: miceStore.deadMice,
    breeding: miceStore.breeding
  }),
  () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      miceStore.saveToCloud({ silent: true });
    }, AUTO_SAVE_INTERVAL_MS);
  },
  { deep: true }
);
</script>

<style scoped>
/* 可在此加自定义样式 */
</style>
