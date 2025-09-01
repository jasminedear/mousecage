import AV from 'leancloud-storage';

// === LeanCloud 初始化和数据操作模块 ===
const FIXED_USER_ID = "shared_user";
const MouseData = AV.Object.extend('MouseData');

AV.init({
    appId: "ZLkkPAXcgPohlfbhzN3UPDUt-gzGzoHsz",
    appKey: "WCk6OSzGnaCWaE6rnrisYFJ2",
    serverURL: "https://zlkkpaxc.lc-cn-n1-shared.com"
});

export const saveToCloud = async (data) => {
    try {
        let query = new AV.Query('MouseData');
        query.equalTo('userId', FIXED_USER_ID);
        let obj = await query.first();
        if (!obj) {
            obj = new MouseData();
            obj.set('userId', FIXED_USER_ID);
            const acl = new AV.ACL();
            acl.setPublicReadAccess(true);
            acl.setPublicWriteAccess(true);
            obj.setACL(acl);
        }
        obj.set('cages', data.cages || []);
        obj.set('mice', data.mice || []);
        obj.set('records', data.records || []);
        obj.set('breeding', data.breeding || {});
        obj.set('deadMice', data.deadMice || []); // ✅ 新增：保存死亡老鼠
        obj.set('lastModified', { time: new Date(), user: 'shared_user' });
        await obj.save();
        console.log("✅ 保存成功");
        return true;
    } catch (e) {
        console.error("❌ 保存失败:", e);
        return false;
    }
};

export const loadFromCloud = async () => {
    try {
        const query = new AV.Query('MouseData');
        query.equalTo('userId', FIXED_USER_ID);
        let obj = await query.first();
        if (obj) {
            console.log("✅ 已从云端加载");
            return {
                cages: obj.get('cages') || [],
                mice: obj.get('mice') || [],
                records: obj.get('records') || [],
                breeding: obj.get('breeding') || {},
                deadMice: obj.get('deadMice') || [], // ✅ 新增：加载死亡老鼠
                lastModified: obj.get('lastModified')
            };
        } else {
            console.log("⚠️ 没找到存档，初始化默认数据");
            const defaultData = {
                cages: [], mice: [], records: [], breeding: {}, deadMice: [], lastModified: null
            };
            await saveToCloud(defaultData);
            return defaultData;
        }
    } catch (e) {
        console.error("❌ 加载失败:", e);
        return { cages: [], mice: [], records: [], breeding: {}, deadMice: [], lastModified: null };
    }
};