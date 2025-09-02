<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[1000px] max-h-[90vh] overflow-y-auto p-6 relative grid grid-cols-2 gap-6">
      <div>
        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>

        <h2 class="text-2xl font-bold mb-6">🍼 繁育管理</h2>

        <div class="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div class="flex items-start gap-3">
            <div class="text-2xl leading-none">💡</div>
            <div class="text-sm leading-6 text-gray-700">
              <p class="font-semibold text-gray-900">使用说明</p>
              <p>
                将 <span class="font-medium text-gray-900">满月/成年的异性</span> 老鼠（≥2 个月，且不含“幼鼠”状态）
                放在同一个笼位后，系统会自动识别为候选配对，并在下方按笼位列出。
              </p>
              <ul class="mt-2 list-disc pl-5">
                <li>配偶对卡片中依次确认 <span class="font-medium">配种</span>、<span class="font-medium">分笼</span>、<span class="font-medium">生产</span>；</li>
                <li>确认配种会将两只写入 <span class="font-medium">历史配偶</span>（spouseIds），便于后续家谱；</li>
                <li>预产期默认 <span class="font-medium">配种后 +21 天</span>；到期或填了生产日期后，可直接生成幼鼠。</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div v-for="pair in sortedBreedingPairs" :key="pair.key" class="mb-6 border rounded p-4">
            <h3 class="text-lg font-semibold mb-2">初始笼位: {{ miceStore.getCageName(pair.data.cageId) }}</h3>

            <div class="mb-4 border p-3 rounded bg-gray-50">
                <div class="mb-3">
                    配偶对：<b>{{ pair.male.name }}</b> ({{ displaySex(pair.male.sex) }}) ×
                    <b>{{ pair.female.name }}</b> ({{ displaySex(pair.female.sex) }})
                </div>

                <div class="grid grid-cols-3 gap-3 mb-2">
                    <div>
                        <label class="block text-sm">配种日期</label>
                        <input
                            type="date"
                            v-model="tempMatingDates[pair.key]"
                            class="border px-2 py-1 rounded w-full mb-1"
                        />
                        <button
                            class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                            @click="confirmStep(pair, 'mating')"
                        >✅ 确认配种</button>
                    </div>

                    <div>
                        <label class="block text-sm">分笼日期</label>
                        <input
                            type="date"
                            v-model="pair.data.separationDate"
                            class="border px-2 py-1 rounded w-full mb-1"
                        />
                        <button
                            class="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 w-full"
                            @click="confirmStep(pair, 'separation')"
                        >✅ 确认分笼</button>
                    </div>

                    <div>
                        <label class="block text-sm">生产日期</label>
                        <input
                            type="date"
                            v-model="pair.data.birthDate"
                            class="border px-2 py-1 rounded w-full mb-1"
                        />
                        <button
                            class="px-2 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 w-full"
                            @click="confirmStep(pair, 'birth')"
                        >✅ 确认生产</button>
                    </div>
                </div>

                <p class="text-sm text-gray-600">
                    预产期：
                    <span class="font-semibold text-red-500">
                        {{ calcDueDate(pair.data.matingDate) }}
                    </span>
                </p>

                <div v-if="isOverdueOrHasBirthDate(pair.data)" class="mt-3 flex items-center gap-2">
                    <input
                        type="number"
                        v-model.number="newPupCount[pair.key]"
                        min="1"
                        class="border px-2 py-1 rounded w-24"
                        placeholder="数量"
                    />
                    <button
                        class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        @click="addOffspring(pair)"
                    >🐭 生成新生小鼠</button>
                </div>
            </div>
        </div>
        <div v-if="sortedBreedingPairs.length === 0" class="text-center text-gray-500 mt-12">
          暂无进行中的繁育记录。
        </div>
      </div>

      <div class="border rounded p-4 bg-gray-50">
        <h3 class="text-lg font-bold mb-2">📜 操作日志</h3>
        <ul class="space-y-2 max-h-[70vh] overflow-y-auto text-sm">
          <li v-for="r in miceStore.records.slice().reverse()" :key="r.id" class="border-b pb-1">
            <span class="text-gray-600">{{ r.time }}</span><br/>
            <span class="font-medium">{{ r.action }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch } from "vue";
import { useMiceStore } from "@/stores/mice";

const emit = defineEmits(["close"]);
const miceStore = useMiceStore();

const displaySex = (s) => (s === "male" || s === "♂" ? "♂" : s === "female" || s === "♀" ? "♀" : (s || ""));
const sameId = (a, b) => String(a) === String(b);
const newPupCount = reactive({});
const tempMatingDates = reactive({});

const makePairKey = (aId, bId) => {
  const [x, y] = [String(aId), String(bId)].sort();
  return `${x}--${y}`;
};

const isAdult = (m) => {
  if (!m.birthDate) return false;
  const ageMonths = (Date.now() - new Date(m.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const notPup = !(Array.isArray(m.statuses) && m.statuses.includes("幼鼠"));
  return ageMonths >= 2 && notPup;
};

function ensureBreedingPairsInit() {
  miceStore.cages.forEach((cage) => {
    const cageMice = miceStore.normalizedMice.filter((m) => sameId(m.cageId, cage.id));
    const adults = cageMice.filter(isAdult);
    const males = adults.filter((m) => m.sex === "male" || m.sex === "♂");
    const females = adults.filter((m) => m.sex === "female" || m.sex === "♀");

    males.forEach((male) => {
      females.forEach((female) => {
        const key = makePairKey(male.id, female.id);
        const records = miceStore.breeding[key] || [];
        const latestRecord = Array.isArray(records) ? records[records.length - 1] : records;

        if (!latestRecord || latestRecord.status === 'completed') {
            miceStore.updateBreeding(key, {
              maleId: male.id,
              femaleId: female.id,
              cageId: cage.id,
              matingDate: "",
              separationDate: "",
              birthDate: "",
              status: "pending",
            });
        }
      });
    });
  });
}

onMounted(ensureBreedingPairsInit);
watch(() => [miceStore.cages, miceStore.mice], ensureBreedingPairsInit, { deep: true });

// ⚡ 核心修复：更稳定的排序逻辑
const sortedBreedingPairs = computed(() => {
    const pairs = [];
    for (const key in miceStore.breeding) {
        if (miceStore.breeding.hasOwnProperty(key)) {
            const records = miceStore.breeding[key];
            const latestRecord = Array.isArray(records) ? records[records.length - 1] : records;
            
            if (latestRecord && latestRecord.status !== "completed") {
                const male = miceStore.normalizedMice.find((m) => sameId(m.id, latestRecord.maleId));
                const female = miceStore.normalizedMice.find((m) => sameId(m.id, latestRecord.femaleId));

                if (male && female) {
                    pairs.push({ male, female, key, data: latestRecord });
                }
            }
        }
    }
    // ⚡ 新的排序逻辑：先按状态排序，然后按日期排序
    return pairs.sort((a, b) => {
        const statusOrder = { 'pending': 1, 'mating': 2, 'separated': 3 };
        const statusDiff = statusOrder[a.data.status] - statusOrder[b.data.status];
        if (statusDiff !== 0) {
            return statusDiff;
        }

        const dateA = a.data.matingDate ? new Date(a.data.matingDate) : new Date(0);
        const dateB = b.data.matingDate ? new Date(b.data.matingDate) : new Date(0);
        return dateB - dateA;
    });
});


function confirmStep(pair, step) {
  const data = pair.data;
  const cageName = miceStore.getCageName(data.cageId);

  if (step === "mating") {
    if (!tempMatingDates[pair.key]) {
      alert("请选择配种日期！");
      return;
    }
    const updatedData = { ...data, matingDate: tempMatingDates[pair.key], status: "mating" };
    miceStore.updateBreeding(pair.key, updatedData);
    miceStore.linkSpouses(pair.male.id, pair.female.id);
    miceStore.addRecord(`确认配种：笼 ${cageName}（${pair.male.name}♂ × ${pair.female.name}♀），日期：${tempMatingDates[pair.key]}`);
  }

  if (step === "separation" && data.separationDate) {
    miceStore.updateBreeding(pair.key, { ...data, status: "separated" });
    miceStore.addRecord(`确认分笼：笼 ${cageName}（${pair.female.name}♀），日期：${data.separationDate}`);
  }

  if (step === "birth" && data.birthDate) {
    miceStore.updateBreeding(pair.key, { ...data });
    const mo = miceStore.mice.find((m) => sameId(m.id, pair.female.id));
    if (mo) {
      const statuses = Array.isArray(mo.statuses) ? mo.statuses.slice() : [];
      if (!statuses.includes("怀孕")) {
         statuses.push("怀孕");
      }
      miceStore.updateMouse(mo.id, { statuses });
    }
    miceStore.addRecord(`确认生产：笼 ${cageName}（${pair.female.name}♀），日期：${data.birthDate}`);
  }
}

function calcDueDate(matingDate) {
  if (!matingDate) return "N/A";
  const d = new Date(matingDate);
  d.setDate(d.getDate() + 21);
  return d.toISOString().split("T")[0];
}

function isOverdueOrHasBirthDate(pairData) {
  if (!pairData) return false;
  if (pairData.birthDate) return true;
  if (!pairData.matingDate) return false;
  const due = new Date(pairData.matingDate);
  due.setDate(due.getDate() + 21);
  return new Date() >= due;
}

function addOffspring(pair) {
  const data = pair.data;
  const birthDate = data.birthDate || new Date().toISOString().split("T")[0];
  
  const motherMouse = miceStore.mice.find(m => sameId(m.id, pair.female.id));
  if (!motherMouse) {
      alert("错误：找不到母鼠的当前笼位，请检查数据！");
      return;
  }
  const cageId = motherMouse.cageId;
  const fatherId = pair.male.id;
  const motherId = pair.female.id;

  const count = newPupCount[pair.key] || 1;
  const pups = [];

  for (let i = 1; i <= count; i++) {
    const pupBase = {
      name: `${pair.female.name}-P${i}`,
      cageId,
      sex: i % 2 === 0 ? "male" : "female",
      genotype: "未知",
      birthDate,
      group: "未分组",
      notes: "新生幼鼠",
      statuses: ["幼鼠"],
      fatherId,
      motherId,
    };
    const pupId = miceStore.addMouse(pupBase);
    pups.push({ ...pupBase, id: pupId });
    miceStore.addChild(pupId, fatherId, motherId);
  }

  miceStore.updateBreeding(pair.key, { ...data, status: "completed" });
  miceStore.linkSpouses(fatherId, motherId);

  miceStore.addRecord(
    `生成新生小鼠：笼 ${miceStore.getCageName(cageId)}，父：${pair.male.name}，母：${pair.female.name}，数量 ${pups.length}，生日 ${birthDate}`
  );

  alert(`✅ 已生成 ${pups.length} 只新生小鼠！`);
  newPupCount[pair.key] = null;
}
</script>

<style scoped>
/* 右侧滚动区已在模板使用类控制，这里不额外样式 */
</style>