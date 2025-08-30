// src/store/mice.js
import { defineStore } from 'pinia'

export const useMiceStore = defineStore('mice', {
  state: () => ({
    mice: [],      // 老鼠列表
    cages: [],     // 笼位列表
    records: []    // 操作记录（移动、繁育等）
  }),

  getters: {
    // 按笼位获取老鼠
    getMiceByCage: (state) => {
      return (cageId) => state.mice.filter(mouse => mouse.cageId === cageId)
    },
    // 搜索老鼠
    searchMice: (state) => {
      return (keyword) =>
        state.mice.filter(m =>
          m.name.includes(keyword) || (m.genotype && m.genotype.includes(keyword))
        )
    }
  },

  actions: {
    // 添加笼位
    addCage(cage) {
      this.cages.push({
        id: Date.now(),
        name: cage.name || `Cage-${this.cages.length + 1}`,
        ...cage
      })
    },

    // 添加老鼠
    addMouse(mouse) {
      const newMouse = {
        id: Date.now(),
        name: mouse.name || `Mouse-${this.mice.length + 1}`,
        cageId: mouse.cageId || null,
        genotype: mouse.genotype || 'C57',
        sex: mouse.sex || '未知',
        birthDate: mouse.birthDate || null,
        mateId: null,   // 配偶
        children: [],   // 子女
        notes: '',
        status: 'normal', // 状态：normal/breeding/sick/dead
        ...mouse
      }
      this.mice.push(newMouse)
      this.addRecord(`添加老鼠 ${newMouse.name}`)
    },

    // 移动老鼠
    moveMouse(mouseId, newCageId) {
      const mouse = this.mice.find(m => m.id === mouseId)
      if (mouse) {
        const oldCage = mouse.cageId
        mouse.cageId = newCageId
        this.addRecord(`老鼠 ${mouse.name} 从笼位 ${oldCage} 移动到 ${newCageId}`)
      }
    },

    // 更新老鼠信息
    updateMouse(mouseId, updates) {
      const mouse = this.mice.find(m => m.id === mouseId)
      if (mouse) {
        Object.assign(mouse, updates)
        this.addRecord(`更新老鼠 ${mouse.name} 信息`)
      }
    },

    // 繁育（生成子代）
    breed(parent1Id, parent2Id, childInfo) {
      const parent1 = this.mice.find(m => m.id === parent1Id)
      const parent2 = this.mice.find(m => m.id === parent2Id)
      if (!parent1 || !parent2) return

      const newMouse = {
        id: Date.now(),
        name: childInfo?.name || `Offspring-${this.mice.length + 1}`,
        cageId: childInfo?.cageId || parent1.cageId,
        genotype: childInfo?.genotype || parent1.genotype,
        sex: childInfo?.sex || '未知',
        birthDate: childInfo?.birthDate || new Date().toISOString().split('T')[0],
        mateId: null,
        children: [],
        notes: '',
        status: 'normal',
        parents: [parent1Id, parent2Id]
      }
      this.mice.push(newMouse)

      // 绑定父母与子女关系
      parent1.children.push(newMouse.id)
      parent2.children.push(newMouse.id)

      this.addRecord(`老鼠 ${parent1.name} 与 ${parent2.name} 繁育，生成 ${newMouse.name}`)
    },

    // 删除老鼠
    removeMouse(mouseId) {
      this.mice = this.mice.filter(m => m.id !== mouseId)
      this.addRecord(`删除老鼠 ID: ${mouseId}`)
    },

    // 添加操作记录
    addRecord(action) {
      this.records.push({
        id: Date.now(),
        action,
        time: new Date().toLocaleString()
      })
    }
  }
})
