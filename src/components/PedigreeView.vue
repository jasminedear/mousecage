<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[900px] max-h-[90vh] overflow-y-auto p-6 relative">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="$emit('close')">✕</button>
      
      <h2 class="text-2xl font-bold mb-8 text-center text-gray-800">🐭 {{ currentMouse?.name || '未知' }} 的族谱</h2>

      <div class="pedigree-chart">
        <div class="pedigree-row justify-center mb-12">
          <template v-if="parents.length > 0">
            <div v-for="p in parents" :key="p.id" class="pedigree-node parent-node">
              <div 
                :class="[sexBgClass(p), 'pedigree-card p-3 rounded-full border shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                @click="$emit('open-other', p)"
                :title="personTitle(p)"
              >
                <p class="font-bold text-sm">
                  {{ p.name }} 
                  <span class="text-xs">{{ sexSymbol(p) }}</span>
                  <span v-if="p.__dead" class="text-xs text-gray-500">（已死亡）</span>
                </p>
                <p v-if="p.genotype" class="text-xs text-gray-500">{{ p.genotype }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-center text-gray-400">无父母记录</p>
        </div>

        <div class="pedigree-row main-mouse-row justify-between items-center mb-12">
          <div class="w-1/3 flex flex-col items-center">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">配偶 ({{ spouses.length }})</h3>
            <template v-if="spouses.length > 0">
              <div class="flex flex-wrap gap-4 justify-center">
                <div v-for="s in spouses" :key="s.id" class="pedigree-node">
                  <div 
                    :class="[sexBgClass(s), 'pedigree-card p-3 rounded-full border-2 border-pink-500 shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                    @click="$emit('open-other', s)"
                    :title="personTitle(s)"
                  >
                    <p class="font-bold text-sm">
                      {{ s.name }} 
                      <span class="text-xs">{{ sexSymbol(s) }}</span>
                      <span v-if="s.__dead" class="text-xs text-gray-500">（已死亡）</span>
                    </p>
                    <p v-if="s.genotype" class="text-xs text-gray-500">{{ s.genotype }}</p>
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-center text-gray-400 text-sm">暂无</p>
          </div>

          <div class="w-1/3 flex flex-col items-center">
            <div 
              class="pedigree-card p-4 rounded-lg bg-white border-2 border-purple-500 shadow-xl transform scale-110"
              :title="personTitle(currentMouse)"
            >
              <p class="font-bold text-lg">
                {{ currentMouse?.name || '未知' }}
                <span class="text-sm">{{ sexSymbol(currentMouse) }}</span>
                <span v-if="currentMouse?.__dead" class="text-xs text-gray-500">（已死亡）</span>
              </p>
              <p class="text-sm text-gray-500">{{ currentMouse?.genotype || '' }}</p>
            </div>
          </div>
          
          <div class="w-1/3 flex flex-col items-center">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">兄弟姐妹 ({{ siblings.length }})</h3>
            <template v-if="siblings.length > 0">
              <div class="flex flex-wrap gap-4 justify-center">
                <div v-for="s in siblings" :key="s.id" class="pedigree-node">
                  <div 
                    :class="[sexBgClass(s), 'pedigree-card p-3 rounded-full border shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                    @click="$emit('open-other', s)"
                    :title="personTitle(s)"
                  >
                    <p class="font-bold text-sm">
                      {{ s.name }} 
                      <span class="text-xs">{{ sexSymbol(s) }}</span>
                      <span v-if="s.__dead" class="text-xs text-gray-500">（已死亡）</span>
                    </p>
                    <p v-if="s.genotype" class="text-xs text-gray-500">{{ s.genotype }}</p>
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-center text-gray-400 text-sm">暂无</p>
          </div>
        </div>

        <div class="pedigree-row children-row">
          <h3 class="text-lg font-semibold my-4 text-gray-700">👶 子女 ({{ children.length }})</h3>
          <template v-if="children.length > 0">
            <div class="flex flex-wrap gap-4 justify-center">
              <div v-for="c in children" :key="c.id" class="pedigree-node">
                <div 
                  :class="[sexBgClass(c), 'pedigree-card p-3 rounded-full border shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                  @click="$emit('open-other', c)"
                  :title="personTitle(c)"
                >
                  <p class="font-bold text-sm">
                    {{ c.name }} 
                    <span class="text-xs">{{ sexSymbol(c) }}</span>
                    <span v-if="c.__dead" class="text-xs text-gray-500">（已死亡）</span>
                  </p>
                  <p v-if="c.genotype" class="text-xs text-gray-500">{{ c.genotype }}</p>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="text-center text-gray-400">暂无</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMiceStore } from '@/stores/mice';

const props = defineProps({
  mouse: { type: Object, required: true }
});
const emit = defineEmits(['close', 'open-other']);
const miceStore = useMiceStore();

/**
 * 确保始终以 store 最新对象为准，避免 props 旧快照
 * 1. 从活体列表找
 * 2. 如果没找到，从死亡列表找，并标记死亡状态
 * 3. 仍未找到则退回 props 传入的对象
 */
const currentMouse = computed(() => {
  const id = String(props.mouse.id);
  const live = miceStore.mice.find(m => String(m.id) === id);
  if (live) return live;
  
  const dead = miceStore.deadMice.find(m => String(m.id) === id);
  return dead ? { ...dead, __dead: true } : props.mouse;
});

/** 在活体或死亡里找人；并标记 __dead；统一字符串化 id */
const findMouseById = (id) => {
  const sid = String(id);
  const live = miceStore.mice.find(m => String(m.id) === sid);
  if (live) return live;
  const dead = miceStore.deadMice.find(m => String(m.id) === sid);
  return dead ? { ...dead, __dead: true } : null;
};

/** 性别工具：兼容 'male'/'female' 和 '♂'/'♀' */
const normSex = (m) => {
  const sx = m?.sex;
  if (sx === 'male' || sx === '♂') return 'male';
  if (sx === 'female' || sx === '♀') return 'female';
  return 'unknown';
};
const sexSymbol = (m) => (normSex(m) === 'male' ? '♂' : normSex(m) === 'female' ? '♀' : '？');
const sexBgClass = (m) => (normSex(m) === 'male' ? 'bg-blue-100' : normSex(m) === 'female' ? 'bg-red-100' : 'bg-gray-100');
const personTitle = (m) => `${m?.name ?? '未知'} ${sexSymbol(m)}${m?.genotype ? ` / ${m.genotype}` : ''}${m?.__dead ? '（已死亡）' : ''}`;

/** 父母（静态） */
const parents = computed(() => {
  const p = [];
  const fId = currentMouse.value?.fatherId;
  const mId = currentMouse.value?.motherId;
  if (fId != null) {
    const f = findMouseById(fId);
    if (f) p.push(f);
  }
  if (mId != null) {
    const m = findMouseById(mId);
    if (m) p.push(m);
  }
  return p;
});

/** 配偶（静态历史） */
const spouses = computed(() => {
  const ids = Array.isArray(currentMouse.value?.spouseIds) ? currentMouse.value.spouseIds : [];
  return ids.map(findMouseById).filter(Boolean);
});

/** 子女（静态历史） */
const children = computed(() => {
  const ids = Array.isArray(currentMouse.value?.childrenIds) ? currentMouse.value.childrenIds : [];
  return ids.map(findMouseById).filter(Boolean);
});

/** 兄弟姐妹：调用 store 的 getter */
const siblings = computed(() => {
  const me = currentMouse.value;
  if (!me) return [];
  const myId = String(me.id);
  const fId = me.fatherId != null ? String(me.fatherId) : null;
  const mId = me.motherId != null ? String(me.motherId) : null;
  if (!fId && !mId) return [];

  const all = [...miceStore.mice, ...miceStore.deadMice.map(x => ({ ...x, __dead: true }))];
  return all.filter(x => {
    if (String(x.id) === myId) return false;
    const xf = x.fatherId != null ? String(x.fatherId) : null;
    const xm = x.motherId != null ? String(x.motherId) : null;
    return xf === fId && xm === mId;
  });
});
</script>

<style scoped>
/* Modal 样式 */
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.bg-black { background-color: #000; }
.bg-opacity-40 { background-color: rgba(0, 0, 0, 0.4); }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.z-50 { z-index: 50; }
.w-\[900px\] { width: 900px; } 
.max-h-\[90vh\] { max-height: 90vh; }
.overflow-y-auto { overflow-y: auto; }
.p-6 { padding: 1.5rem; }
.relative { position: relative; }

/* 族谱图表样式 */
.pedigree-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.pedigree-row {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.pedigree-node {
  min-width: 100px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.pedigree-card {
  min-width: 120px;
  text-align: center;
}

/* 主体老鼠 & 配偶 & 兄弟姐妹层 */
.main-mouse-row {
  position: relative;
  justify-content: space-between;
  gap: 1rem;
}
.main-mouse-row::before {
  content: '';
  width: 100%;
  height: 2px;
  background-color: #d1d5db;
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 0;
}
.main-mouse-row > * {
  z-index: 1;
}
</style>