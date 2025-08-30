import { createRouter, createWebHistory } from "vue-router"
import CageGrid from "@/components/CageGrid.vue"
import BreedingRecords from "@/components/BreedingRecords.vue"
import TestImport from "@/components/TestImport.vue"

const routes = [
  { path: "/", component: CageGrid },
  { path: "/breeding", component: BreedingRecords },
  { path: "/test-import", component: TestImport }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
