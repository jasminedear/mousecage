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
    // === 笼子操作 ===
    moveCageMice(fromCageId, toCageId) {
      if (!fromCageId || !toCageId || fromCageId === toCageId) return false;
      const moved = this.mice.filter(m => m.cageId === fromCageId);
      moved.forEach(m => { m.cageId = toCageId });
      this.addRecord(`📦 ${moved.length} 只老鼠从 ${this.getCageName(fromCageId)} → ${this.getCageName(toCageId)}`);
      return moved.length;
    },

    renameCage(cageId, newName) {
      const cage = this.cages.find(c => c.id === cageId);
      if (!cage) return false;
      const oldName = cage.name;
      cage.name = newName;
      this.addRecord(`✏️ 笼子重命名: ${oldName} → ${newName}`);
      return true;
    },

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

    // === 新增/修改：解除配偶（双向） ===
    unlinkSpouses(aId, bId) {
      const a = this.mice.find(m => m.id === aId);
      const b = this.mice.find(m => m.id === bId);
      if (!a || !b) return false;
      a.spouseIds = Array.isArray(a.spouseIds) ? a.spouseIds : [];
      b.spouseIds = Array.isArray(b.spouseIds) ? b.spouseIds : [];
      a.spouseIds = a.spouseIds.filter(id => id !== bId);
      b.spouseIds = b.spouseIds.filter(id => id !== aId);
      this.addRecord(`Unlink spouses: ${a.name || aId} × ${b.name || bId}`);
      return true;
    },

    // === 新增/修改：从“父/母 → 子”删除一条亲子关系（双向） ===
    removeChildFromParent(parentId, childId) {
      const parent = this.mice.find(m => m.id === parentId);
      const child  = this.mice.find(m => m.id === childId);
      if (!parent || !child) return false;

      parent.childrenIds = Array.isArray(parent.childrenIds) ? parent.childrenIds : [];
      parent.childrenIds = parent.childrenIds.filter(id => id !== childId);

      if (child.fatherId === parentId) child.fatherId = null;
      if (child.motherId === parentId) child.motherId = null;

      this.addRecord(`Remove child link: ${parent.name || parentId} –/→ ${child.name || childId}`);
      return true;
    },

    // === 新增/修改：统一删除入口，给组件调用更简单 ===
    removeRelationship(sourceId, targetId, type) {
      if (type === 'spouse') {
        return this.unlinkSpouses(sourceId, targetId);
      } else if (type === 'child') {
        return this.removeChildFromParent(sourceId, targetId);
      }
      return false;
    },

    // === 星标功能 ===
    toggleStar(mouseId) {
      const m = this.mice.find(x => x.id === mouseId);
      if (!m) return;
      m.starred = !m.starred;
      this.addRecord(`${m.starred ? "⭐ 标记" : "☆ 取消标记"}: ${m.name || mouseId}`);
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
      this.records = [];
      this.breeding = {};
    },

    /* ====================== 🔧 新增：数据清洗/替换 工具 ====================== */

    // 修剪坏关系指针
    pruneBrokenRelations() {
      const idSet = new Set(this.mice.map(m => m.id));
      this.mice.forEach(m => {
        m.spouseIds = Array.isArray(m.spouseIds) ? m.spouseIds.filter(id => idSet.has(id)) : [];
        m.childrenIds = Array.isArray(m.childrenIds) ? m.childrenIds.filter(id => idSet.has(id)) : [];
        if (m.fatherId && !idSet.has(m.fatherId)) m.fatherId = null;
        if (m.motherId && !idSet.has(m.motherId)) m.motherId = null;
        m.statuses = Array.isArray(m.statuses) ? m.statuses : [];
      });
      this.addRecord("🔧 关系修剪完成");
    },

    // 去重并合并信息
    dedupeMice({ prefer = "id" } = {}) {
      const key2 = (m) => `${m.name || ""}|${m.birthDate || ""}|${m.sex || ""}`.toLowerCase();
      const result = [];
      const seenById = new Map();
      const seenByKey2 = new Map();

      const pick = (x, y) => (x == null || x === "" ? y : x);
      const arrMerge = (A = [], B = []) => Array.from(new Set([...(A||[]), ...(B||[])]));

      const merge = (a, b) => ({
        ...a,
        name: pick(a.name, b.name),
        genotype: pick(a.genotype, b.genotype),
        birthDate: pick(a.birthDate, b.birthDate),
        group: pick(a.group, b.group),
        notes: [a.notes, b.notes].filter(Boolean).join(" | "),
        statuses: arrMerge(a.statuses, b.statuses),
        spouseIds: arrMerge(a.spouseIds, b.spouseIds),
        childrenIds: arrMerge(a.childrenIds, b.childrenIds),
        fatherId: pick(a.fatherId, b.fatherId),
        motherId: pick(a.motherId, b.motherId),
        cageId: pick(a.cageId, b.cageId),
        starred: a.starred || b.starred || false,
      });

      const pushOrMerge = (m) => {
        m.spouseIds = Array.isArray(m.spouseIds) ? m.spouseIds : [];
        m.childrenIds = Array.isArray(m.childrenIds) ? m.childrenIds : [];
        m.statuses = Array.isArray(m.statuses) ? m.statuses : [];
        const id = m.id;
        const k2 = key2(m);

        if (prefer === "id" && id) {
          if (!seenById.has(id)) {
            seenById.set(id, m);
            result.push(m);
          } else {
            const idx = result.findIndex(x => x.id === id);
            result[idx] = merge(result[idx], m);
          }
        } else {
          if (!seenByKey2.has(k2)) {
            seenByKey2.set(k2, m);
            result.push(m);
          } else {
            const idx = result.findIndex(x => key2(x) === k2);
            result[idx] = merge(result[idx], m);
          }
        }
      };

      (this.mice || []).forEach(pushOrMerge);
      this.mice = result;

      this.pruneBrokenRelations();
      this.addRecord(`🧹 去重完成：现有 ${this.mice.length} 条`);
      return this.mice.length;
    },

    // 将未分笼的老鼠安置到某个笼位
    assignUncagedTo(cageId) {
      if (!cageId) return 0;
      let count = 0;
      this.mice.forEach(m => {
        if (!m.cageId) { m.cageId = cageId; count++; }
      });
      if (count) this.addRecord(`📦 已安置 ${count} 只未分笼老鼠到 ${this.getCageName(cageId)}`);
      return count;
    },

    // 替换式导入：清空现有数据，再导入 payload
    replaceWithImport(payload) {
      const clone = (x) => JSON.parse(JSON.stringify(x ?? null));

      // 清空
      this.cages = [];
      this.mice = [];
      this.deadMice = [];
      this.records = [];
      this.breeding = {};

      // 导入
      const p = payload || {};
      this.cages = Array.isArray(p.cages) ? clone(p.cages) : [];
      this.mice = Array.isArray(p.mice)
        ? p.mice.map(m => ({
            ...m,
            sex: (m.sex === "♂" || m.sex === "male") ? "male" : (m.sex === "♀" || m.sex === "female") ? "female" : "normal",
            spouseIds: Array.isArray(m.spouseIds) ? m.spouseIds : [],
            childrenIds: Array.isArray(m.childrenIds) ? m.childrenIds : [],
            fatherId: m.fatherId ?? null,
            motherId: m.motherId ?? null,
            statuses: Array.isArray(m.statuses) ? m.statuses : [],
          }))
        : [];

      this.deadMice = Array.isArray(p.deadMice)
        ? p.deadMice.map(m => ({
            ...m,
            spouseIds: Array.isArray(m.spouseIds) ? m.spouseIds : [],
            childrenIds: Array.isArray(m.childrenIds) ? m.childrenIds : [],
            fatherId: m.fatherId ?? null,
            motherId: m.motherId ?? null,
            statuses: Array.isArray(m.statuses) ? m.statuses : [],
          }))
        : [];

      this.records = Array.isArray(p.records) ? clone(p.records) : [];
      this.breeding = typeof p.breeding === "object" && p.breeding ? clone(p.breeding) : {};

      // 修剪 + 去重兜底
      this.pruneBrokenRelations();
      this.dedupeMice({ prefer: "id" });

      this.addRecord("📥 已替换式导入存档");
      return true;
    },

    // 一键：仅保留“正在使用的”子集并替换当前库（为你定制：以⭐星标为准）
    extractUsedSubsetAndReplace(options = {}) {
      const {
        // 默认：只保留星标老鼠；可以把 includeStarred=false 改为 true/false 自由组合
        includeStarred = true,
        includeWithCage = false,       // 你说主要靠星标，这里默认 false；改 true 则把有笼位的也保留
        includeWithNotes = false,      // 备注不空的也保留（需要可以改 true）
        includeRelativesDepth = 1,     // 向外包含几代亲属（0=只保留自己，1=父母/子女/配偶）
        assignUncagedToName = "Unassigned",
      } = options;

      const idSet = new Set();

      // 1) 选中核心集合
      if (includeStarred) this.mice.forEach(m => { if (m.starred) idSet.add(m.id); });
      if (includeWithCage) this.mice.forEach(m => { if (m.cageId) idSet.add(m.id); });
      if (includeWithNotes) this.mice.forEach(m => { if ((m.notes || "").trim()) idSet.add(m.id); });

      // 如果一个都没选中，避免清空库
      if (!idSet.size) {
        alert("没有找到符合条件的老鼠（例如未标星）。请先给需要保留的老鼠加⭐星标。");
        return false;
      }

      // 2) 按代数扩展亲属（配偶/父母/子女）
      const stepOnce = (seedSet) => {
        const next = new Set(seedSet);
        this.mice.forEach(m => {
          if (seedSet.has(m.id)) {
            (Array.isArray(m.spouseIds) ? m.spouseIds : []).forEach(id => next.add(id));
            (Array.isArray(m.childrenIds) ? m.childrenIds : []).forEach(id => next.add(id));
            if (m.fatherId) next.add(m.fatherId);
            if (m.motherId) next.add(m.motherId);
          }
        });
        return next;
      };
      for (let i = 0; i < Math.max(0, includeRelativesDepth); i++) {
        const expanded = stepOnce(idSet);
        if (expanded.size === idSet.size) break;
        idSet.clear(); expanded.forEach(x => idSet.add(x));
      }

      // 3) 生成子集
      const subsetMice = this.mice
        .filter(m => idSet.has(m.id))
        .map(m => ({
          ...m,
          spouseIds: Array.isArray(m.spouseIds) ? m.spouseIds : [],
          childrenIds: Array.isArray(m.childrenIds) ? m.childrenIds : [],
          statuses: Array.isArray(m.statuses) ? m.statuses : [],
        }));

      const cageIdSet = new Set(subsetMice.map(m => m.cageId).filter(Boolean));
      const subsetCages = this.cages.filter(c => cageIdSet.has(c.id));

      // 4) 替换式导入这份子集
      const payload = { cages: subsetCages, mice: subsetMice, deadMice: [], records: [], breeding: {} };
      this.replaceWithImport(payload);

      // 5) 安置未分笼
      let unassigned = this.cages.find(c => c.name === assignUncagedToName);
      if (!unassigned) {
        unassigned = { id: generateShortId(), name: assignUncagedToName, row: assignUncagedToName };
        this.cages.push(unassigned);
      }
      this.assignUncagedTo(unassigned.id);

      // 6) 保存并记录
      this.saveToCloud({ silent: true });
      this.addRecord(`🧽 已抽取并替换：保留 ${this.mice.length} 只（⭐星标为核心${includeRelativesDepth ? `，含 ${includeRelativesDepth} 代亲属` : ""}）`);
      return true;
    },
  },
});
