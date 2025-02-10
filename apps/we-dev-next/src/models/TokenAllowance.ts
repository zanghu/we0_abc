import mongoose from "mongoose";

/**
 * Token配额管理模型
 * 用于追踪和管理用户每月的AI Token使用情况
 */
const tokenAllowanceSchema = new mongoose.Schema({
  // 关联到用户表的ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // 年月标识，格式：YYYY-MM
  monthYear: {
    type: String,
    required: true,
  },
  // 当月已使用的token数量
  tokensUsed: {
    type: Number,
    default: 0,
  },
  // 每月token使用上限
  monthlyLimit: {
    type: Number,
    default: 100000,
  },
  // 最后更新时间
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// 创建复合索引，确保每个用户在每个月只能有一条记录
tokenAllowanceSchema.index({ userId: 1, monthYear: 1 }, { unique: true });

// 如果模型已存在则使用已有模型，否则创建新模型
export default mongoose.models.TokenAllowance ||
  mongoose.model("TokenAllowance", tokenAllowanceSchema);
