<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-[1000px] max-h-[90vh] overflow-y-auto p-6 relative grid grid-cols-2 gap-6">
      
      <!-- 左边 繁育管理 -->
      <div>
        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="emit('close')">✕</button>
        <h2 class="text-2xl font-bold mb-6">🍼 繁育管理</h2>

        <div v-for="cage in miceStore.cages" :key="cage.id" class="mb-6 border rounded p-4">
          <h3 class="text-lg font-semibold mb-2">{{ cage.name }}</h3>

          <div v-for="pair in getBreedingPairs(cage.id)" :key="pair.key" class="mb-4 border p-2 rounded bg-gray-50">
            <div class="mb-2">
              配偶对：<b>{{ pair.male.name }}</b> (♂) × <b>{{ pair.female.name }}</b> (♀)
            </div>

            <!-- 配种 -->
            <div class="mb-2">
              <label class="block text-sm">配种日期</label>
              <input type="date" v-model="miceStore.breeding[pair.key].matingDate" class="border px-2 py-1 rounded w-full mb-1"/>
              <button class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      @click="confirmStep(pair, 'mating')">✅ 确认配种</button>
            </div>

            <!-- 分笼 -->
            <div class="mb-2">
              <label class="block text-sm">分笼日期</label>
              <input type="date" v-model="miceStore.breeding[pair.key].separationDate" class="border px-2 py-1 rounded w-full mb-1"/>
              <button class="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                      @click="confirmStep(pair, 'separation')">✅ 确认分笼</button>
            </div>

            <!-- 生产 -->
            <div class="mb-2">
              <label class="block text-sm">生产日期</label>
              <input type="date" v-model="miceStore.breeding[pair.key].birthDate" class="border px-2 py-1 rounded w-full mb-1"/>
              <button class="px-2 py-1 bg-pink-500 text-white rounded hover:bg-pink-600"
                      @click="confirmStep(pair, 'birth')">✅ 确认生产</button>
            </div>

            <p class="text-sm text-gray-600">
              预产期：
              <span class="font-semibold text-red-500">
                {{ calcDueDate(miceStore.breeding[pair.key].matingDate) }}
              </span>
            </p>

            <div v-if="isOverdue(pair.key)" class="mt-2 flex items-center gap-2">
              <input
                type="number"
                v-model.number="newPupCount[pair.key]"
                min="1"
                class="border px-2 py-1 rounded w-24"
                placeholder="数量"
              />
              <button class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      @click="addOffspring(pair)">
                🐭 生成新生小鼠
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右边 日志 -->
      <div class="border rounded p-4 bg-gray-50">
        <h3 class="text-lg font-bold mb-2">📜 操作日志</h3>
        <ul class="space-y-2 max-h-[70vh] overflow-y-auto text-sm">
          <li v-for="r in miceStore.records.slice().reverse()" :key="r.id" class="border-b pb-1">
            <span class="text-gray-600">{{ r.time }}</span><br/>
            <span class="font-medium">{{ r.action }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue"
import { useMiceStore } from "@/stores/mice"

const emit = defineEmits(["close"])
const miceStore = useMiceStore()
const displaySex = s => s === 'male' ? '♂' : s === 'female' ? '♀' : (s || '')

// 存储输入的新生小鼠数量
const newPupCount = reactive({})

// 找所有可能的配偶组合（支持多妻多夫）
function getBreedingPairs(cageId) {
  const cageMice = miceStore.normalizedMice.filter(m => m.cageId === cageId)
  const today = new Date()
  const adults = cageMice.filter(m => {
    if (!m.birthDate) return false
    const ageMonths = (today - new Date(m.birthDate)) / (1000 * 60 * 60 * 24 * 30)
    return ageMonths >= 2
  })
  const males = adults.filter(m => m.sex === "male" || m.sex === "♂")
  const females = adults.filter(m => m.sex === "female" || m.sex === "♀")

  const pairs = []
  males.forEach(male => {
    females.forEach(female => {
      const key = `${cageId}-${male.id}-${female.id}`
      if (!miceStore.breeding[key]) {
        miceStore.updateBreeding(key, { matingDate: "", separationDate: "", birthDate: "" })
      }
      pairs.push({ male, female, key, cageId })
    })
  })
  return pairs
}

// 确认步骤
function confirmStep(pair, step) {
  const data = miceStore.breeding[pair.key]
  const cageName = miceStore.getCageName(pair.cageId)

  if (step === "mating" && data.matingDate) {
    miceStore.addRecord(`确认配种: 笼 ${cageName} (${pair.male.name}♂ × ${pair.female.name}♀), 日期:${data.matingDate}`)
  }
  if (step === "separation" && data.separationDate) {
    miceStore.addRecord(`确认分笼: 笼 ${cageName}, 日期:${data.separationDate}`)
  }
  if (step === "birth" && data.birthDate) {
    miceStore.addRecord(`确认生产: 笼 ${cageName}, 日期:${data.birthDate}`)
  }
}

// 计算预产期
function calcDueDate(matingDate) {
  if (!matingDate) return "N/A"
  const d = new Date(matingDate)
  d.setDate(d.getDate() + 21)
  return d.toISOString().split("T")[0]
}

// 是否超过预产期
function isOverdue(pairKey) {
  const matingDate = miceStore.breeding[pairKey]?.matingDate
  if (!matingDate) return false
  const due = new Date(matingDate)
  due.setDate(due.getDate() + 21)
  return new Date() >= due
}

// 生成新生小鼠
function addOffspring(pair) {
  const data = miceStore.breeding[pair.key]
  const birthDate = data.birthDate || new Date().toISOString().split("T")[0]
  const cageId = pair.female.cageId
  const fatherId = pair.male.id
  const motherId = pair.female.id

  const count = newPupCount[pair.key] || 1
  const pups = []
  for (let i = 1; i <= count; i++) {
    const pup = {
      name: `${pair.female.name}-P${i}`,
      cageId,
      sex: i % 2 === 0 ? "male" : "female",
      genotype: "未知",
      birthDate,
      group: "未分组",
      notes: "新生幼鼠",
      statuses: ["幼鼠"],
      fatherId,
      motherId
    }
    miceStore.addMouse(pup)
    pups.push(pup)
  }

  // === 更新父母信息 ===
  const father = miceStore.mice.find(m => m.id === fatherId)
  const mother = miceStore.mice.find(m => m.id === motherId)

  if (father) {
    father.childrenIds = father.childrenIds || []
    pups.forEach(p => father.childrenIds.push(p.id))
    father.spouseIds = father.spouseIds || []
    if (!father.spouseIds.includes(motherId)) father.spouseIds.push(motherId)
  }

  if (mother) {
    mother.childrenIds = mother.childrenIds || []
    pups.forEach(p => mother.childrenIds.push(p.id))
    mother.spouseIds = mother.spouseIds || []
    if (!mother.spouseIds.includes(fatherId)) mother.spouseIds.push(fatherId)
  }

  miceStore.addRecord(
    `生成新生小鼠: 笼 ${miceStore.getCageName(cageId)}, 父:${pair.male.name}, 母:${pair.female.name}, 数量 ${pups.length}, 生日 ${birthDate}`
  )
  alert(`✅ 已生成 ${pups.length} 只新生小鼠！`)
  newPupCount[pair.key] = null
}
</script>
