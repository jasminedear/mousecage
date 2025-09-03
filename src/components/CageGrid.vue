<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="text-center mb-6">
      <h1 class="text-3xl font-bold text-purple-700 flex items-center justify-center gap-2">
        🐭 鼠笼管理系统
      </h1>
    </div>

    <!-- 顶部工具条 -->
    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
      <button @click="showAddCage = true" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        🏠 添加笼子
      </button>

      <button @click="openAddMouse(null)" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
        🐭 添加老鼠
      </button>

      <ExportDropdown :mice="normalizedMice" :cages="miceStore.cages" />

      <button @click="triggerFileInput" class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
        📂 导入档案
      </button>
      <input type="file" ref="fileInput" class="hidden" @change="handleImport" accept=".json,.csv,.xlsx" />

      <button @click="saveData" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
        💾 保存数据
      </button>

      <button @click="showOverview = true" class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
        🗺️ 笼位一览
      </button>

      <button @click="showBreeding = true" class="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
        🍼 繁育小鼠
      </button>

      <button @click="showBreedingRecords = true" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
        📖 繁育记录
      </button>

      <button @click="showMouseListModal = true" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
        📋 所有老鼠
      </button>

      <button @click="showDeadMiceModal = true" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
        💀 死亡老鼠
      </button>

      <!-- 右侧：搜索 + 筛选 -->
      <div class="ml-auto flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border">
        <!-- 🔎 搜索框（多关键词，空格分割） -->
        <div class="flex items-center gap-2 bg-white border rounded px-2 py-1">
          <span class="text-gray-500">🔎</span>
          <input
            v-model.trim="searchQuery"
            type="text"
            class="outline-none text-sm w-64"
            placeholder="搜索 编号 / 基因型 / 分组 / 笼位 / 状态（空格分割多关键词）"
          />
          <button v-if="searchQuery" class="text-xs text-gray-500 hover:text-gray-700" @click="searchQuery = ''">清除</button>
        </div>

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

        <label class="flex items-center gap-1 text-sm" :class="{'opacity-40 pointer-events-none': hasSearch}">
          <input type="checkbox" v-model="onlyEmptyCages" :disabled="hasSearch" />
          仅空笼
        </label>
        
        <!-- ⭐ 只看星标 -->
        <label class="flex items-center gap-1 text-sm">
          <input type="checkbox" v-model="onlyStarred" />
          只看星标
        </label>
      </div>
    </div>

    <!-- 颜色图例 -->
    <div class="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-x-6 gap-y-2 justify-center">
      <div v-for="legend in colorLegends" :key="legend.name" class="flex items-center gap-2">
        <div :class="[legend.bgColor, 'w-4 h-4 rounded-full border border-gray-300']"></div>
        <span class="text-sm text-gray-600">{{ legend.name }}</span>
      </div>
      <div v-if="hasSearch" class="text-sm text-gray-500">共 {{ totalMatched }} 条结果</div>
    </div>

    <!-- 分排渲染 -->
    <div v-for="row in groupedRows" :key="row.name" class="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div class="flex justify-between items-center px-4 py-3 bg-gray-100 cursor-pointer" @click="toggleRow(row.name)">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-800">
            第{{ row.name }}排笼子
          </h2>
          <div v-if="rowSummary[row.name]" class="text-sm text-gray-600 flex gap-2 ml-4">
            <span>总数: {{ rowSummary[row.name].totalMice }}</span>
            <span>♂: {{ rowSummary[row.name].maleCount }}</span>
            <span>♀: {{ rowSummary[row.name].femaleCount }}</span>
            <span>基因型: {{ Array.from(rowSummary[row.name].genotypes).join(', ') }}</span>
            <span v-if="rowSummary[row.name].breedingCages > 0">繁育笼: {{ rowSummary[row.name].breedingCages }}</span>
          </div>
          <button class="text-blue-500 hover:text-blue-700 transition-colors duration-200" @click.stop="editRow(row.name)">
            ✏️
          </button>
          <button class="text-red-500 hover:text-red-700 transition-colors duration-200" @click.stop="deleteRow(row.name)">
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
          v-show="shouldShowCage(cage.id)"
        >
          <div class="flex justify-between items-center mb-2">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <!-- 笼位名高亮 -->
                <h3 class="text-xl font-bold text-gray-800" v-html="highlightHtml(cage.name)"></h3>
                <span v-if="cageBadge(cage.id)" :class="['text-xs px-2 py-0.5 rounded-full', cageBadge(cage.id).cls]">
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
              <button class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600" @click="openAddMouse(cage.id)">
                ➕ 添加老鼠
              </button>
              <button class="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600" @click="transferCage(cage.id)">
                📦 转移笼子
              </button>
              <button class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600" @click="renameCage(cage.id)">
                ✏️ 改名
              </button>
              <button class="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600" @click="deleteCage(cage.id)">
                🗑️ 删除笼子
              </button>
            </div>

          </div>

          <div class="grid grid-cols-4 gap-3">
            <!-- 对匹配的卡片加描边高亮 -->
            <div
              v-for="mouse in getMiceByCage(cage.id)"
              :key="mouse.id"
              :class="['rounded-lg', isMatched(mouse, cage) && hasSearch ? 'ring-2 ring-yellow-400 ring-offset-2' : '']"
            >
              <MouseCard
                :mouse="mouse"
                @view="openDetail"
                @move="openMoveMouse"
                @delete="deleteMouse"
                @record-death-clicked="handleRecordDeathClicked"
              />
            </div>
          </div>
        </div>

        <!-- 搜索结果为空时的小提示 -->
        <div v-if="hasSearch && !row.cages.some(c => getMiceByCage(c.id).length)" class="text-center text-gray-400 py-2">
          此排无匹配结果
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
      v-if="selectedMouse"
      :mouse="selectedMouse"
      @close="selectedMouse = null"
      @open-mouse="openDetail"
      @open-pedigree="openPedigree"
    />
    <MoveMouseModal v-if="showMoveMouse" :mouse="movingMouse" :cages="miceStore.cages" @close="showMoveMouse = false" />
    <PedigreeView
      v-if="selectedPedigreeMouse"
      :mouse="selectedPedigreeMouse"
      @close="selectedPedigreeMouse = null"
      @open-other="openPedigree"
    />
    <MouseListModal v-if="showMouseListModal" @close="showMouseListModal = false" @assign-to-cage="openMoveMouseFromList" />
    <DeadMouseListModal v-if="showDeadMiceModal" @close="showDeadMiceModal = false" />
    <BreedingModal v-if="showBreeding" @close="showBreeding = false" />
    <BreedingRecords v-if="showBreedingRecords" @close="showBreedingRecords = false" />

    <CageOverview v-if="showOverview" :cages="miceStore.cages" @close="showOverview = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
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
import CageOverview from "./CageOverview.vue";
import { importFile } from "@/utils/import";
import { useMiceStore } from "@/stores/mice";
import { useUserStore } from "@/stores/user";

const miceStore = useMiceStore();
const userStore = useUserStore();

const showOverview = ref(false);

const selectedMouse = ref(null);
const selectedPedigreeMouse = ref(null);

const selectedCageId = ref(null);
const movingMouse = ref(null);
const showBreedingRecords = ref(false);
const showAddCage = ref(false);
const showAddMouse = ref(false);
const showMoveMouse = ref(false);
const showBreeding = ref(false);
const fileInput = ref(null);
const showDeadMiceModal = ref(false);
const showMouseListModal = ref(false);

const showDeathReasonDropdown = ref(false);
const dropdownX = ref(0);
const dropdownY = ref(0);
const currentMouseId = ref(null);
const selectedDeathReason = ref("");
const customDeathReason = ref("");
const deathReasonOptions = ["生病", "老死", "实验"];
const onlyStarred = ref(false)   // ⭐ 新增：只看星标

const normalizedMice = computed(() => miceStore.normalizedMice);

const colorLegends = computed(() => [
  { name: "雄性", bgColor: "bg-blue-500" },
  { name: "雌性", bgColor: "bg-red-500" },
  { name: "幼鼠", bgColor: "bg-purple-500" },
  { name: "怀孕", bgColor: "bg-green-500" },
  { name: "哺乳", bgColor: "bg-orange-500" },
]);

const filterSex = ref("");
const filterGenotype = ref("");
const onlyWithPups = ref(false);
const onlyEmptyCages = ref(false);

/* ------------------------- 🔎 搜索逻辑 ------------------------- */
const searchQuery = ref("");
const hasSearch = computed(() => searchQuery.value.trim().length > 0);
const keywords = computed(() =>
  searchQuery.value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.toLowerCase())
);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 文本高亮（用于笼位名）
function highlightHtml(text) {
  if (!hasSearch.value) return text;
  let out = String(text);
  for (const k of keywords.value) {
    const re = new RegExp(escapeRegExp(k), "ig");
    out = out.replace(
      re,
      (m) => `<mark class="bg-yellow-200 text-black rounded px-0.5">${m}</mark>`
    );
  }
  return out;
}

// 判断一只老鼠是否命中所有关键词
function isMatched(mouse, cageObj) {
  if (!hasSearch.value) return true;
  const cageName = cageObj?.name || miceStore.getCageName(mouse.cageId) || "";
  const statuses = Array.isArray(mouse.statuses) ? mouse.statuses.join(" ") : "";
  const haystack = [
    mouse.name,
    mouse.genotype,
    mouse.group,
    cageName,
    statuses,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return keywords.value.every((k) => haystack.includes(k));
}

/* -------------------------------------------------------------- */

// 计算每排概览
const rowSummary = computed(() => {
  const summary = {};
  miceStore.cages.forEach((cage) => {
    const rowName = cage.row || "未分组";
    if (!summary[rowName]) {
      summary[rowName] = {
        totalMice: 0,
        maleCount: 0,
        femaleCount: 0,
        genotypes: new Set(),
        breedingCages: 0,
      };
    }
    const miceInCage = getMiceByCage(cage.id);
    summary[rowName].totalMice += miceInCage.length;
    miceInCage.forEach((mouse) => {
      if (mouse.sex === "male") summary[rowName].maleCount++;
      if (mouse.sex === "female") summary[rowName].femaleCount++;
      if (mouse.genotype) summary[rowName].genotypes.add(mouse.genotype);
    });
    if (getCageType(cage.id) === "breeding") summary[rowName].breedingCages++;
  });
  return summary;
});

function getMiceInCageRaw(cageId) {
  return miceStore.normalizedMice.filter((m) => m.cageId === cageId);
}
function hasPregnant(mice) {
  return mice.some((m) => Array.isArray(m.statuses) && m.statuses.includes("怀孕"));
}
function hasPups(mice) {
  return mice.some((m) => Array.isArray(m.statuses) && m.statuses.includes("幼鼠"));
}
function hasBreedingPair(mice) {
  const adults = mice.filter((m) => !(Array.isArray(m.statuses) && m.statuses.includes("幼鼠")));
  const hasMale = adults.some((m) => m.sex === "male");
  const hasFemale = adults.some((m) => m.sex === "female");
  return hasMale && hasFemale;
}
function getCageType(cageId) {
  const mice = getMiceInCageRaw(cageId);
  if (mice.length === 0) return "normal";
  if (hasPups(mice)) return "nursing";
  if (hasPregnant(mice)) return "pregnancy";
  if (hasBreedingPair(mice)) return "breeding";
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


// 自然排序（支持中英文 & 数字混排）
const collator = new Intl.Collator('zh-Hans-CN-u-nu-hanidec', { numeric: true, sensitivity: 'base' })

function cmpRow(a, b) {
  // 空的排名放到最后
  const ra = a?.row || 'ZZZ'
  const rb = b?.row || 'ZZZ'
  return collator.compare(ra, rb)
}

function cmpCageName(a, b) {
  const na = a?.name || ''
  const nb = b?.name || ''
  return collator.compare(na, nb)
}

// 先按“排”排，再按“笼名”排
const sortedCages = computed(() => {
  const copy = [...miceStore.cages]
  copy.sort((a, b) => {
    const r = cmpRow(a, b)
    if (r !== 0) return r
    return cmpCageName(a, b)
  })
  return copy
})


// 带筛选 + 搜索的取笼内老鼠
function getMiceByCage(cageId) {
  let arr = miceStore.normalizedMice.filter((m) => m.cageId === cageId);

  // 分类筛选
  if (filterSex.value) arr = arr.filter((m) => m.sex === filterSex.value);
  if (filterGenotype.value) arr = arr.filter((m) => (m.genotype || "") === filterGenotype.value);
  if (onlyWithPups.value) arr = arr.filter((m) => Array.isArray(m.statuses) && m.statuses.includes("幼鼠"));
   // ⭐ 星标筛选
  if (onlyStarred.value) arr = arr.filter(m => m.starred)

  // 关键词搜索
  if (hasSearch.value) {
    const cage = miceStore.cages.find((c) => c.id === cageId);
    arr = arr.filter((m) => isMatched(m, cage));
  }

  return arr;
}

// 搜索时只显示有匹配 mouse 的笼
function shouldShowCage(cageId) {
  if (!hasSearch.value) {
    if (onlyEmptyCages.value) return getMiceByCage(cageId).length === 0;
    return true;
  }
  return getMiceByCage(cageId).length > 0;
}

const groupedRows = computed(() => {
  const groups = {}
  // 用已排序的笼位列表来分组
  sortedCages.value.forEach((cage) => {
    const rowName = cage.row || '未分组'
    if (!groups[rowName]) groups[rowName] = []
    groups[rowName].push(cage) // 每个 row 内也已经按笼名排好
  })
  // row 顺序也做自然排序
  return Object.keys(groups)
    .sort((a, b) => collator.compare(a, b))
    .map((name) => ({ name, cages: groups[name] }))
})


// 统计搜索命中数量
const totalMatched = computed(() => {
  if (!hasSearch.value) return 0;
  let n = 0;
  miceStore.cages.forEach((c) => (n += getMiceByCage(c.id).length));
  return n;
});

const collapsedRows = ref({});
function toggleRow(rowName) {
  collapsedRows.value[rowName] = !collapsedRows.value[rowName];
}

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
function openPedigree(mouse) {
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
function openDetail(mouse) {
  selectedMouse.value = mouse;
}

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


function transferCage(fromCageId) {
  const targetName = prompt("请输入目标笼子的名字：");
  if (!targetName) return;

  const target = miceStore.cages.find(c => c.name === targetName);
  if (!target) {
    alert("没有找到这个笼子！");
    return;
  }

  const count = miceStore.moveCageMice(fromCageId, target.id);
  alert(`已转移 ${count} 只老鼠到 ${target.name}`);
}

function renameCage(cageId) {
  const cage = miceStore.cages.find(c => c.id === cageId);
  if (!cage) return;
  const newName = prompt("请输入新的笼子名字：", cage.name);
  if (newName && newName.trim() !== "") {
    miceStore.renameCage(cageId, newName.trim());
  }
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await importFile(file);
    const rows = Array.isArray(result) ? result : (result.asRows || []);
    for (const item of rows) {
      if (item.type === "cage") {
        miceStore.addCage(item);
      } else if (item.type === "mouse") {
        if (!item.cageId && item.cageName) {
          const cage = miceStore.cages.find((c) => c.name === item.cageName);
          if (cage) item.cageId = cage.id;
        }
        miceStore.addMouse(item);
      }
    }
    alert(`导入成功！共导入 ${rows.length} 条记录`);
  } catch (err) {
    console.error("导入失败:", err);
    alert(`导入失败：${err?.message || "请检查文件格式"}`);
  } finally {
    e.target.value = null;
  }
}

function saveData() {
  const userId = userStore.currentUser?.id;
  if (userId) {
    miceStore.saveToCloud(userId, { silent: false });
    alert("保存成功！");
  } else {
    alert("请登录后保存！");
  }
}

const AUTO_SAVE_INTERVAL_MS = 15000;
let autoSaveTimer = null;
watch(
  () => ({
    cages: miceStore.cages,
    mice: miceStore.mice,
    deadMice: miceStore.deadMice,
    breeding: miceStore.breeding,
  }),
  () => {
    const userId = userStore.currentUser?.id;
    if (userId) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        miceStore.saveToCloud(userId, { silent: true });
      }, AUTO_SAVE_INTERVAL_MS);
    }
  },
  { deep: true }
);

watch(
  () => userStore.currentUser,
  (newCurrentUser, oldCurrentUser) => {
    if (newCurrentUser && !oldCurrentUser) {
      miceStore.loadFromCloud(newCurrentUser.id);
    } else if (!newCurrentUser && oldCurrentUser) {
      miceStore.resetState();
    }
  },
  { immediate: true }
);

// 笼位变化后默认折叠
watch(
  () => miceStore.cages,
  (newCages) => {
    if (newCages.length > 0) {
      const rows = [...new Set(newCages.map((c) => c.row || "未分组"))];
      const newCollapsedState = {};
      rows.forEach((row) => {
        newCollapsedState[row] = true;
      });
      collapsedRows.value = newCollapsedState;
    } else {
      collapsedRows.value = {};
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
/* 让 mark 更柔和一些 */
mark { border-radius: 0.25rem; padding: 0 0.125rem; }
</style>
