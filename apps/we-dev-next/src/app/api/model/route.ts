import { NextResponse } from "next/server";
import { modelConfig } from "./config";
// 获取模型配置, 可以迁移到配置中心
export async function POST() {
    // 过滤掉key部分
    const config = modelConfig.map(item => {
        return {
            label: item.modelName,
            value: item.modelKey,
            useImage: item.useImage,
            description: item.description,
            icon: item.iconUrl,
            provider: item.provider,
        }
    })
     return NextResponse.json(config);
}
