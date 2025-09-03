import AV from "leancloud-storage";

AV.init({
  appId: "ZLkkPAXcgPohlfbhzN3UPDUt-gzGzoHsz",
  appKey: "WCk6OSzGnaCWaE6rnrisYFJ2",
  serverURL: "https://zlkkpaxc.lc-cn-n1-shared.com",
});

const CLASS = "MouseData";      // 数据表
const FIELD_DATA = "data";      // 存储实际 JSON 数据
const FIELD_OWNER = "owner";    // 指向 _User 的 Pointer

/**
 * 获取当前用户的唯一数据文档，如果没有则新建。
 */
async function getOrCreateDocForUser(user) {
  if (!user) throw new Error("No current user");

  const q = new AV.Query(CLASS);
  q.equalTo(FIELD_OWNER, user);
  let doc = await q.first();

  if (!doc) {
    const Obj = AV.Object.extend(CLASS);
    doc = new Obj();
    doc.set(FIELD_OWNER, user);

    // ACL：仅本人可读写
    const acl = new AV.ACL(user);
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    doc.setACL(acl);

    await doc.save();
    console.log(`[LeanCloud] Created new MouseData doc for user ${user.id}`);
  }

  return doc;
}

/**
 * 保存数据（每个用户独立）。
 */
export async function saveToCloud(data) {
  const user = AV.User.current();
  if (!user) {
    console.error("[LeanCloud] ❌ Save failed: no current user");
    return false;
  }
  try {
    const doc = await getOrCreateDocForUser(user);
    doc.set(FIELD_DATA, data);
    await doc.save();
    console.log(`[LeanCloud] ✅ Data saved for user ${user.id}`);
    return true;
  } catch (err) {
    console.error("[LeanCloud] ❌ Save error:", err);
    return false;
  }
}

/**
 * 加载数据（每个用户独立）。
 */
export async function loadFromCloud() {
  const user = AV.User.current();
  if (!user) {
    console.error("[LeanCloud] ❌ Load failed: no current user");
    return null;
  }
  try {
    const doc = await getOrCreateDocForUser(user);
    const data = doc.get(FIELD_DATA) || null;
    if (data) {
      console.log(`[LeanCloud] ✅ Data loaded for user ${user.id}`);
    } else {
      console.log(`[LeanCloud] ⚠️ No data found for user ${user.id}`);
    }
    return data;
  } catch (err) {
    console.error("[LeanCloud] ❌ Load error:", err);
    return null;
  }
}

export default AV;
