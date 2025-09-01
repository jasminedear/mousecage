<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-96 p-6 relative max-h-[90vh] overflow-y-auto">
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        @click="emit('close')"
      >
        ✕
      </button>

      <h2 class="text-xl font-bold mb-4">添加老鼠</h2>

      <div class="space-y-3">
        <label class="block">
          <span class="text-gray-700">编号</span>
          <input
            v-model="mouseName"
            @input="autoSetSex"
            type="text"
            class="w-full border px-3 py-2 rounded mt-1"
            placeholder="如 M01 / F01"
          />
        </label>

        <label class="block">
          <span class="text-gray-700">笼子</span>
          <select v-model="cageIdValue" class="w-full border px-3 py-2 rounded mt-1">
            <option disabled value="">请选择笼子</option>
            <option v-for="cage in miceStore.cages" :key="cage.id" :value="cage.id">
              {{ cage.name }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-gray-700">基因型</span>
          <select v-model="genotype" class="w-full border px-3 py-2 rounded mt-1">
            <option v-for="g in allGenotypeOptions" :key="g" :value="g">{{ g }}</option>
            <option value="custom">➕ 自定义</option>
          </select>
        </label>

        <div v-if="genotype === 'custom'" class="mt-2">
          <input
            v-model="customGenotype"
            type="text"
            placeholder="请输入自定义基因型"
            class="w-full border px-3 py-2 rounded"
          />
        </div>

        <label class="block">
          <span class="text-gray-700">性别</span>
          <select v-model="sex" class="w-full border px-3 py-2 rounded mt-1">
            <option value="♂">雄性 (♂)</option>
            <option value="♀">雌性 (♀)</option>
          </select>
        </label>

        <label class="block">
          <span class="text-gray-700">出生日期</span>
          <input type="date" v-model="birthDate" class="w-full border px-3 py-2 rounded mt-1" />
        </label>

        <label class="block">
          <span class="text-gray-700">实验分组</span>
          <select v-model="group" class="w-full border px-3 py-2 rounded mt-1">
            <option value="对照组">对照组</option>
            <option value="模型组">模型组</option>
            <option value="给药组">给药组</option>
            <option value="阳性对照组">阳性对照组</option>
            <option value="未分组">未分组</option>
          </select>
        </label>

        <label class="block">
          <span class="text-gray-700">备注（繁育情况等）</span>
          <textarea
            v-model="notes"
            rows="2"
            class="w-full border px-3 py-2 rounded mt-1"
            placeholder="如：第2胎，3公2母"
          ></textarea>
        </label>
      </div>

      <div class="mt-4 flex justify-end space-x-2">
        <button
          type="button"
          class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          @click="handleAddMouse"
        >
          确认添加
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useMiceStore } from "@/stores/mice";

const props = defineProps({
  cageId: { type: [Number, String], default: null }
});
const emit = defineEmits(["close"]);
const miceStore = useMiceStore();

const mouseName = ref("");
const cageIdValue = ref(props.cageId || "");
const genotype = ref("C57");
const customGenotype = ref("");
const sex = ref("♂");
const birthDate = ref("");
const group = ref("未分组");
const notes = ref("");

// ⚡ 优化：通过 computed 属性获取 Pinia store 中的所有基因型
const allGenotypeOptions = computed(() => {
  const genotypes = miceStore.allGenotypes;
  // 确保选项列表包含默认的 'C57'
  return genotypes.length ? genotypes : ['C57'];
});

onMounted(() => {
  if (props.cageId) {
    cageIdValue.value = props.cageId;
  }
  // ⚡ 修复：确保默认基因型有效
  if (!allGenotypeOptions.value.includes(genotype.value)) {
    genotype.value = allGenotypeOptions.value[0] || '';
  }
});

function autoSetSex() {
  const firstChar = mouseName.value?.trim().toUpperCase()[0];
  if (firstChar === "M" || firstChar === "A") {
    sex.value = "♂";
  } else if (firstChar === "F" || firstChar === "B") {
    sex.value = "♀";
  }
}

// ⚡ 简化：移除 checkCustomGenotype
// 移除 addCustomGenotype

function handleAddMouse() {
  if (!mouseName.value.trim()) {
    alert("请输入编号");
    return;
  }
  if (!cageIdValue.value) {
    alert("请选择笼子");
    return;
  }

  // ⚡ 修复：当选择“自定义”时，使用 customGenotype 的值
  const finalGenotype = genotype.value === 'custom' ? customGenotype.value.trim() : genotype.value;
  if (!finalGenotype) {
    alert('请选择或输入基因型');
    return;
  }
  
  miceStore.addMouse({
    name: mouseName.value,
    cageId: cageIdValue.value,
    genotype: finalGenotype,
    sex: sex.value,
    birthDate: birthDate.value,
    group: group.value,
    notes: notes.value
  });

  emit("close");
}
</script>