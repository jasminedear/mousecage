import { defineStore } from "pinia"

export const useMiceStore = defineStore("mice", {
  state: () => ({
    cages: [],       // 笼子
    mice: [],        // 老鼠
    records: [],     // 操作日志
    breeding: {}     // 保存所有配对的繁育信息
  }),

  actions: {
    // 更新繁育信息
    updateBreeding(pairKey, data) {
      if (!this.breeding[pairKey]) {
        this.breeding[pairKey] = {}
      }
      this.breeding[pairKey] = { ...this.breeding[pairKey], ...data }
    },

    // 添加笼位：自动推算所属排（如 A-01 → A）
    addCage(cage) {
      const row = cage.name.split("-")[0] // 笼位名前缀
      const newCage = {
        id: Date.now(),
        name: cage.name,
        row
      }
      this.cages.push(newCage)
      this.addRecord(`添加笼位 ${cage.name} (所属 ${row}排)`)
      console.log("当前 cages:", this.cages)
    },

    // 添加老鼠
    addMouse(mouse) {
      const newMouse = {
        id: Date.now(),
        ...mouse
      }
      this.mice.push(newMouse)
      this.addRecord(`添加老鼠 ${mouse.name || "未命名"} 到笼位 ${this.getCageName(mouse.cageId)}`)
    },

    // 重命名一排
    renameRow(oldName, newName) {
      this.cages.forEach((cage) => {
        if (cage.row === oldName) {
          cage.row = newName
        }
      })
      this.addRecord(`修改排名 ${oldName} → ${newName}`)
    },

    // 删除一整排
    deleteRow(rowName) {
      const cagesToDelete = this.cages.filter((c) => c.row === rowName).map((c) => c.id)
      this.cages = this.cages.filter((cage) => cage.row !== rowName)
      this.mice = this.mice.filter((mouse) => !cagesToDelete.includes(mouse.cageId))
      this.addRecord(`删除 ${rowName} 排及其笼位和老鼠`)
    },

    // 删除单个笼子
    deleteCage(cageId) {
      const cage = this.cages.find(c => c.id === cageId)
      this.cages = this.cages.filter((c) => c.id !== cageId)
      this.mice = this.mice.filter((m) => m.cageId !== cageId)
      this.addRecord(`删除笼位 ${cage?.name || cageId}`)
    },

    // 获取笼子名字（避免日志里显示一串数字）
    getCageName(cageId) {
      const cage = this.cages.find(c => c.id === cageId)
      return cage ? cage.name : cageId
    },

    // 添加日志
    addRecord(action) {
      this.records.push({
        id: Date.now(),
        action,
        time: new Date().toLocaleString()
      })
    }
  }
})
