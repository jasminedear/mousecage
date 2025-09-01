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
            <option v-for="genotype in allGenotypes" :key="genotype" :value="genotype">{{ genotype }}</option>
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

      <!-- 配偶：读取 spouseIds（静态关系），跨笼显示“已分笼”，死亡显示“已死亡” -->
      <div>
        <h3 class="text-lg font-semibold mb-2">❤️ 配偶</h3>
        <div v-if="spouses.length">
          <ul class="list-disc list-inside">
            <li
              v-for="s in spouses"
              :key="s.id"
              class="cursor-pointer text-blue-600 hover:underline"
              @click="openOtherDetail(s.id)"
            >
              {{ s.name }}
              ({{ s.sex === 'male' ? '♂' : s.sex === 'female' ? '♀' : '？' }})
              <span v-if="s.__dead" class="ml-1 text-xs text-gray-500">（已死亡）</span>
              <span v-else-if="s.cageId !== localMouse.cageId" class="ml-1 text-xs text-gray-500">（已分笼）</span>
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- 子女：读取 childrenIds（静态关系） -->
      <div class="mt-3">
        <h3 class="text-lg font-semibold mb-2">👶 子女</h3>
        <div v-if="children.length">
          <ul class="list-disc list-inside">
            <li
              v-for="c in children"
              :key="c.id"
              class="cursor-pointer text-green-600 hover:underline"
              @click="openOtherDetail(c.id)"
            >
              {{ c.name }}
              ({{ c.sex === 'male' ? '♂' : c.sex === 'female' ? '♀' : '？' }})
              <span v-if="c.__dead" class="ml-1 text-xs text-gray-500">（已死亡）</span>
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <!-- 父母：读取 fatherId/motherId（静态关系） -->
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

      <!-- 查看族谱（触发外层） -->
      <div class="mt-2 flex justify-end">
        <button
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          @click="emit('open-pedigree', localMouse)"
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

const props = defineProps({
  mouse: { type: Object, required: true },
});
const emit = defineEmits(["close", "open-mouse", "open-pedigree"]);

const miceStore = useMiceStore();
const statusOptions = ["怀孕", "哺乳", "幼鼠", "其他"];

// 用本地副本编辑，避免直接改 props
const localMouse = reactive({
  statuses: [],
  spouseIds: [],
  childrenIds: [],
  fatherId: null,
  motherId: null,
  ...toRaw(props.mouse),
});

// 便捷：通过 id 在活体或死亡列表里找鼠；并标记 __dead
const findMouseById = (id) => {
  const live = miceStore.mice.find((m) => m.id === id);
  if (live) return live;
  const dead = miceStore.deadMice.find((m) => m.id === id);
  return dead ? { ...dead, __dead: true } : null;
};

// 基因型选择/输入
const allGenotypes = computed(() => {
  const genotypes = miceStore.mice.map((m) => m.genotype).filter(Boolean);
  return [...new Set(genotypes)];
});
const selectedGenotype = ref(localMouse.genotype || "");
const manualGenotype = ref("");

// —— 配偶/子女/父母（静态关系读取）——
const spouses = computed(() => {
  const ids = Array.isArray(props.mouse.spouseIds) ? props.mouse.spouseIds : [];
  return ids.map(findMouseById).filter(Boolean);
});
const children = computed(() => {
  const ids = Array.isArray(props.mouse.childrenIds) ? props.mouse.childrenIds : [];
  return ids.map(findMouseById).filter(Boolean);
});
const father = computed(() => (props.mouse.fatherId ? findMouseById(props.mouse.fatherId) : null));
const mother = computed(() => (props.mouse.motherId ? findMouseById(props.mouse.motherId) : null));

// 自动根据编号首字母设置性别（可选）
function autoSetSex() {
  const first = localMouse.name?.trim().toUpperCase()[0];
  if (first === "M" || first === "A") localMouse.sex = "male";
  else if (first === "F" || first === "B") localMouse.sex = "female";
}

// 保存：用 store 的 updateMouse（保留日志/规范化）
function saveChanges() {
  if (selectedGenotype.value === "manual_input") {
    if (!manualGenotype.value.trim()) {
      alert("请输入新的基因型");
      return;
    }
    localMouse.genotype = manualGenotype.value.trim();
  } else {
    localMouse.genotype = selectedGenotype.value;
  }

  miceStore.updateMouse(props.mouse.id, toRaw(localMouse));
  emit("close");
}

// 打开另一只老鼠详情（按 id）
function openOtherDetail(id) {
  if (!id) return;
  emit("open-mouse", id);
}

// 记录死亡：直接调用 store（不解除任何配偶/亲属关系）
function handleRecordDeath() {
  const cause = prompt("请输入死亡原因:");
  if (cause === null) return;
  const c = cause.trim();
  if (!c) {
    alert("死亡原因不能为空");
    return;
  }
  miceStore.recordDeath(localMouse.id, c);
  emit("close");
}
</script>
