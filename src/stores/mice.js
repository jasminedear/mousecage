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
    // === 云端存储 ===
    async saveToCloud(options = {}) {
      const silent = options.silent === true;
      const data = {
        cages: this.cages,
        mice: this.mice,
        deadMice: this.deadMice,
        records: this.records,
        breeding: this.breeding,
      };
      console.log("[MiceStore] Saving data to LeanCloud…");
      const success = await saveToCloud(data);
      if (!silent) {
        this.addRecord(success ? "💾 数据已成功同步到云端" : "❌ 云端同步失败");
      }
      return success;
    },

    async loadFromCloud() {
      console.log("[MiceStore] Loading data from LeanCloud…");
      const data = await loadFromCloud();
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
      this.breeding = data.breeding || {};
      for (const key in this.breeding) {
        if (Object.prototype.hasOwnProperty.call(this.breeding, key) && !Array.isArray(this.breeding[key])) {
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

      this.addRecord("📂 数据已从云端加载");
      return true;
    },

    // === 笼子操作 ===
    addCage(cage) {
      const row = String(cage.name || "").split("-")[0] || "Unassigned";
      const newCage = {
        id: generateShortId(),
        name: cage.name,
        row,
      };
      this.cages.push(newCage);
      this.addRecord(`Added cage ${cage.name} (Row ${row})`);
    },

    deleteCage(cageId) {
      const cage = this.cages.find((c) => c.id === cageId);
      this.cages = this.cages.filter((c) => c.id !== cageId);
      this.mice = this.mice.filter((m) => m.cageId !== cageId);
      this.addRecord(`Deleted cage ${cage?.name || cageId}`);
    },

    renameRow(oldName, newName) {
      this.cages.forEach((c) => {
        if (c.row === oldName) c.row = newName;
      });
      this.addRecord(`Renamed row ${oldName} → ${newName}`);
    },

    deleteRow(rowName) {
      const cagesToDelete = this.cages.filter((c) => c.row === rowName).map((c) => c.id);
      this.cages = this.cages.filter((c) => c.row !== rowName);
      this.mice = this.mice.filter((m) => !cagesToDelete.includes(m.cageId));
      this.addRecord(`Deleted row ${rowName} and its cages/mice`);
    },

    getCageName(cageId) {
      const cage = this.cages.find((c) => c.id === cageId);
      return cage ? cage.name : cageId;
    },

    // === 老鼠操作 ===
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
        `Added mouse ${newMouse.name || "Unnamed"} to cage ${this.getCageName(newMouse.cageId)}`
      );
      this.autoLinkSpousesInCage(newMouse.cageId);
      return newMouse.id;
    },

    deleteMouse(mouseId) {
      const idx = this.mice.findIndex((m) => m.id === mouseId);
      if (idx !== -1) {
        const m = this.mice[idx];
        this.mice.splice(idx, 1);
        this.addRecord(`🗑️ Deleted mouse: ${m.name || "Unnamed"}`);
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
      this.addRecord(`Updated mouse ${mouse.name || mouseId}'s info`);
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
        `💀 Mouse ${original.name || "Unnamed"} has died (Reason: ${cause || "Unspecified"})`
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
          `🧹 Deleted dead mouse record: ${toDel.name || "Unnamed"} (Reason: ${toDel.causeOfDeath || "Unspecified"})`
        );
      }
      return removed;
    },

    clearAllDeadMice() {
      if (!this.deadMice.length) return false;
      this.deadMice = [];
      this.addRecord("🧹 All dead mouse records have been cleared");
      return true;
    },

    // === 繁育关联 ===
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
        this.addRecord(`⚭ Auto-pairing in cage ${this.getCageName(cageId)} (same-cage adult mice)`);
      }
    },

    updateBreeding(key, data) {
      if (!this.breeding[key]) {
        this.breeding[key] = [];
      } else if (!Array.isArray(this.breeding[key])) {
        this.breeding[key] = [this.breeding[key]];
      }

      const latestRecord = this.breeding[key][this.breeding[key].length - 1];
      if (!latestRecord || latestRecord.status === "completed") {
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
      this.addRecord(`Spouses linked: ${a.name || aId} × ${b.name || bId}`);
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
        `Child registered: ${child.name || childId} ← ${fa?.name || fatherId || "Unknown"}/${mo?.name || motherId || "Unknown"}`
      );
      return true;
    },

    // === 公共工具 ===
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
      this.records = [];   // ⚡ 修复：原来是 {}
      this.breeding = {};
    },
  },
});
