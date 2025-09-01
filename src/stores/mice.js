import { defineStore } from "pinia";
import { generateShortId } from "@/utils/idGenerator";
import { saveToCloud, loadFromCloud } from "@/utils/leancloud";

export const useMiceStore = defineStore("mice", {
  state: () => ({
    cages: [],
    mice: [],
    deadMice: [],
    records: [],
    breeding: {},
  }),

  getters: {
    normalizedMice: (state) => {
      return state.mice.map((mouse) => {
        const m = { ...mouse };
        if (m.sex === "♂") m.sex = "male";
        else if (m.sex === "♀") m.sex = "female";
        else if (m.sex !== "male" && m.sex !== "female") m.sex = "normal";
        return m;
      });
    },

    allGenotypes: (state) => {
      const genotypes = state.mice.map((m) => m.genotype).filter((g) => g != null);
      return [...new Set(genotypes)];
    },

    isBreedingPair: (state) => (cageId) => {
      const miceInCage = state.mice.filter((m) => m.cageId === cageId);
      const adults = miceInCage.filter(
        (m) => !(Array.isArray(m.statuses) && m.statuses.includes("幼鼠"))
      );
      const hasMale = adults.some((m) => m.sex === "male" || m.sex === "♂");
      const hasFemale = adults.some((m) => m.sex === "female" || m.sex === "♀");
      return hasMale && hasFemale;
    },
  },

  actions: {
    async saveToCloud(userId, options = {}) {
      if (!userId) {
        console.warn('保存失败: 未登录用户');
        return false;
      }
      const silent = options.silent === true;
      const data = {
        cages: this.cages,
        mice: this.mice,
        deadMice: this.deadMice,
        records: this.records,
        breeding: this.breeding,
      };
      const success = await saveToCloud(data, userId);
      if (!silent) this.addRecord(success ? "💾 数据已成功同步到云端" : "❌ 云端同步失败");
      console.log("从云端加载的原始数据:", JSON.parse(JSON.stringify(data)));
      return success;
    },

    async loadFromCloud(userId) {
      if (!userId) {
        console.warn('加载失败: 未登录用户');
        return false;
      }

      const data = await loadFromCloud(userId);
      if (!data) {
        this.addRecord("❌ 云端加载失败");
        return false;
      }

      this.cages = data.cages || [];
      this.mice = (data.mice || []).map((m) => {
        const sexNorm = m.sex === "♂" ? "male" : m.sex === "♀" ? "female" : m.sex;
        return {
          ...m,
          sex: sexNorm,
          spouseIds: Array.isArray(m.spouseIds) ? m.spouseIds : [],
          childrenIds: Array.isArray(m.childrenIds) ? m.childrenIds : [],
          fatherId: m.fatherId ?? null,
          motherId: m.motherId ?? null,
          statuses: Array.isArray(m.statuses) ? m.statuses : [],
        };
      });

      this.records = data.records || [];
      // ⚡ 兼容性修复：如果 breeding 记录不是数组，则转换为数组
      this.breeding = data.breeding || {};
      for (const key in this.breeding) {
        if (this.breeding.hasOwnProperty(key) && !Array.isArray(this.breeding[key])) {
          this.breeding[key] = [this.breeding[key]];
        }
      }

      this.deadMice = (data.deadMice || []).map((m) => ({
        ...m,
        spouseIds: Array.isArray(m.spouseIds) ? m.spouseIds : [],
        childrenIds: Array.isArray(m.childrenIds) ? m.childrenIds : [],
        fatherId: m.fatherId ?? null,
        motherId: m.motherId ?? null,
        statuses: Array.isArray(m.statuses) ? m.statuses : [],
      }));

      this.addRecord("📂 已从云端加载数据");
      return true;
    },

    addCage(cage) {
      const row = String(cage.name || "").split("-")[0] || "未分组";
      const newCage = {
        id: generateShortId(),
        name: cage.name,
        row,
      };
      this.cages.push(newCage);
      this.addRecord(`添加笼位 ${cage.name} (所属 ${row}排)`);
    },

    deleteCage(cageId) {
      const cage = this.cages.find((c) => c.id === cageId);
      this.cages = this.cages.filter((c) => c.id !== cageId);
      this.mice = this.mice.filter((m) => m.cageId !== cageId);
      this.addRecord(`删除笼位 ${cage?.name || cageId}`);
    },

    renameRow(oldName, newName) {
      this.cages.forEach((c) => {
        if (c.row === oldName) c.row = newName;
      });
      this.addRecord(`修改排名 ${oldName} → ${newName}`);
    },

    deleteRow(rowName) {
      const cagesToDelete = this.cages.filter((c) => c.row === rowName).map((c) => c.id);
      this.cages = this.cages.filter((c) => c.row !== rowName);
      this.mice = this.mice.filter((m) => !cagesToDelete.includes(m.cageId));
      this.addRecord(`删除 ${rowName} 排及其笼位和老鼠`);
    },

    getCageName(cageId) {
      const cage = this.cages.find((c) => c.id === cageId);
      return cage ? cage.name : cageId;
    },

    addMouse(mouse) {
      const newMouse = {
        id: mouse?.id ?? generateShortId(),
        state: mouse?.state ?? "normal",
        ...mouse,
        spouseIds: Array.isArray(mouse?.spouseIds) ? mouse.spouseIds : [],
        childrenIds: Array.isArray(mouse?.childrenIds) ? mouse.childrenIds : [],
        fatherId: mouse?.fatherId ?? null,
        motherId: mouse?.motherId ?? null,
        statuses: Array.isArray(mouse?.statuses) ? mouse.statuses : [],
      };
      if (newMouse.sex === "♂" || newMouse.sex === "male") newMouse.sex = "male";
      else if (newMouse.sex === "♀" || newMouse.sex === "female") newMouse.sex = "female";

      this.mice.push(newMouse);
      this.addRecord(
        `添加老鼠 ${newMouse.name || "未命名"} 到笼位 ${this.getCageName(newMouse.cageId)}`
      );
      this.autoLinkSpousesInCage(newMouse.cageId);
      return newMouse.id;
    },

    deleteMouse(mouseId) {
      const idx = this.mice.findIndex((m) => m.id === mouseId);
      if (idx !== -1) {
        const m = this.mice[idx];
        this.mice.splice(idx, 1);
        this.addRecord(`🗑️ 删除老鼠：${m.name || "未命名"}`);
      }
    },

    updateMouse(mouseId, updatedFields) {
      const mouse = this.mice.find((m) => m.id === mouseId);
      if (!mouse) return;
      const prevCage = mouse.cageId;
      Object.assign(mouse, updatedFields);
      if (mouse.sex === "♂") mouse.sex = "male";
      if (mouse.sex === "♀") mouse.sex = "female";
      if (updatedFields.cageId && updatedFields.cageId !== prevCage) {
        this.autoLinkSpousesInCage(updatedFields.cageId);
      }
      this.addRecord(`更新老鼠 ${mouse.name || mouseId} 的信息`);
    },

    recordDeath(mouseId, cause) {
      const i = this.mice.findIndex((m) => m.id === mouseId);
      if (i === -1) return;
      const original = this.mice[i];
      if (!original.id) original.id = generateShortId();
      const deadCopy = {
        ...original,
        deathDate: new Date().toLocaleString(),
        causeOfDeath: cause,
      };
      this.mice.splice(i, 1);
      this.deadMice.push(deadCopy);
      this.addRecord(
        `💀 老鼠 ${original.name || "未命名"} 已死亡（原因：${cause || "未填写"}）`
      );
    },

    deleteDeadMouse(mouseId) {
      const id = String(mouseId);
      const before = this.deadMice.length;
      const toDel = this.deadMice.find((m) => String(m.id) === id);
      this.deadMice = this.deadMice.filter((m) => String(m.id) !== id);
      const removed = this.deadMice.length !== before;
      if (removed && toDel) {
        this.addRecord(
          `🧹 删除死亡记录：${toDel.name || "未命名"}（原因：${toDel.causeOfDeath || "未填写"}）`
        );
      }
      return removed;
    },

    clearAllDeadMice() {
      if (!this.deadMice.length) return false;
      this.deadMice = [];
      this.addRecord("🧹 已清空全部死亡记录");
      return true;
    },

    autoLinkSpousesInCage(cageId) {
      if (!cageId) return;
      const inCage = this.mice.filter((m) => m.cageId === cageId);
      const adults = inCage.filter(
        (m) => !(Array.isArray(m.statuses) && m.statuses.includes("幼鼠"))
      );
      const males = adults.filter((m) => m.sex === "male" || m.sex === "♂");
      const females = adults.filter((m) => m.sex === "female" || m.sex === "♀");
      males.forEach((m) => {
        females.forEach((f) => {
          this.linkSpouses(m.id, f.id);
        });
      });
      if (males.length && females.length) {
        this.addRecord(`⚭ 自动配对：${this.getCageName(cageId)}（同笼成年异性）`);
      }
    },
    
    // ⚡ 兼容性修复：在更新前检查并转换数据格式
    updateBreeding(key, data) {
      if (!this.breeding[key]) {
        this.breeding[key] = [];
      } else if (!Array.isArray(this.breeding[key])) {
        // 兼容旧格式，将其转换为数组
        this.breeding[key] = [this.breeding[key]];
      }

      const latestRecord = this.breeding[key][this.breeding[key].length - 1];
      if (!latestRecord || latestRecord.status === 'completed') {
        this.breeding[key].push(data);
      } else {
        Object.assign(latestRecord, data);
      }
    },

    linkSpouses(aId, bId) {
      const a = this.mice.find((m) => m.id === aId);
      const b = this.mice.find((m) => m.id === bId);
      if (!a || !b) return false;
      a.spouseIds = Array.isArray(a.spouseIds) ? a.spouseIds : [];
      b.spouseIds = Array.isArray(b.spouseIds) ? b.spouseIds : [];
      if (!a.spouseIds.includes(bId)) a.spouseIds.push(bId);
      if (!b.spouseIds.includes(aId)) b.spouseIds.push(aId);
      this.addRecord(`建立配对：${a.name || aId} × ${b.name || bId}`);
      return true;
    },

    addChild(childId, fatherId, motherId) {
      const child = this.mice.find((m) => m.id === childId);
      const fa = this.mice.find((m) => m.id === fatherId);
      const mo = this.mice.find((m) => m.id === motherId);
      if (!child) return false;
      child.fatherId = fatherId ?? child.fatherId ?? null;
      child.motherId = motherId ?? child.motherId ?? null;
      if (fa) {
        fa.childrenIds = Array.isArray(fa.childrenIds) ? fa.childrenIds : [];
        if (!fa.childrenIds.includes(childId)) fa.childrenIds.push(childId);
      }
      if (mo) {
        mo.childrenIds = Array.isArray(mo.childrenIds) ? mo.childrenIds : [];
        if (!mo.childrenIds.includes(childId)) mo.childrenIds.push(childId);
      }
      this.addRecord(
        `登记子代：${child.name || childId} ← ${fa?.name || fatherId || "未知"}/${mo?.name || motherId || "未知"}`
      );
      return true;
    },

    addRecord(action) {
      this.records.push({
        id: generateShortId(),
        action,
        time: new Date().toLocaleString(),
      });
    },

    resetState() {
      this.cages = [];
      this.mice = [];
      this.deadMice = [];
      this.records = {}; // ⚡ 注意：重置时也保持新格式
      this.breeding = {};
    }
  },
});