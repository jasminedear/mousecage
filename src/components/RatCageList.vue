<script setup>
import { cages } from '../data/cages.js';
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-6 font-sans">
    <h2 class="text-3xl font-bold text-gray-800 text-center mb-8">鼠笼列表</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div 
        v-for="cage in cages" 
        :key="cage.id" 
        class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-200 hover:scale-105"
      >
        <div class="p-4 text-white font-semibold text-lg" 
          :class="{
            'bg-green-500': cage.status === '健康',
            'bg-red-500': cage.status === '生病',
            'bg-yellow-500': cage.status === '维护中'
          }"
        >
          <h3>{{ cage.name }}</h3>
        </div>
        <div class="p-5 text-gray-700">
          <p class="mb-2"><span class="font-bold">状态:</span> {{ cage.status }}</p>
          <p class="mb-2"><span class="font-bold">老鼠数量:</span> {{ cage.ratCount }}</p>
          <p class="text-sm text-gray-500 mt-4">上次维护: {{ cage.lastMaintenance }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 使用 Tailwind 后，我们不需要在这里写任何样式了 */
</style>