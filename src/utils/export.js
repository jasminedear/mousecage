import * as XLSX from "xlsx"

// 统一数据结构
function buildExportData(mice, cages) {
  const cageData = cages.map(c => ({ type: "cage", ...c }))
  const mouseData = mice.map(m => ({ type: "mouse", ...m }))
  return [...cageData, ...mouseData]
}

// 导出 JSON
export function exportToJSON(mice, cages) {
  const data = buildExportData(mice, cages)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "mice_data.json"
  a.click()
  URL.revokeObjectURL(url)
}

// 导出 CSV
export function exportToCSV(mice, cages) {
  const data = buildExportData(mice, cages)
  const header = Object.keys(data[0] || {}).join(",")
  const rows = data.map(obj => Object.values(obj).join(","))
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "mice_data.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// ✅ 导出 Excel
export function exportToExcel(mice, cages) {
  const data = buildExportData(mice, cages)
  const ws = XLSX.utils.json_to_sheet(data)   // 转换为 sheet
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "MiceData")
  XLSX.writeFile(wb, "mice_data.xlsx")        // 下载文件
}

