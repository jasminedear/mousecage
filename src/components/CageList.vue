<template>
  <div class="space-y-6">
    <div
      v-for="row in groupedCages"
      :key="row.name"
      class="bg-white rounded-2xl shadow-lg p-4"
    >
      <h2 class="text-xl font-semibold text-indigo-600 mb-4">
        第{{ row.name }}排笼子 ({{ row.total }} 只)
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CageCard v-for="cage in row.cages" :key="cage.id" :cage="cage" />
      </div>
    </div>
  </div>
</template>

<script setup>
import CageCard from "./CageCard.vue";

const cages = [
  { id: 1, name: "A-1", mice: [{ id: 1, name: "M1", gender: "Male" }, { id: 2, name: "F1", gender: "Female", isPregnant: true }] },
  { id: 2, name: "A-2", mice: [] },
  { id: 3, name: "A-3", mice: [{ id: 3, name: "M2", gender: "Male" }, { id: 4, name: "F2", gender: "Female" }] }
];

const groupedCages = [
  {
    name: "A",
    cages: cages.filter(c => c.name.startsWith("A")),
    total: cages.filter(c => c.name.startsWith("A")).reduce((sum, c) => sum + c.mice.length, 0),
  }
];
</script>
