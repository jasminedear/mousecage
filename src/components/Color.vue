<template>
  <div :class="cardClasses">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  mouse: { type: Object, required: true },
});

// 计算背景色和文字颜色类
const cardClasses = computed(() => {
  let bgColorClass;
  let textColorClass = 'text-white'; // 默认文字颜色为白色，适用于深色背景

  switch (props.mouse.sex) {
    case 'male':
      bgColorClass = 'bg-blue-500';
      break;
    case 'female':
      bgColorClass = 'bg-red-500';
      break;
    case 'pregnant':
      bgColorClass = 'bg-green-500';
      break;
    case 'newborn':
      bgColorClass = 'bg-purple-500';
      break;
    case 'lactating':
      bgColorClass = 'bg-yellow-500';
      textColorClass = 'text-gray-800'; // 对于浅色背景，文字改为深色
      break;
    default:
      // 如果没有 sex 属性或值不匹配，使用默认颜色
      bgColorClass = 'bg-gray-200';
      textColorClass = 'text-gray-800';
      break;
  }

  // 返回一个包含所有动态类的数组
  return [bgColorClass, textColorClass, 'border-2', 'border-transparent'];
});
</script>

<style scoped>
/* 这里可以放置与颜色逻辑相关的样式，例如边框颜色等 */
</style>