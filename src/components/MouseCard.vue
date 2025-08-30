<template>
  <div class="border rounded-lg p-3 shadow-sm bg-white hover:shadow-md transition">
    <div class="flex justify-between items-center">
      <!-- 左边显示老鼠信息 -->
      <div>
        <h3 class="font-semibold text-gray-800">{{ mouse.name }}</h3>
        <p class="text-sm text-gray-600">
          {{ mouse.genotype }} | {{ mouse.sex }} | {{ mouse.group }}
        </p>
      </div>

      <!-- 右边操作按钮 -->
      <div class="flex gap-2">
        <!-- 查看详情 -->
        <button
          @click="$emit('view', mouse)"
          class="text-blue-500 hover:text-blue-700"
          title="详情"
        >
          🔍
        </button>
        <!-- 移动 -->
        <button
          @click="$emit('move', mouse)"
          class="text-yellow-500 hover:text-yellow-700"
          title="移动"
        >
          ✈️
        </button>
        <!-- 删除 -->
        <button
          @click="$emit('delete', mouse.id)"
          class="text-red-500 hover:text-red-700"
          title="删除"
        >
          ❌
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  mouse: { type: Object, required: true }
})
defineEmits(["view", "move", "delete"])
</script>
