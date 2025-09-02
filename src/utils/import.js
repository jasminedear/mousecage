// src/utils/import.js
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * 读取文件 -> 归一化结构：
 * return {
 *   cages: [], mice: [], deadMice: [], records: [], breeding: {},
 *   asRows: [{type: 'cage'|'mouse', ...}], // 兼容旧逐条导入
 * }
 */

export async function importFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  let raw;
  if (ext === 'json') {
    raw = await readText(file).then((t) => JSON.parse(t));
  } else if (ext === 'csv') {
    raw = await readCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    raw = await readXLSX(file);
  } else {
    throw new Error('不支持的文件类型');
  }

  return normalizePayload(raw);
}

// ========== Readers ==========

function readText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsText(file, 'utf-8');
  });
}

async function readCSV(file) {
  const text = await readText(file);
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn('[import] CSV parse warnings:', parsed.errors);
  }
  // 假定 CSV 是“鼠/笼行式”混合或单一表（需有 type 字段或列名可推断）
  return parsed.data;
}

async function readXLSX(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// ========== Normalizer ==========

function normalizePayload(raw) {
  // 情况 A：整体对象导出
  if (raw && typeof raw === 'object' && (raw.cages || raw.mice || raw.deadMice || raw.records || raw.breeding)) {
    const cages = Array.isArray(raw.cages) ? raw.cages.map(nfCage) : [];
    const mice = Array.isArray(raw.mice) ? raw.mice.map(nfMouse) : [];
    const deadMice = Array.isArray(raw.deadMice) ? raw.deadMice.map(nfMouse) : [];
    const records = Array.isArray(raw.records) ? raw.records : [];
    const breeding = raw.breeding && typeof raw.breeding === 'object' ? raw.breeding : {};

    // 兼容 asRows
    const asRows = [
      ...cages.map((c) => ({ type: 'cage', ...c })),
      ...mice.map((m) => ({ type: 'mouse', ...m })),
    ];
    return { cages, mice, deadMice, records, breeding, asRows };
  }

  // 情况 B：行式数组（JSON/CSV/XLSX）
  if (Array.isArray(raw)) {
    const cages = [];
    const mice = [];
    const deadMice = [];
    const records = [];
    const breeding = {};

    raw.forEach((row0) => {
      const row = normalizeKeys(row0); // 处理大小写/别名
      const type = row.type || guessTypeFromRow(row);
      if (type === 'cage') cages.push(nfCage(row));
      else if (type === 'mouse') mice.push(nfMouse(row));
    });

    const asRows = [
      ...cages.map((c) => ({ type: 'cage', ...c })),
      ...mice.map((m) => ({ type: 'mouse', ...m })),
    ];
    return { cages, mice, deadMice, records, breeding, asRows };
  }

  throw new Error('不支持的导入结构');
}

// 字段名统一（简单把常见别名转成小写 key）
function normalizeKeys(obj) {
  const out = {};
  Object.keys(obj || {}).forEach((k) => {
    out[k.trim().toLowerCase()] = obj[k];
  });
  return out;
}

function guessTypeFromRow(r) {
  // 有明显 cage 名字段
  if (r.type === 'cage' || r.kind === 'cage' || r.category === 'cage') return 'cage';
  if (r.type === 'mouse' || r.kind === 'mouse' || r.category === 'mouse') return 'mouse';
  // 简单启发：有 sex/name/birthDate 则判 mouse；有 row/name 则可能 cage
  if (r.sex || r['出生日期'] || r.birthdate) return 'mouse';
  if (r.row || (r.name && String(r.name).includes('-'))) return 'cage';
  return 'mouse';
}

function nfCage(r) {
  // 支持 "name" 或 "cageName"
  const name = r.name || r.cagename || r['笼位'] || '';
  // 推导 row：如 A-1-01 -> A
  const row = (String(name).split('-')[0] || r.row || '未分组').trim();
  return { name, row };
}

function nfMouse(r) {
  // 名称/编号
  const name = r.name || r['编号'] || r.code || r.id || '';
  // 笼位：优先用 cageId；没有就尝试 cageName，并留由上层用名字找 id
  const cageId = r.cageid || r['cageid'] || null;
  const cageName = r.cagename || r['笼位'] || r['cage'] || null;

  // 性别统一
  let sex = (r.sex || r['性别'] || '').toString().toLowerCase().trim();
  if (sex === '♂' || sex === 'male' || sex === 'm' || sex === '公') sex = 'male';
  else if (sex === '♀' || sex === 'female' || sex === 'f' || sex === '母') sex = 'female';
  else if (!sex) sex = 'normal';

  // 基因型/分组
  const genotype = r.genotype || r['基因型'] || '';
  const group = r.group || r['分组'] || '';

  // 日期字段（转 ISO 简单格式 yyyy-mm-dd）
  const birthDate = normalizeDate(r.birthdate || r['出生日期'] || r['birthdate']);
  const deathDate = normalizeDate(r.deathdate || r['死亡日期']);

  // 状态/关系字段
  const rawStatuses = r.statuses || r['状态'] || '';
  const statuses = Array.isArray(rawStatuses)
    ? rawStatuses
    : String(rawStatuses || '')
        .split(/[,\s，]/)
        .map((s) => s.trim())
        .filter(Boolean);

  const spouseIds = Array.isArray(r.spouseids) ? r.spouseids : [];
  const childrenIds = Array.isArray(r.childrenids) ? r.childrenids : [];
  const fatherId = r.fatherid || null;
  const motherId = r.motherid || null;

  // 备注
  const notes = r.notes || r['备注'] || '';

  const base = {
    name,
    cageId: cageId || null, // 如果为 null，外层导入时可再用 cageName 映射到真正 id
    cageName: cageName || null,
    sex,
    genotype,
    birthDate,
    group,
    notes,
    statuses,
    spouseIds,
    childrenIds,
    fatherId,
    motherId,
  };

  // 如果有死亡日期，保留（给需要的人使用；你的系统会用 recordDeath 正确移动）
  if (deathDate) base.deathDate = deathDate;

  return base;
}

function normalizeDate(v) {
  if (!v) return '';
  const s = String(v).trim();
  // 已是 yyyy-mm-dd 或 ISO
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) return s.slice(0, 10);
  // 常见本地格式 2024/1/3
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('/');
    return `${pad2(y)}-${pad2(m)}-${pad2(d)}`;
  }
  // 尝试 Date 解析
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dd = d.getDate();
    return `${y}-${pad2(m)}-${pad2(dd)}`;
  }
  return '';
}

function pad2(n) {
  n = String(n);
  return n.length === 1 ? `0${n}` : n;
}
