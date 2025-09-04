<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto p-6 relative">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>

      <h2 class="text-2xl font-bold mb-4">🐭 {{ localMouse.name }} 详情</h2>

      <!-- 基本信息 -->
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
            <option value="male">雄</option>
            <option value="female">雌</option>
          </select>
        </label>

        <label class="block">
          <span class="text-gray-700">基因型</span>
          <select v-model="selectedGenotype" class="w-full border px-3 py-2 rounded mt-1">
            <option disabled value="">请选择或手动输入</option>
            <option v-for="genotype in allGenotypes" :key="genotype" :value="genotype">
              {{ genotype }}
            </option>
            <option value="manual_input">手动输入...</option>
          </select>
          <input
            v-if="selectedGenotype === 'manual_input'"
            v-model="manualGenotype"
            type="text"
            placeholder="请输入新的基因型"
            class="mt-2 block w-full border rounded-md px-3 py-2"
          />
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

      <hr class="my-4" />

      <!-- ❤️ 配偶（实时 + 删除） -->
      <div>
        <h3 class="text-lg font-semibold mb-2">❤️ 配偶</h3>
        <div v-if="spouses.length">
          <ul class="list-disc list-inside">
            <li v-for="s in spouses" :key="s.id" class="flex items-center gap-2">
              <span
                class="cursor-pointer text-blue-600 hover:underline"
                @click="openOtherDetail(s.id)"
              >
                {{ s.name }}
                ({{ s.sex === 'male' ? '♂' : s.sex === 'female' ? '♀' : '？' }})
                <span v-if="s.__dead" class="ml-1 text-xs text-gray-500">（已死亡）</span>
                <span v-else-if="s.cageId !== storeMouse.cageId" class="ml-1 text-xs text-gray-500">（已分笼）</span>
              </span>
              <button
                class="text-red-600 text-sm px-2 py-0.5 border border-red-300 rounded hover:bg-red-50"
                @click.stop="removeSpouse(s.id)"
                title="删除这条配偶关系"
              >
                删除
              </button>
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- 👶 子女（实时 + 删除） -->
      <div class="mt-3">
        <h3 class="text-lg font-semibold mb-2">👶 子女</h3>
        <div v-if="children.length">
          <ul class="list-disc list-inside">
            <li v-for="c in children" :key="c.id" class="flex items-center gap-2">
              <span
                class="cursor-pointer text-green-600 hover:underline"
                @click="openOtherDetail(c.id)"
              >
                {{ c.name }}
                ({{ c.sex === 'male' ? '♂' : c.sex === 'female' ? '♀' : '？' }})
                <span v-if="c.__dead" class="ml-1 text-xs text-gray-500">（已死亡）</span>
              </span>
              <button
                class="text-red-600 text-sm px-2 py-0.5 border border-red-300 rounded hover:bg-red-50"
                @click.stop="removeChild(c.id)"
                title="删除与该子女的父/母关系"
              >
                删除
              </button>
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- 👨‍👩‍👧 父母（实时） -->
      <div class="mt-3">
        <h3 class="text-lg font-semibold mb-2">👨‍👩‍👧 父母</h3>
        <div v-if="father || mother">
          <p
            v-if="father"
            class="cursor-pointer text-purple-600 hover:underline"
            @click="openOtherDetail(father.id)"
          >
            父：{{ father.name }} (♂)
            <span v-if="father.__dead" class="ml-1 text-xs text-gray-500">（已死亡）</span>
          </p>
          <p
            v-if="mother"
            class="cursor-pointer text-pink-600 hover:underline"
            @click="openOtherDetail(mother.id)"
          >
            母：{{ mother.name }} (♀)
            <span v-if="mother.__dead" class="ml-1 text-xs text-gray-500">（已死亡）</span>
          </p>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- ➕ 新增关系（配偶 / 子女） -->
      <div class="mt-4 border rounded-lg p-3">
        <h3 class="font-semibold mb-2">➕ 新增关系</h3>

        <div class="flex flex-wrap items-center gap-2">
          <select v-model="relationType" class="border rounded px-2 py-1">
            <option value="spouse">配偶</option>
            <option value="child">子女（目标为子女）</option>
          </select>

          <input
            v-model="searchQuery"
            placeholder="按姓名/ID 搜索老鼠"
            class="border rounded px-2 py-1 w-56"
          />

          <select v-model="targetId" class="border rounded px-2 py-1 w-56">
            <option disabled value="">选择目标老鼠</option>
            <option v-for="m in candidateMice" :key="m.id" :value="m.id">
              {{ m.name }}（{{ m.id }}）
            </option>
          </select>

          <button
            class="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
            :disabled="!targetId"
            @click="addRelationship"
          >
            添加
          </button>
        </div>

        <p class="text-xs text-gray-500 mt-2">
          说明：选择“子女”时，默认以当前老鼠为父/母，目标为子女；另一个家长不变（可在其详情页补全）。
        </p>
      </div>

      <!-- 查看族谱 -->
      <div class="mt-4 flex justify-end">
        <button
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          @click="emit('open-pedigree', storeMouse)"
        >
          🧬 查看族谱
        </button>
      </div>

      <!-- 操作 -->
      <div class="mt-4 flex justify-end gap-2">
        <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" @click="emit('close')">取消</button>
        <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" @click="saveChanges">保存</button>
      </div>

      <div class="mt-2 flex justify-end">
        <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" @click="handleRecordDeath">
          💀 记录死亡
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, toRaw } from "vue";
import { useMiceStore } from "@/stores/mice";
import { storeToRefs } from "pinia";

const props = defineProps({
  mouse: { type: Object, required: true },
});
const emit = defineEmits(["close", "open-mouse", "open-pedigree"]);

const miceStore = useMiceStore();
const { mice, deadMice } = storeToRefs(miceStore); // ✅ 响应式

const statusOptions = ["怀孕", "哺乳", "幼鼠", "其他"];

// 本地可编辑副本（仅基础字段）
const localMouse = reactive({
  statuses: [],
  spouseIds: [],      // 展示用，不回写
  childrenIds: [],    // 展示用，不回写
  fatherId: null,     // 展示用，不回写
  motherId: null,     // 展示用，不回写
  ...toRaw(props.mouse),
});

// ✅ 用 store 的实时对象作为数据源（找不到则退回 props）
const storeMouse = computed(() => {
  return mice.value.find(m => m.id === props.mouse.id) || props.mouse;
});

// 在活体/死亡里找鼠；死亡鼠打 __dead
const findMouseById = (id) => {
  const live = mice.value.find((m) => m.id === id);
  if (live) return live;
  const dead = deadMice.value.find((m) => m.id === id);
  return dead ? { ...dead, __dead: true } : null;
};

// 基因型选择/输入
const allGenotypes = computed(() => {
  const genotypes = mice.value.map((m) => m.genotype).filter(Boolean);
  return [...new Set(genotypes)];
});
const selectedGenotype = ref(localMouse.genotype || "");
const manualGenotype = ref("");

// —— 关系（实时读取 storeMouse）——
const spouses = computed(() => {
  const ids = Array.isArray(storeMouse.value.spouseIds) ? storeMouse.value.spouseIds : [];
  return ids.map(findMouseById).filter(Boolean);
});
const children = computed(() => {
  const ids = Array.isArray(storeMouse.value.childrenIds) ? storeMouse.value.childrenIds : [];
  return ids.map(findMouseById).filter(Boolean);
});
const father = computed(() =>
  storeMouse.value.fatherId ? findMouseById(storeMouse.value.fatherId) : null
);
const mother = computed(() =>
  storeMouse.value.motherId ? findMouseById(storeMouse.value.motherId) : null
);

// 自动根据编号首字母设置性别（可选）
function autoSetSex() {
  const first = localMouse.name?.trim().toUpperCase()[0];
  if (first === "M" || first === "A") localMouse.sex = "male";
  else if (first === "F" || first === "B") localMouse.sex = "female";
}

// ✅ 仅提交基础字段，避免覆盖关系字段
function saveChanges() {
  if (selectedGenotype.value === "manual_input") {
    if (!manualGenotype.value.trim()) {
      alert("请输入新的基因型");
      return;
    }
    localMouse.genotype = manualGenotype.value.trim();
  } else {
    localMouse.genotype = selectedGenotype.value || null;
  }

  const patch = {
    name: localMouse.name ?? "",
    sex: localMouse.sex,
    genotype: localMouse.genotype ?? null,
    birthDate: localMouse.birthDate ?? null,
    group: localMouse.group ?? "",
    notes: localMouse.notes ?? "",
    statuses: Array.isArray(localMouse.statuses) ? localMouse.statuses : [],
  };

  miceStore.updateMouse(storeMouse.value.id, patch);
  emit("close");
}

// 打开另一只老鼠详情
function openOtherDetail(id) {
  if (!id) return;
  emit("open-mouse", id);
}

// 记录死亡（不解除关系）
function handleRecordDeath() {
  const cause = prompt("请输入死亡原因:");
  if (cause === null) return;
  const c = cause.trim();
  if (!c) {
    alert("死亡原因不能为空");
    return;
  }
  miceStore.recordDeath(storeMouse.value.id, c);
  emit("close");
}

// === 删除关系 ===
function removeSpouse(targetId) {
  if (!targetId) return;
  if (confirm("确定要删除这条配偶关系吗？")) {
    miceStore.removeRelationship(storeMouse.value.id, targetId, "spouse");
  }
}

function removeChild(targetId) {
  if (!targetId) return;
  if (confirm("确定要删除这条亲子关系吗？")) {
    miceStore.removeRelationship(storeMouse.value.id, targetId, "child");
  }
}

/* ---------------- 新增关系表单：状态 + 逻辑 ---------------- */
const relationType = ref("spouse"); // 'spouse' | 'child'
const searchQuery = ref("");
const targetId = ref("");

// 候选仅从“活体 mice”里选（避免把 deadMice 选进来）
const candidateMice = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const meId = storeMouse.value.id;

  // 当前已有关系，尽量在下拉里去掉，避免重复选择（非必需，linkSpouses/addChild 也会去重）
  const existingSpouseIds = new Set(storeMouse.value.spouseIds || []);
  const existingChildrenIds = new Set(storeMouse.value.childrenIds || []);

  return mice.value
    .filter(m => m.id !== meId) // 不能选择自己
    .filter(m => {
      // 关系类型下的额外过滤（可选，防止明显重复）
      if (relationType.value === "spouse" && existingSpouseIds.has(m.id)) return false;
      if (relationType.value === "child"  && existingChildrenIds.has(m.id)) return false;
      return true;
    })
    .filter(m => {
      if (!q) return true;
      return (m.name || "").toLowerCase().includes(q) || (m.id || "").toLowerCase().includes(q);
    });
});

// 提交新增关系
function addRelationship() {
  if (!targetId.value) return;
  const meId = storeMouse.value.id;

  if (relationType.value === "spouse") {
    if (targetId.value === meId) return;
    miceStore.linkSpouses(meId, targetId.value);
  } else if (relationType.value === "child") {
    // 当前老鼠 = 父/母；目标 = 子女
    const me = mice.value.find(m => m.id === meId);
    const isMale = me?.sex === "male" || me?.sex === "♂";
    const fatherId = isMale ? meId : null;
    const motherId = isMale ? null : meId;
    miceStore.addChild(targetId.value, fatherId, motherId);
  }

  // 清空表单
  targetId.value = "";
  searchQuery.value = "";
}
</script>
