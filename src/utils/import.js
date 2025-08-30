import * as XLSX from "xlsx"
import Papa from "papaparse"

export async function importFile(file) {
  const ext = file.name.split(".").pop().toLowerCase()

  if (ext === "json") {
    return await importJSON(file)
  } else if (ext === "csv") {
    return await importCSV(file)
  } else if (ext === "xlsx") {
    return await importExcel(file)
  } else {
    throw new Error("不支持的文件格式: " + ext)
  }
}

async function importJSON(file) {
  const text = await file.text()
  return JSON.parse(text)
}

async function importCSV(file) {
  const text = await file.text()
  const result = Papa.parse(text, { header: true })
  return result.data // 每一行是一个对象
}

async function importExcel(file) {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
  return worksheet
}
