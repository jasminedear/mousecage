<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[900px] max-h-[90vh] overflow-y-auto p-6 relative">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="$emit('close')">✕</button>
      
      <h2 class="text-2xl font-bold mb-8 text-center text-gray-800">🐭 {{ mouse.name }} 的族谱</h2>

      <div class="pedigree-chart">
        
        <div v-if="parents.length > 0" class="pedigree-row justify-center mb-12">
          <div v-for="p in parents" :key="p.id" class="pedigree-node parent-node">
            <div 
              :class="[p.sex === '♂' ? 'bg-blue-100' : 'bg-red-100', 'pedigree-card p-3 rounded-full border shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
              @click="$emit('open-other', p)"
            >
              <p class="text-xl">🐭</p>
              <p class="font-bold text-sm">{{ p.name }} <span class="text-xs">{{ p.sex === '♂' ? '♂' : '♀' }}</span></p>
            </div>
          </div>
        </div>
        <p v-else class="text-center text-gray-400 mb-12">无父母记录</p>

        <div class="pedigree-row main-mouse-row justify-between items-center mb-12">
          
          <div class="w-1/3 flex flex-col items-center">
            <template v-if="spouses.length > 0">
              <h3 class="text-lg font-semibold mb-3 text-gray-700">配偶 ({{ spouses.length }})</h3>
              <div class="flex flex-wrap gap-4 justify-center">
                <div v-for="s in spouses" :key="s.id" class="pedigree-node">
                  <div 
                    :class="[s.sex === '♂' ? 'bg-blue-100' : 'bg-red-100', 'pedigree-card p-3 rounded-full border-2 border-pink-500 shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                    @click="$emit('open-other', s)"
                  >
                    <p class="text-xl">❤️</p>
                    <p class="font-bold text-sm">{{ s.name }} <span class="text-xs">{{ s.sex === '♂' ? '♂' : '♀' }}</span></p>
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-center text-gray-400 text-sm">无配偶记录</p>
          </div>

          <div class="w-1/3 flex flex-col items-center">
            <div 
              class="pedigree-card p-4 rounded-lg bg-white border-2 border-purple-500 shadow-xl transform scale-110"
            >
              <p class="font-bold text-lg">{{ mouse.name }} <span class="text-sm">{{ mouse.sex === '♂' ? '♂' : '♀' }}</span></p>
              <p class="text-sm text-gray-500">{{ mouse.genotype }}</p>
            </div>
          </div>
          
          <div class="w-1/3 flex flex-col items-center">
            <template v-if="siblings.length > 0">
              <h3 class="text-lg font-semibold mb-3 text-gray-700">兄弟姐妹 ({{ siblings.length }})</h3>
              <div class="flex flex-wrap gap-4 justify-center">
                <div v-for="s in siblings" :key="s.id" class="pedigree-node">
                  <div 
                    :class="[s.sex === '♂' ? 'bg-blue-100' : 'bg-red-100', 'pedigree-card p-3 rounded-full border shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                    @click="$emit('open-other', s)"
                  >
                    <p class="font-bold text-sm">{{ s.name }} <span class="text-xs">{{ s.sex === '♂' ? '♂' : '♀' }}</span></p>
                    <p class="text-xs text-gray-500">{{ s.genotype }}</p>
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-center text-gray-400 text-sm">无兄弟姐妹记录</p>
          </div>
        </div>

        <div v-if="children.length > 0" class="pedigree-row children-row">
          <h3 class="text-lg font-semibold my-4 text-gray-700">👶 子女 ({{ children.length }})</h3>
          <div class="flex flex-wrap gap-4 justify-center">
            <div v-for="c in children" :key="c.id" class="pedigree-node">
              <div 
                :class="[c.sex === '♂' ? 'bg-blue-100' : 'bg-red-100', 'pedigree-card p-3 rounded-full border shadow-md cursor-pointer hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200']"
                @click="$emit('open-other', c)"
              >
                <p class="font-bold text-sm">{{ c.name }} <span class="text-xs">{{ c.sex === '♂' ? '♂' : '♀' }}</span></p>
                <p class="text-xs text-gray-500">{{ c.genotype }}</p>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-center text-gray-400 my-4">暂无子女记录</p>
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

const findMouseById = (id) => miceStore.mice.find(m => m.id === id);

const parents = computed(() => {
  const parentsList = [];
  if (props.mouse.fatherId) {
    const father = findMouseById(props.mouse.fatherId);
    if (father) parentsList.push(father);
  }
  if (props.mouse.motherId) {
    const mother = findMouseById(props.mouse.motherId);
    if (mother) parentsList.push(mother);
  }
  return parentsList;
});

const spouses = computed(() => {
  if (!props.mouse.spouseIds) return [];
  return props.mouse.spouseIds.map(findMouseById).filter(Boolean);
});

const children = computed(() => {
  if (!props.mouse.childrenIds) return [];
  return props.mouse.childrenIds.map(findMouseById).filter(Boolean);
});

// 计算兄弟姐妹
const siblings = computed(() => {
  const currentMouseId = props.mouse.id;
  if (!props.mouse.fatherId && !props.mouse.motherId) {
    return [];
  }
  return miceStore.mice.filter(m => 
    m.id !== currentMouseId &&
    m.fatherId === props.mouse.fatherId &&
    m.motherId === props.mouse.motherId
  );
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
  gap: 1.5rem; /* 增加整体间距 */
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

/* 父母层的特殊样式 */
.parents-row {
  margin-bottom: 0; 
  padding-bottom: 1.5rem;
}
.parents-row + .main-mouse-row::before {
  content: '';
  position: absolute;
  top: -1.5rem;
  left: 50%;
  width: 2px;
  height: 1.5rem;
  background-color: #d1d5db;
  transform: translateX(-50%);
}

/* 子女层的特殊样式 */
.children-row {
  flex-direction: column;
}

.children-row::before {
  content: '';
  width: 2px;
  height: 1.5rem;
  background-color: #d1d5db;
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
  z-index: 1; /* 确保卡片在连接线上方 */
}
</style>