import AV from 'leancloud-storage'

// 替换成你的 LeanCloud 应用的 AppID、AppKey、ServerURL
AV.init({
  appId: "ZLkkPAXcgPohlfbhzN3UPDUt-gzGzoHsz",
  appKey: "WCk6OSzGnaCWaE6rnrisYFJ2",
  serverURL: "https://zlkkpaxc.lc-cn-n1-shared.com"
})

// ⚡ 核心：使用 'UserData' 这个 Class 来存储每个用户的数据
const DATA_CLASS_NAME = 'UserData';
const USER_POINTER_KEY = 'owner';
const DATA_KEY = 'appData';

/**
 * 根据用户ID保存数据
 * @param {object} data 要保存的 JSON 对象
 * @param {string} userId 当前用户的唯一ID
 * @returns {Promise<boolean>} 保存是否成功
 */
export async function saveToCloud(data, userId) {
  try {
    // 使用 createWithoutData 方法，避免不必要的网络请求
    const user = AV.Object.createWithoutData('_User', userId);
    const query = new AV.Query(DATA_CLASS_NAME);
    query.equalTo(USER_POINTER_KEY, user);
    
    // 查找该用户已有的数据对象
    let userObject = await query.first();

    if (!userObject) {
      // 如果没有，则新建一个数据对象并关联到当前用户
      userObject = new AV.Object(DATA_CLASS_NAME);
      userObject.set(USER_POINTER_KEY, user);
    }
    
    // 设置数据，并保存
    userObject.set(DATA_KEY, data);
    await userObject.save();
    return true;
  } catch (error) {
    console.error('云端保存失败:', error);
    return false;
  }
}

/**
 * 根据用户ID加载数据
 * @param {string} userId 当前用户的唯一ID
 * @returns {Promise<object|null>} 加载到的数据对象或 null
 */
export async function loadFromCloud(userId) {
  try {
    const user = AV.Object.createWithoutData('_User', userId);
    const query = new AV.Query(DATA_CLASS_NAME);
    query.equalTo(USER_POINTER_KEY, user);
    
    const userObject = await query.first();
    
    return userObject ? userObject.get(DATA_KEY) : null;
  } catch (error) {
    console.error('云端加载失败:', error);
    return null;
  }
}

export default AV