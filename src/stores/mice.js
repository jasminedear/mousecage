import { defineStore } from "pinia";
import { generateShortId } from "@/utils/idGenerator";
import { saveToCloud, loadFromCloud } from "@/utils/leancloud";

export const useMiceStore = defineStore("mice", {
  state: () => ({
    cages: [],
    mice: [],
    deadMice: [],
    records: [],
    breeding: {}
  }),

  getters: {
    normalizedMice: (state) => {
      return state.mice.map((mouse) => {
        const normalizedMouse = { ...mouse };

        if (normalizedMouse.sex === "♂") {
          normalizedMouse.sex = "male";
        } else if (normalizedMouse.sex === "♀") {
          normalizedMouse.sex = "female";
        } else if (
          normalizedMouse.sex !== "male" &&
          normalizedMouse.sex !== "female"
        ) {
          normalizedMouse.sex = "normal";
        }

        return normalizedMouse;
      });
    },

    allGenotypes: (state) => {
      const genotypes = state.mice.map((mouse) => mouse.genotype);
      return [...new Set(genotypes)];
    }
  },

  actions: {
    // 允许静默保存：saveToCloud({ silent: true }) 时不写入操作记录（避免触发 watch 回环）
    async saveToCloud(options = {}) {
      const silent = options.silent === true;

      const data = {
        cages: this.cages,
        mice: this.mice,
        deadMice: this.deadMice,
        records: this.records,
        breeding: this.breeding
      };

      const success = await saveToCloud(data);

      if (!silent) {
        if (success) {
          this.addRecord("💾 数据已成功同步到云端");
        } else {
          this.addRecord("❌ 云端同步失败");
        }
      }

      return success;
    },

    async loadFromCloud() {
      const data = await loadFromCloud();

      if (data) {
        this.cages = data.cages || [];
        // 加载时统一性别写法，兼容旧数据
        this.mice = (data.mice || []).map((m) => {
          if (m.sex === "♂") m.sex = "male";
          if (m.sex === "♀") m.sex = "female";
          return m;
        });
        this.records = data.records || [];
        this.breeding = data.breeding || {};
        this.deadMice = data.deadMice || [];

        this.addRecord("📂 已从云端加载数据");
        return true;
      } else {
        this.addRecord("❌ 云端加载失败");
        return false;
      }
    },

    updateBreeding(pairKey, data) {
      if (!this.breeding[pairKey]) {
        this.breeding[pairKey] = {};
      }
      this.breeding[pairKey] = { ...this.breeding[pairKey], ...data };
      this.addRecord(`更新繁育配对 ${pairKey}`);
    },

    addCage(cage) {
      const row = cage.name.split("-")[0];
      const newCage = {
        id: generateShortId(),
        name: cage.name,
        row
      };
      this.cages.push(newCage);
      this.addRecord(`添加笼位 ${cage.name} (所属 ${row}排)`);
      console.log("当前 cages:", this.cages);
    },

    addMouse(mouse) {
      const newMouse = {
        id: generateShortId(),
        state: "normal",
        ...mouse
      };

      // 统一性别写法
      if (newMouse.sex === "♂" || newMouse.sex === "male") {
        newMouse.sex = "male";
      } else if (newMouse.sex === "♀" || newMouse.sex === "female") {
        newMouse.sex = "female";
      }

      this.mice.push(newMouse);
      this.addRecord(
        `添加老鼠 ${newMouse.name || "未命名"} 到笼位 ${this.getCageName(
          newMouse.cageId
        )}`
      );
    },

    // 新增：删除活体老鼠（CageGrid 有调用）
    deleteMouse(mouseId) {
      const idx = this.mice.findIndex((m) => m.id === mouseId);
      if (idx !== -1) {
        const m = this.mice[idx];
        this.mice.splice(idx, 1);
        this.addRecord(`🗑️ 删除老鼠：${m.name || "未命名"}`);
      }
    },

    // 记录死亡（稳固：确保有 id，并推入副本）
    recordDeath(mouseId, cause) {
      const mouseIndex = this.mice.findIndex((m) => m.id === mouseId);
      if (mouseIndex !== -1) {
        const original = this.mice[mouseIndex];

        // 兜底 id
        if (!original.id) original.id = generateShortId();

        const deadCopy = {
          ...original,
          deathDate: new Date().toLocaleString(),
          causeOfDeath: cause
        };

        this.mice.splice(mouseIndex, 1);   // 从活体列表移除
        this.deadMice.push(deadCopy);      // 推入死亡列表（副本）

        this.addRecord(
          `💀 老鼠 ${original.name || "未命名"} 已死亡（原因：${cause || "未填写"}）`
        );
      }
    },

    // ✅ 新增：删除“死亡记录”（单条）
    deleteDeadMouse(mouseId) {
      const id = String(mouseId);
      const before = this.deadMice.length;
      const toDel = this.deadMice.find((m) => String(m.id) === id);

      // 过滤重赋值，响应性更稳定
      this.deadMice = this.deadMice.filter((m) => String(m.id) !== id);

      const removed = this.deadMice.length !== before;

      if (removed && toDel) {
        this.addRecord(
          `🧹 删除死亡记录：${toDel.name || "未命名"}（原因：${
            toDel.causeOfDeath || "未填写"
          }）`
        );
      }
      return removed;
    },

    // ✅ 新增：清空全部“死亡记录”
    clearAllDeadMice() {
      if (!this.deadMice.length) return false;
      this.deadMice = [];
      this.addRecord("🧹 已清空全部死亡记录");
      return true;
    },

    renameRow(oldName, newName) {
      this.cages.forEach((cage) => {
        if (cage.row === oldName) {
          cage.row = newName;
        }
      });
      this.addRecord(`修改排名 ${oldName} → ${newName}`);
    },

    deleteRow(rowName) {
      const cagesToDelete = this.cages
        .filter((c) => c.row === rowName)
        .map((c) => c.id);
      this.cages = this.cages.filter((cage) => cage.row !== rowName);
      this.mice = this.mice.filter(
        (mouse) => !cagesToDelete.includes(mouse.cageId)
      );
      this.addRecord(`删除 ${rowName} 排及其笼位和老鼠`);
    },

    deleteCage(cageId) {
      const cage = this.cages.find((c) => c.id === cageId);
      this.cages = this.cages.filter((c) => c.id !== cageId);
      this.mice = this.mice.filter((m) => m.cageId !== cageId);
      this.addRecord(`删除笼位 ${cage?.name || cageId}`);
    },

    getCageName(cageId) {
      const cage = this.cages.find((c) => c.id === cageId);
      return cage ? cage.name : cageId;
    },

    addRecord(action) {
      this.records.push({
        id: generateShortId(),
        action,
        time: new Date().toLocaleString()
      });
    },

    updateMouse(mouseId, updatedFields) {
      const mouse = this.mice.find((m) => m.id === mouseId);
      if (mouse) {
        Object.assign(mouse, updatedFields);
        this.addRecord(`更新老鼠 ${mouse.name} 的信息`);
      }
    }
  }
});
