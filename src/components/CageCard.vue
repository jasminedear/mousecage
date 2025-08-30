<template>
  <div
    class="bg-indigo-50 rounded-xl p-4 shadow hover:shadow-xl transition relative"
  >
    <h3 class="text-lg font-bold text-gray-800 mb-2">
      {{ cage.name }} ({{ cage.mice.length }} 只)
    </h3>
    <div v-if="cage.mice.length > 0" class="space-y-2">
      <div
        v-for="mouse in cage.mice"
        :key="mouse.id"
        class="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
        :class="getMouseClass(mouse)"
      >
        {{ mouse.name }} {{ mouse.gender === "Male" ? "♂" : "♀" }}
        <span v-if="mouse.isPregnant"> (怀孕)</span>
      </div>
    </div>
    <div v-else class="text-gray-400 text-center py-4">
      <i class="fa-solid fa-box-open text-2xl"></i>
      <p>空闲</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  cage: Object,
});

function getMouseClass(mouse) {
  if (mouse.isPregnant) return "bg-green-100 text-green-600";
  if (mouse.gender === "Male") return "bg-blue-100 text-blue-600";
  if (mouse.gender === "Female") return "bg-pink-100 text-pink-600";
  return "bg-gray-100 text-gray-500";
}
</script>
