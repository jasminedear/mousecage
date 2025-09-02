<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[1000px] max-h-[90vh] overflow-y-auto p-6 relative">

      <!-- 关闭 -->
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>

      <!-- 顶部：搜索过滤 -->
      <div class="mb-4 flex items-center gap-2">
        <input
          v-model="query"
          @keydown.enter.prevent
          type="text"
          placeholder="🔎 输入老鼠编号或笼位（如 M01 / A-1-01）进行筛选"
          class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
        />
        <button
          class="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
          @click="query = ''"
          :disabled="!query"
        >清空</button>
      </div>

      <!-- 顶部两栏：左说明 / 右✂️清单 -->
      <div class="mb-6 flex gap-6">
        <!-- 左：使用说明 -->
        <div class="flex-1 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <h2 class="text-2xl font-bold mb-4">🍼 繁育管理</h2>
          <div class="flex items-start gap-3">
            <div class="text-2xl leading-none">💡</div>
            <div class="text-sm leading-6 text-gray-700">
              <ul class="list-disc pl-5 space-y-1">
                <li>同笼、成年、异性 → 自动生成候选配对；</li>
                <li>排序按 <span class="font-medium">预产期（配种+21天）</span> 由近到远；未设配种日期的在最后；</li>
                <li>三个日期使用本地草稿，<span class="font-medium">点“确认”</span>才写回并保存；</li>
                <li>只通过 <span class="font-medium">“🐭 生成新生小鼠”</span> 创建幼鼠；不会自动生成。</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 右：✂️需剪指/贴耳标 -->
        <div class="w-[360px] rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
          <h3 class="text-lg font-bold mb-3">
            ✂️ 需剪指/贴耳标（≥21天）
            <span class="text-sm font-normal text-gray-600">— 共 {{ filteredPupsNeedingTag.length }} 只</span>
          </h3>

          <div v-if="filteredPupsNeedingTag.length === 0" class="text-gray-500 text-sm">
            {{ query ? '无匹配结果' : '当前没有待标记的小鼠。' }}
          </div>

          <ul v-else class="space-y-2 text-sm max-h-[260px] overflow-y-auto">
            <li
              v-for="m in filteredPupsNeedingTag"
              :key="m.id"
              class="border rounded p-2 bg-white"
            >
              <div class="flex justify-between items-start gap-3">
                <div>
                  <div class="font-semibold">
                    {{ m.name }}（{{ displaySex(m.sex) }}）
                    <span class="ml-2 text-xs text-gray-500">笼：{{ miceStore.getCageName(m.cageId) }}</span>
                  </div>
                  <div class="text-xs text-gray-600 mt-0.5">
                    出生：{{ m.birthDate }} ｜ 已龄：{{ ageDays(m.birthDate) }} 天 ｜ 基因型：{{ m.genotype || '未知' }}
                  </div>
                </div>
                <button
                  class="px-2 py-1 bg-gray-800 text-white rounded hover:bg-black text-xs whitespace-nowrap"
                  @click="markTagged(m.id)"
                >
                  已剪指/贴耳标
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 繁育配对列表（按预产期排序 + 搜索过滤） -->
      <div
        v-for="pair in filteredBreedingPairs"
        :key="pair.key"
        class="mb-6 border rounded p-4"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold">初始笼位：{{ miceStore.getCageName(pair.data.cageId) }}</h3>
          <button class="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  @click="deletePair(pair)">删除配对</button>
        </div>

        <div class="mb-4 border p-3 rounded bg-gray-50">
          <div class="mb-3 flex items-center flex-wrap gap-x-3 gap-y-2">
            <div>
              配偶对：
              <b>{{ pair.male.name }}</b> ({{ displaySex(pair.male.sex) }}) ×
              <b>{{ pair.female.name }}</b> ({{ displaySex(pair.female.sex) }})
            </div>
            <!-- 可再配提示：若已填分笼日期则不显示 -->
            <span
              v-if="showMotherBadge(pair)"
              :class="['text-xs px-2 py-0.5 rounded-full', motherBadge(pair.female).cls]"
            >
              {{ motherBadge(pair.female).text }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-2">
            <!-- 配种 -->
            <div>
              <label class="block text-sm">配种日期</label>
              <input
                type="date"
                v-model="draftFor(pair.key).matingDate"
                class="border px-2 py-1 rounded w-full mb-1"
              />
              <button
                class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                @click="confirmStep(pair, 'mating')"
              >✅ 确认配种</button>
            </div>

            <!-- 分笼 -->
            <div>
              <label class="block text-sm">分笼日期</label>
              <input
                type="date"
                v-model="draftFor(pair.key).separationDate"
                class="border px-2 py-1 rounded w-full mb-1"
              />
              <button
                class="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 w-full"
                @click="confirmStep(pair, 'separation')"
              >✅ 确认分笼</button>
            </div>

            <!-- 生产 -->
            <div>
              <label class="block text-sm">生产日期</label>
              <input
                type="date"
                v-model="draftFor(pair.key).birthDate"
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
            <span class="font-semibold" :class="dueDateColor(calcDueDate(pair.data.matingDate))">
              {{ calcDueDate(pair.data.matingDate) }}
            </span>
          </p>

          <!-- 手动生成幼鼠（唯一入口） -->
          <div class="mt-3 flex items-center gap-2">
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

      <div v-if="filteredBreedingPairs.length === 0" class="text-center text-gray-500 mt-12">
        {{ query ? '无匹配的配对记录。' : '暂时没有进行中的繁育记录。' }}
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch, ref } from "vue";
import { useMiceStore } from "@/stores/mice";

const emit = defineEmits(["close"]);
const miceStore = useMiceStore();

const displaySex = (s) => (s === "male" || s === "♂" ? "♂" : s === "female" || s === "♀" ? "♀" : (s || ""));
const sameId = (a, b) => String(a) === String(b);
const toKey = (v) => String(v || "").toLowerCase();

// —— 搜索关键字 —— //
const query = ref("");

// —— 本地草稿（每个配对一个对象） —— //
const drafts = reactive({}); // key -> { matingDate, separationDate, birthDate }
function draftFor(key) {
  if (!drafts[key]) drafts[key] = { matingDate: "", separationDate: "", birthDate: "" };
  return drafts[key];
}
function fillDraftFromData(pair) {
  const d = draftFor(pair.key);
  d.matingDate     ||= pair.data.matingDate     || "";
  d.separationDate ||= pair.data.separationDate || "";
  d.birthDate      ||= pair.data.birthDate      || "";
}

const newPupCount = reactive({});

// 统一配对 key
const makePairKey = (aId, bId) => {
  const [x, y] = [String(aId), String(bId)].sort();
  return `${x}--${y}`;
};

// 成年判定：有出生日期、≥2个月、且不含“幼鼠”
const isAdult = (m) => {
  if (!m.birthDate) return false;
  const ageMonths = (Date.now() - new Date(m.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const notPup = !(Array.isArray(m.statuses) && m.statuses.includes("幼鼠"));
  return ageMonths >= 2 && notPup;
};

// 初始化候选配对
function ensureBreedingPairsInit() {
  miceStore.cages.forEach((cage) => {
    const cageMice = miceStore.normalizedMice.filter((m) => sameId(m.cageId, cage.id));
    const adults = cageMice.filter(isAdult);
    const males = adults.filter((m) => m.sex === "male" || m.sex === "♂");
    const females = adults.filter((m) => m.sex === "female" || m.sex === "♀");

    males.forEach((male) => {
      females.forEach((female) => {
        const key = makePairKey(male.id, female.id);
        const rec = miceStore.breeding[key] || [];
        const latest = Array.isArray(rec) ? rec[rec.length - 1] : rec;
        if (!latest || latest.status === "completed") {
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

// 打开/数据变化：维持候选配对
onMounted(ensureBreedingPairsInit);
watch(() => [miceStore.cages, miceStore.mice], ensureBreedingPairsInit, { deep: true });

// 预产期
function calcDueDate(matingDate) {
  if (!matingDate) return "未设置";
  const d = new Date(matingDate);
  d.setDate(d.getDate() + 21);
  return d.toISOString().split("T")[0];
}
function dueDateColor(dueStr) {
  if (dueStr === "未设置") return "text-gray-400";
  const due = new Date(dueStr);
  const today = new Date();
  if (today > due) return "text-red-600";
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return "text-orange-500";
  return "text-gray-700";
}

// 配对：按预产期排序（近 → 远；未设置最后）
const sortedBreedingPairs = computed(() => {
  const pairs = [];
  for (const key in miceStore.breeding) {
    if (!Object.prototype.hasOwnProperty.call(miceStore.breeding, key)) continue;
    const recs = miceStore.breeding[key];
    const data = Array.isArray(recs) ? recs[recs.length - 1] : recs;
    if (!data || data.status === "completed") continue;

    const male = miceStore.normalizedMice.find((m) => sameId(m.id, data.maleId));
    const female = miceStore.normalizedMice.find((m) => sameId(m.id, data.femaleId));
    if (!male || !female) continue;

    const dueStr = calcDueDate(data.matingDate);
    const due = dueStr === "未设置" ? null : new Date(dueStr);
    const pair = { key, data, male, female, due };
    pairs.push(pair);
  }

  pairs.sort((a, b) => {
    if (a.due && b.due) return a.due - b.due;
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    return 0;
  });

  // 为显示中的每个 pair 补草稿（不覆盖已有输入）
  pairs.forEach(fillDraftFromData);
  return pairs;
});

// —— 搜索过滤 —— //
// pups：按小鼠名或笼位名匹配
const filteredPupsNeedingTag = computed(() => {
  const list = pupsNeedingTag.value;
  const q = toKey(query.value);
  if (!q) return list;
  return list.filter((m) => {
    const nameHit = toKey(m.name).includes(q);
    const cageHit = toKey(miceStore.getCageName(m.cageId)).includes(q);
    return nameHit || cageHit;
  });
});
// pairs：按公/母名或笼位名匹配
const filteredBreedingPairs = computed(() => {
  const list = sortedBreedingPairs.value;
  const q = toKey(query.value);
  if (!q) return list;
  return list.filter((p) => {
    const maleHit = toKey(p.male.name).includes(q);
    const femaleHit = toKey(p.female.name).includes(q);
    const cageHit = toKey(miceStore.getCageName(p.data.cageId)).includes(q);
    return maleHit || femaleHit || cageHit;
  });
});

// 母鼠可再配徽标（若本对已填分笼则不显示）
function showMotherBadge(pair) {
  return !pair.data.separationDate;
}
function motherBadge(female) {
  const isNursing = Array.isArray(female.statuses) && female.statuses.includes("哺乳");
  // 找最近一次 completed 的生产
  let lastBirth = null;
  for (const key in miceStore.breeding) {
    const rec = miceStore.breeding[key];
    const data = Array.isArray(rec) ? rec[rec.length - 1] : rec;
    if (data?.status === "completed" && sameId(data.femaleId, female.id) && data.birthDate) {
      const d = new Date(data.birthDate);
      if (!lastBirth || d > lastBirth) lastBirth = d;
    }
  }
  const today = new Date();
  if (lastBirth) {
    const readyDate = new Date(lastBirth);
    readyDate.setDate(readyDate.getDate() + 21);
    if (today >= readyDate && !isNursing) {
      return { text: "✅ 可再次配种", cls: "bg-green-100 text-green-700" };
    }
    return { text: `⏳ 待至 ${readyDate.toISOString().split("T")[0]}`, cls: "bg-yellow-100 text-yellow-700" };
  } else {
    return !isNursing
      ? { text: "✅ 可再次配种", cls: "bg-green-100 text-green-700" }
      : { text: "⏳ 哺乳中", cls: "bg-yellow-100 text-yellow-700" };
  }
}

// 三步确认（草稿 → 写回 → 保存）
async function confirmStep(pair, step) {
  const data = pair.data;
  const d = draftFor(pair.key);

  if (step === "mating") {
    if (!d.matingDate) { alert("请选择配种日期！"); return; }
    miceStore.updateBreeding(pair.key, { ...data, matingDate: d.matingDate, status: "mating" });
    miceStore.linkSpouses(pair.male.id, pair.female.id);
    await miceStore.saveToCloud({ silent: true });
  }

  if (step === "separation") {
    if (!d.separationDate) { alert("请选择分笼日期！"); return; }
    miceStore.updateBreeding(pair.key, { ...data, separationDate: d.separationDate, status: "separated" });
    await miceStore.saveToCloud({ silent: true });
  }

  if (step === "birth") {
    if (!d.birthDate) { alert("请选择生产日期！"); return; }
    miceStore.updateBreeding(pair.key, { ...data, birthDate: d.birthDate });
    // 给母鼠打“哺乳”
    const mo = miceStore.mice.find((m) => sameId(m.id, pair.female.id));
    if (mo) {
      const statuses = Array.isArray(mo.statuses) ? mo.statuses.slice() : [];
      if (!statuses.includes("哺乳")) statuses.push("哺乳");
      miceStore.updateMouse(mo.id, { statuses });
    }
    await miceStore.saveToCloud({ silent: true });
  }
}

// 删除配对（不动老鼠档案）
async function deletePair(pair) {
  if (!confirm(`确定删除配对：${pair.male.name} × ${pair.female.name}？`)) return;
  if (Object.prototype.hasOwnProperty.call(miceStore.breeding, pair.key)) {
    delete miceStore.breeding[pair.key];
  }
  delete drafts[pair.key];
  delete newPupCount[pair.key];
  await miceStore.saveToCloud({ silent: true });
}

// 生成幼鼠（唯一入口）
async function addOffspring(pair) {
  const data = pair.data;
  const birthDate = data.birthDate || new Date().toISOString().split("T")[0];

  const mother = miceStore.mice.find((m) => sameId(m.id, pair.female.id));
  if (!mother) { alert("错误：找不到母鼠的当前笼位"); return; }

  const cageId = mother.cageId;
  const fatherId = pair.male.id;
  const motherId = pair.female.id;

  const count = newPupCount[pair.key] || 1;
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
    miceStore.addChild(pupId, fatherId, motherId);
  }
  miceStore.linkSpouses(fatherId, motherId);
  miceStore.updateBreeding(pair.key, { ...data, status: "completed" });

  newPupCount[pair.key] = null;
  await miceStore.saveToCloud({ silent: true });
}

// ✂️需剪指/贴耳标清单（≥21天 & 未标记），按出生早→晚
function ageDays(isoDate) {
  if (!isoDate) return 0;
  const d = new Date(isoDate);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}
const pupsNeedingTag = computed(() =>
  miceStore.mice
    .filter((m) => {
      const isPup = Array.isArray(m.statuses) && m.statuses.includes("幼鼠");
      const days = ageDays(m.birthDate);
      const notTagged = !m.taggedAt;
      return isPup && days >= 21 && notTagged;
    })
    .sort((a, b) => new Date(a.birthDate) - new Date(b.birthDate))
);
async function markTagged(mouseId) {
  const m = miceStore.mice.find((x) => sameId(x.id, mouseId));
  if (!m) return;
  const updated = { taggedAt: new Date().toISOString() };
  const statuses = Array.isArray(m.statuses) ? m.statuses.slice() : [];
  const idx = statuses.indexOf("幼鼠");
  if (idx !== -1) statuses.splice(idx, 1);
  updated.statuses = statuses;
  miceStore.updateMouse(mouseId, updated);
  await miceStore.saveToCloud({ silent: true });
}
</script>

<style scoped>
/* 主要使用实用类，这里留白 */
</style>
