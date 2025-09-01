<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto p-6 relative">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>

      <h2 class="text-2xl font-bold mb-4">🐭 {{ localMouse.name }} 详情</h2>

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
            class="mt-2 block w-full border rounded-md"
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

      <div>
        <h3 class="text-lg font-semibold mb-2">❤️ 配偶</h3>
        <div v-if="spouses.length">
          <ul class="list-disc list-inside">
            <li
              v-for="s in spouses"
              :key="s.id"
              class="cursor-pointer text-blue-600 hover:underline"
              @click="openOtherDetail(s)"
            >
              {{ s.name }} ({{ s.sex }})
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-2">👶 子女</h3>
        <div v-if="children.length">
          <ul class="list-disc list-inside">
            <li
              v-for="c in children"
              :key="c.id"
              class="cursor-pointer text-green-600 hover:underline"
              @click="openOtherDetail(c)"
            >
              {{ c.name }} ({{ c.sex }})
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-2">👨‍👩‍👧 父母</h3>
        <div v-if="father || mother">
          <p v-if="father" class="cursor-pointer text-purple-600 hover:underline" @click="openOtherDetail(father)">
            父：{{ father.name }} (♂)
          </p>
          <p v-if="mother" class="cursor-pointer text-pink-600 hover:underline" @click="openOtherDetail(mother)">
            母：{{ mother.name }} (♀)
          </p>
        </div>
        <p v-else class="text-gray-500">暂无</p>
      </div>

<!-- 放在保存/取消下面，记录死亡上面 -->
<div class="mt-2 flex justify-end">
  <button
    class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
    @click="emit('open-pedigree', localMouse)"
  >
    🧬 查看族谱
  </button>
</div>

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
import { reactive, computed, ref } from "vue";
import { useMiceStore } from "@/stores/mice";
import { toRaw } from "vue";

const props = defineProps({
  mouse: { type: Object, required: true },
});
const emit = defineEmits(["close", "open-other", "open-pedigree", "record-death"]);
const miceStore = useMiceStore();

const statusOptions = ["怀孕", "哺乳", "幼鼠", "其他"];

const localMouse = reactive({ statuses: [], ...toRaw(props.mouse) });

const findMouseById = (id) => miceStore.mice.find(m => m.id === id) || miceStore.deadMice.find(m => m.id === id);

const allGenotypes = computed(() => {
  const genotypes = miceStore.mice.map(m => m.genotype).filter(g => g);
  return [...new Set(genotypes)];
});

const selectedGenotype = ref(localMouse.genotype || "");
const manualGenotype = ref("");

const spouses = computed(() => {
  if (!props.mouse.spouseIds) return [];
  return props.mouse.spouseIds.map(findMouseById).filter(Boolean);
});

const children = computed(() => {
  if (!props.mouse.childrenIds) return [];
  return props.mouse.childrenIds.map(findMouseById).filter(Boolean);
});

const father = computed(() => props.mouse.fatherId ? findMouseById(props.mouse.fatherId) : null);
const mother = computed(() => props.mouse.motherId ? findMouseById(props.mouse.motherId) : null);

function autoSetSex() {
  const firstChar = localMouse.name?.trim().toUpperCase()[0];
  if (firstChar === "M" || firstChar === "A") {
    localMouse.sex = "male";
  } else if (firstChar === "F" || firstChar === "B") {
    localMouse.sex = "female";
  }
}

function saveChanges() {
  if (selectedGenotype.value === 'manual_input') {
    localMouse.genotype = manualGenotype.value;
  } else {
    localMouse.genotype = selectedGenotype.value;
  }
  
  const index = miceStore.mice.findIndex(m => m.id === props.mouse.id);
  if (index !== -1) {
    miceStore.mice[index] = { ...toRaw(localMouse) };
  }
  
  miceStore.addRecord(`更新老鼠 ${localMouse.name} 信息`);
  emit("close");
}

function openOtherDetail(mouse) {
  emit("open-other", mouse);
}

function handleRecordDeath() {
  const cause = prompt("请输入死亡原因:");
  if (cause === null) {
    return;
  }
  if (cause.trim() === '') {
    alert("死亡原因不能为空，请重新输入或点击取消。");
    return;
  }
  
  emit('record-death', localMouse.id, cause);
  emit("close");
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}
.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
}
</style>