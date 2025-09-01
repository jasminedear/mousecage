import * as XLSX from "xlsx";

/**
 * ⚡ 最终修复：将所有数据中的ID都统一映射为用户定义的编号（name）
 * @param {Array<Object>} miceList - 包含所有老鼠的完整列表
 * @param {Array<Object>} cagesList - 包含所有笼子的完整列表
 * @returns {Object} 包含映射后老鼠和笼子数据的对象
 */
function mapDataForExport(miceList, cagesList) {
    const idToNameMap = new Map();
    // 建立老鼠的 ID 到 Name 的映射
    miceList.forEach(mouse => {
        if (mouse.id && mouse.name) {
            idToNameMap.set(mouse.id, mouse.name);
        }
    });
    // 建立笼子的 ID 到 Name 的映射
    cagesList.forEach(cage => {
        if (cage.id && cage.name) {
            idToNameMap.set(cage.id, cage.name);
        }
    });

    // 映射老鼠数据
    const mappedMice = miceList.map(mouse => {
        const newMouse = { ...mouse };
        // 将老鼠自己的 ID 替换为 Name
        newMouse.id = idToNameMap.get(newMouse.id) || newMouse.id;

        // 替换父 ID
        if (newMouse.fatherId && idToNameMap.has(newMouse.fatherId)) {
            newMouse.fatherId = idToNameMap.get(newMouse.fatherId);
        }
        // 替换母 ID
        if (newMouse.motherId && idToNameMap.has(newMouse.motherId)) {
            newMouse.motherId = idToNameMap.get(newMouse.motherId);
        }
        // 替换笼位 ID
        if (newMouse.cageId && idToNameMap.has(newMouse.cageId)) {
            newMouse.cageId = idToNameMap.get(newMouse.cageId);
        }
        // 替换原始 ID
        if (newMouse.originalId && idToNameMap.has(newMouse.originalId)) {
            newMouse.originalId = idToNameMap.get(newMouse.originalId);
        }
        
        // 替换子代 ID 数组
        if (newMouse.childrenIds && Array.isArray(newMouse.childrenIds)) {
            newMouse.childrenIds = newMouse.childrenIds.map(childId => {
                return idToNameMap.has(childId) ? idToNameMap.get(childId) : childId;
            });
        }
        
        // 替换配偶 ID 数组
        if (newMouse.spouseIds && Array.isArray(newMouse.spouseIds)) {
            newMouse.spouseIds = newMouse.spouseIds.map(spouseId => {
                return idToNameMap.has(spouseId) ? idToNameMap.get(spouseId) : spouseId;
            });
        }

        return newMouse;
    });

    // 映射笼子数据
    const mappedCages = cagesList.map(cage => {
        const newCage = { ...cage };
        // 将笼子自己的 ID 替换为 Name
        newCage.id = idToNameMap.get(newCage.id) || newCage.id;
        return newCage;
    });

    return { mice: mappedMice, cages: mappedCages };
}

function buildExportData(mice, cages) {
  const { mice: mappedMice, cages: mappedCages } = mapDataForExport(mice, cages);
  const cageData = mappedCages.map(c => ({ type: "cage", ...c }));
  const mouseData = mappedMice.map(m => ({ type: "mouse", ...m }));
  return [...cageData, ...mouseData];
}

export function exportToJSON(mice, cages) {
  const data = buildExportData(mice, cages);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mice_data.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(mice, cages) {
  const data = buildExportData(mice, cages);
  if (data.length === 0) return;

  const header = Object.keys(data[0]).map(key => `"${key}"`).join(",");
  const rows = data.map(obj => 
    Object.values(obj)
      .map(value => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mice_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(mice, cages) {
  const data = buildExportData(mice, cages);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MiceData");
  XLSX.writeFile(wb, "mice_data.xlsx");
}