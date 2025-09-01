<template>
  <div :class="['relative border rounded-lg p-4 shadow-sm hover:shadow-md transition', backgroundColorClass]">
    <div :class="['absolute top-0 left-0 w-1 h-full rounded-l-lg', statusMarkerClass]"></div>
    
    <div class="flex justify-between items-center mb-2">
      <h3 :class="[colorClass, 'font-semibold text-lg']">
        {{ mouse.name }}
      </h3>
      <p class="text-sm text-gray-500">
        {{ mouse.genotype }} | {{ displaySex }} | {{ mouse.group }}
      </p>
    </div>
    
    <div class="flex gap-2 relative">
      <button
        @click="$emit('view', mouse)"
        class="text-blue-500 hover:text-blue-700 transition"
        title="详情"
      >
        <span class="text-xl">🔍</span>
      </button>

      <button
        @click="$emit('move', mouse)"
        class="text-yellow-500 hover:text-yellow-700 transition"
        title="移动"
      >
        <span class="text-xl">✈️</span>
      </button>

      <button
        @click="$emit('delete', mouse.id)"
        class="text-red-500 hover:text-red-700 transition"
        title="删除"
      >
        <span class="text-xl">❌</span>
      </button>

      <button
        @click="$emit('record-death-clicked', { mouse: mouse, event: $event })"
        class="text-gray-500 hover:text-gray-700 transition"
        title="死亡"
      >
        <span class="text-xl">💀</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, defineEmits } from 'vue';

const props = defineProps({
  mouse: { type: Object, required: true },
});

// 移除 record-death 事件，添加 record-death-clicked 事件
const emit = defineEmits(['view', 'move', 'delete', 'record-death-clicked']);

// === 颜色类映射 ===
const statusColors = {
  '幼鼠': 'text-purple-700',
  '怀孕': 'text-green-700',
  '哺乳': 'text-orange-700',
  'male': 'text-blue-700',
  '♂': 'text-blue-700',
  'female': 'text-red-700',
  '♀': 'text-red-700',
  'normal': 'text-gray-700'
};

const backgroundColors = {
  'male': 'bg-blue-100',
  '♂': 'bg-blue-100',
  'female': 'bg-red-100',
  '♀': 'bg-red-100',
  'special': 'bg-gray-100',
  'default': 'bg-white'
};

const statusMarkerColors = {
  '幼鼠': 'bg-purple-500',
  '怀孕': 'bg-green-500',
  '哺乳': 'bg-orange-500',
  'default': 'bg-transparent',
};

// === 动态样式 ===
const colorClass = computed(() => {
  const mouse = props.mouse;
  if (Array.isArray(mouse.statuses) && mouse.statuses.length > 0) {
    for (const status of ['幼鼠', '怀孕', '哺乳']) {
      if (mouse.statuses.includes(status)) {
        return statusColors[status];
      }
    }
  }
  if (mouse.sex && statusColors[mouse.sex]) return statusColors[mouse.sex];
  return statusColors.normal;
});

const backgroundColorClass = computed(() => {
  const mouse = props.mouse;
  if (Array.isArray(mouse.statuses) && mouse.statuses.length > 0) {
    for (const status of ['幼鼠', '怀孕', '哺乳']) {
      if (mouse.statuses.includes(status)) {
        return backgroundColors.special;
      }
    }
  }
  if (mouse.sex && backgroundColors[mouse.sex]) return backgroundColors[mouse.sex];
  return backgroundColors.default;
});

const statusMarkerClass = computed(() => {
  const mouse = props.mouse;
  if (Array.isArray(mouse.statuses) && mouse.statuses.length > 0) {
    for (const status of ['幼鼠', '怀孕', '哺乳']) {
      if (mouse.statuses.includes(status)) {
        return statusMarkerColors[status];
      }
    }
  }
  return statusMarkerColors.default;
});

// === 性别符号显示 ===
const displaySex = computed(() => {
  if (props.mouse.sex === 'male' || props.mouse.sex === '♂') return '♂';
  if (props.mouse.sex === 'female' || props.mouse.sex === '♀') return '♀';
  return props.mouse.sex;
});
</script>