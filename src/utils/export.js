import * as XLSX from "xlsx";

/**
 * ⚡ 将所有数据中的 ID 统一映射为用户定义的编号（name）
 * - 老鼠与笼子都参与映射
 * - childrenIds / spouseIds 等数组字段转换为对应的 name
 * @param {Array<Object>} miceList - 所有老鼠
 * @param {Array<Object>} cagesList - 所有笼子
 * @returns {{mice: Array<Object>, cages: Array<Object>}}
 */
function mapDataForExport(miceList, cagesList) {
  const idToNameMap = new Map();

  // 建立映射：老鼠 id -> name
  miceList.forEach((mouse) => {
    if (mouse && mouse.id && mouse.name) {
      idToNameMap.set(mouse.id, mouse.name);
    }
  });

  // 建立映射：笼子 id -> name
  cagesList.forEach((cage) => {
    if (cage && cage.id && cage.name) {
      idToNameMap.set(cage.id, cage.name);
    }
  });

  // 映射老鼠数据
  const mappedMice = miceList.map((mouse) => {
    const m = { ...mouse };

    // 自身 id 替换为 name（如果找得到）
    if (m.id && idToNameMap.has(m.id)) m.id = idToNameMap.get(m.id);

    // 父母
    if (m.fatherId && idToNameMap.has(m.fatherId)) {
      m.fatherId = idToNameMap.get(m.fatherId);
    }
    if (m.motherId && idToNameMap.has(m.motherId)) {
      m.motherId = idToNameMap.get(m.motherId);
    }

    // 笼位
    if (m.cageId && idToNameMap.has(m.cageId)) {
      m.cageId = idToNameMap.get(m.cageId);
    }

    // 原始 id
    if (m.originalId && idToNameMap.has(m.originalId)) {
      m.originalId = idToNameMap.get(m.originalId);
    }

    // 子代
    if (Array.isArray(m.childrenIds)) {
      m.childrenIds = m.childrenIds.map((cid) =>
        idToNameMap.has(cid) ? idToNameMap.get(cid) : cid
      );
    }

    // 配偶
    if (Array.isArray(m.spouseIds)) {
      m.spouseIds = m.spouseIds.map((sid) =>
        idToNameMap.has(sid) ? idToNameMap.get(sid) : sid
      );
    }

    return m;
  });

  // 映射笼子数据
  const mappedCages = cagesList.map((cage) => {
    const c = { ...cage };
    if (c.id && idToNameMap.has(c.id)) c.id = idToNameMap.get(c.id);
    return c;
  });

  return { mice: mappedMice, cages: mappedCages };
}

/**
 * 兼容旧用法：合并两类数据（不再用于 CSV/Excel 的表头推断）
 * @param {Array<Object>} mice
 * @param {Array<Object>} cages
 */
function buildExportData(mice, cages) {
  const { mice: mappedMice, cages: mappedCages } = mapDataForExport(mice, cages);
  const cageData = mappedCages.map((c) => ({ type: "cage", ...c }));
  const mouseData = mappedMice.map((m) => ({ type: "mouse", ...m }));
  return [...cageData, ...mouseData];
}

/**
 * 工具：收集对象数组的所有列
 * @param {Array<Object>} items
 * @returns {string[]}
 */
function collectColumns(items) {
  const set = new Set();
  (items || []).forEach((o) => Object.keys(o || {}).forEach((k) => set.add(k)));
  return Array.from(set);
}

/**
 * 工具：将对象中的数组/对象值转成可写入表格的字符串
 * @param {Array<Object>} items
 * @returns {Array<Object>}
 */
function normalizeForTabular(items) {
  return (items || []).map((obj) => {
    const o = {};
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        o[k] = v.join("; ");
      } else if (v !== null && typeof v === "object") {
        o[k] = JSON.stringify(v);
      } else if (v === undefined || v === null) {
        o[k] = "";
      } else {
        o[k] = v;
      }
    });
    return o;
  });
}

/**
 * 工具：按给定列顺序输出 CSV 字符串
 * @param {Array<Object>} items
 * @param {string[]} columns
 */
function toCSV(items, columns) {
  const esc = (val) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = columns.map((c) => esc(c)).join(",");
  const rows = (items || []).map((obj) =>
    columns.map((col) => esc(obj[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

/**
 * JSON 导出（单文件，含两类数据）
 * @param {Array<Object>} mice
 * @param {Array<Object>} cages
 */
export function exportToJSON(mice, cages) {
  const data = buildExportData(mice, cages);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mice_data.json";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV 导出（分别导出 mice 与 cages，确保 fatherId/motherId 等列存在）
 * @param {Array<Object>} mice
 * @param {Array<Object>} cages
 */
export function exportToCSV(mice, cages) {
  const { mice: mappedMice, cages: mappedCages } = mapDataForExport(mice, cages);

  // 老鼠：优先列顺序（确保包含 fatherId/motherId 等）
  const micePreferred = [
    "type",
    "id",
    "name",
    "sex",
    "genotype",
    "cageId",
    "fatherId",
    "motherId",
    "spouseIds",
    "childrenIds",
    "birthDate",
    "status",
    "originalId",
    "notes",
    "createdAt",
    "updatedAt",
  ];
  const miceRowsRaw = mappedMice.map((m) => ({ type: "mouse", ...m }));
  const miceRows = normalizeForTabular(miceRowsRaw);
  if (miceRows.length > 0) {
    const miceAllCols = Array.from(
      new Set([...micePreferred, ...collectColumns(miceRows)])
    );
    const miceCSV = toCSV(miceRows, miceAllCols);
    const blobM = new Blob([miceCSV], { type: "text/csv;charset=utf-8;" });
    const urlM = URL.createObjectURL(blobM);
    const aM = document.createElement("a");
    aM.href = urlM;
    aM.download = "mice_data_mice.csv";
    aM.click();
    URL.revokeObjectURL(urlM);
  }

  // 笼子：优先列顺序
  const cagePreferred = [
    "type",
    "id",
    "name",
    "location",
    "capacity",
    "notes",
    "createdAt",
    "updatedAt",
  ];
  const cageRowsRaw = mappedCages.map((c) => ({ type: "cage", ...c }));
  const cageRows = normalizeForTabular(cageRowsRaw);
  if (cageRows.length > 0) {
    const cageAllCols = Array.from(
      new Set([...cagePreferred, ...collectColumns(cageRows)])
    );
    const cageCSV = toCSV(cageRows, cageAllCols);
    const blobC = new Blob([cageCSV], { type: "text/csv;charset=utf-8;" });
    const urlC = URL.createObjectURL(blobC);
    const aC = document.createElement("a");
    aC.href = urlC;
    aC.download = "mice_data_cages.csv";
    aC.click();
    URL.revokeObjectURL(urlC);
  }
}

/**
 * Excel 导出（一个工作簿两张工作表：Mice / Cages）
 * @param {Array<Object>} mice
 * @param {Array<Object>} cages
 */
export function exportToExcel(mice, cages) {
  const { mice: mappedMice, cages: mappedCages } = mapDataForExport(mice, cages);

  const micePreferred = [
    "type",
    "id",
    "name",
    "sex",
    "genotype",
    "cageId",
    "fatherId",
    "motherId",
    "spouseIds",
    "childrenIds",
    "birthDate",
    "status",
    "originalId",
    "notes",
    "createdAt",
    "updatedAt",
  ];
  const cagePreferred = [
    "type",
    "id",
    "name",
    "location",
    "capacity",
    "notes",
    "createdAt",
    "updatedAt",
  ];

  const miceRowsRaw = mappedMice.map((m) => ({ type: "mouse", ...m }));
  const cageRowsRaw = mappedCages.map((c) => ({ type: "cage", ...c }));

  const miceRows = normalizeForTabular(miceRowsRaw);
  const cageRows = normalizeForTabular(cageRowsRaw);

  const wb = XLSX.utils.book_new();

  if (miceRows.length > 0) {
    const miceCols = Array.from(
      new Set([...micePreferred, ...collectColumns(miceRows)])
    );
    const miceOrdered = miceRows.map((o) =>
      Object.fromEntries(miceCols.map((k) => [k, o[k]]))
    );
    const wsM = XLSX.utils.json_to_sheet(miceOrdered, { header: miceCols });
    XLSX.utils.book_append_sheet(wb, wsM, "Mice");
  }

  if (cageRows.length > 0) {
    const cageCols = Array.from(
      new Set([...cagePreferred, ...collectColumns(cageRows)])
    );
    const cageOrdered = cageRows.map((o) =>
      Object.fromEntries(cageCols.map((k) => [k, o[k]]))
    );
    const wsC = XLSX.utils.json_to_sheet(cageOrdered, { header: cageCols });
    XLSX.utils.book_append_sheet(wb, wsC, "Cages");
  }

  XLSX.writeFile(wb, "mice_data.xlsx");
}

// 如果你仍想要“合并为一张 CSV”的单表版本，也可以追加一个函数：
// （注意：此版本会把 mice 与 cages 的列求并集，然后统一导出为一张 CSV）
// export function exportToSingleCSV(mice, cages) {
//   const merged = buildExportData(mice, cages);
//   const rows = normalizeForTabular(merged);
//   if (rows.length === 0) return;
//   const preferred = [
//     "type", "id", "name", "sex", "genotype", "cageId",
//     "fatherId", "motherId", "spouseIds", "childrenIds",
//     "birthDate", "status", "originalId", "location", "capacity",
//     "notes", "createdAt", "updatedAt"
//   ];
//   const cols = Array.from(new Set([...preferred, ...collectColumns(rows)]));
//   const csv = toCSV(rows, cols);
//   const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = "mice_data_all.csv";
//   a.click();
//   URL.revokeObjectURL(url);
// }
