import TokenAllowance from "@/models/TokenAllowance";

export function estimateTokens(text: string) {
  // 基本规则  
  // 1. 英文：约4个字符1个token  
  // 2. 中文：约1-2个字符1个token  
  // 3. 空格和标点：约1个token  

  const chineseRegex = /[\u4e00-\u9fff]/g;
  const punctuationRegex = /[.,!?;:，。！？；：]/g;
  const whitespaceRegex = /\s+/g;

  // 计算中文字符数  
  const chineseChars = (text.match(chineseRegex) || []).length;

  // 计算标点符号数  
  const punctuationCount = (text.match(punctuationRegex) || []).length;

  // 计算空格数  
  const whitespaceCount = (text.match(whitespaceRegex) || []).length;

  // 计算剩余字符（主要是英文）  
  const otherChars = text.length - chineseChars - punctuationCount - whitespaceCount;

  // 估算token数量  
  const tokenEstimate = Math.ceil(
    chineseChars * 1.5 + // 中文字符  
    otherChars / 4 + // 英文字符  
    punctuationCount + // 标点符号  
    whitespaceCount // 空格  
  );

  return tokenEstimate;
}

/**
 * 使用示例：扣除用户token
 * @param userId 用户ID
 * @param tokensToDeduct 需要扣除的token数量
 */
export async function deductUserTokens(userId: string, tokensToDeduct: number) {
  // 获取当前年月（YYYY-MM格式）

  
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 查找并更新用户的token使用记录
  // upsert: true 表示如果记录不存在则创建新记录
  await TokenAllowance.findOneAndUpdate(
    { userId, monthYear: currentMonth },
    { $inc: { tokensUsed: tokensToDeduct } },
    { upsert: true }
  );
}

/**
 * 检查用户是否还有足够的token
 * @param userId 用户ID
 * @returns boolean
 */
export async function hasEnoughTokens(userId: string): Promise<boolean> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const tokenAllowance = await TokenAllowance.findOne({
    userId,
    monthYear: currentMonth
  });

  if (!tokenAllowance) return true; // 新用户尚未有记录
  console.log(tokenAllowance.tokensUsed, tokenAllowance.monthlyLimit)
  return tokenAllowance.tokensUsed < tokenAllowance.monthlyLimit;
}