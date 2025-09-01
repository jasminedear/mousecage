// 生成一个简短的唯一 ID
export function generateShortId() {
  const timestamp = Date.now().toString(36); // 转换为36进制
  const random = Math.random().toString(36).substring(2, 6); // 随机4位
  return `${timestamp}-${random}`;
}