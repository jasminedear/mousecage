import AV from 'leancloud-storage';

AV.init({
  appId: 'ZLkkPAXcgPohlfbhzN3UPDUt-gzGzoHsz',
  appKey: 'WCk6OSzGnaCWaE6rnrisYFJ2',
  serverURL: 'https://zlkkpaxc.lc-cn-n1-shared.com'
});

// ⚠️ 与控制台一致：你现在的表叫 MouseData（不是 MiceData）
const CLASS = 'MouseData';
const FIELD_DATA  = 'data';
const FIELD_OWNER = 'owner'; // Pointer<_User>

async function getOrCreateDocForUser(user) {
  if (!user) throw new Error('no current user');

  // 只查“属于当前用户”的那条
  const q = new AV.Query(CLASS);
  q.equalTo(FIELD_OWNER, user);
  let doc = await q.first();

  if (!doc) {
    const Obj = AV.Object.extend(CLASS);
    doc = new Obj();
    doc.set(FIELD_OWNER, user);

    // 仅本人可读写
    const acl = new AV.ACL(user);
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    doc.setACL(acl);

    await doc.save();
  }
  return doc;
}

export async function saveToCloud(data) {
  const user = AV.User.current();
  if (!user) { console.error('[LC] save failed: no user'); return false; }
  try {
    const doc = await getOrCreateDocForUser(user);
    doc.set(FIELD_DATA, data);
    await doc.save();
    console.log('[LC] ✅ saved for', user.id);
    return true;
  } catch (e) {
    console.error('[LC] ❌ save error', e);
    return false;
  }
}

export async function loadFromCloud() {
  const user = AV.User.current();
  if (!user) { console.error('[LC] load failed: no user'); return null; }
  try {
    const doc = await getOrCreateDocForUser(user);
    return doc.get(FIELD_DATA) || null;
  } catch (e) {
    console.error('[LC] ❌ load error', e);
    return null;
  }
}

export default AV;
