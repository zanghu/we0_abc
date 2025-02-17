// 模型配置文件
// 根据实际场景配置模型

interface ModelConfig {
    modelName: string;
    modelKey: string;
    useImage: boolean;
    description?: string;
    iconUrl?: string;
    provider?: string; // 模型厂商
    apiKey?: string;
    apiUrl?: string;
}

export const modelConfig: ModelConfig[] = [
    {
        modelName: 'claude-3-5-sonnet', 
        modelKey: 'claude-3-5-sonnet-20240620',
        useImage: true, 
        provider: 'claude',
        description: 'claude-3-5-sonnet模型',       
    },
    {
        modelName: 'gpt-4o-mini', 
        modelKey: 'gpt-4o-mini',
        useImage: false, 
        provider: 'openai',
        description: 'gpt-4o-mini模型',       
    },
    {
        modelName: 'deepseek-R1', 
        modelKey: 'deepseek-reasoner',
        useImage: false, 
        provider: 'deepseek',
        description: 'deepseek-R1模型，支持推理，思维链',
        apiKey: process.env.THIRD_API_KEY, // 或者其他key...
        apiUrl: process.env.THIRD_API_URL,
    },

    {
        modelName: 'deepseek-v3', 
        modelKey: 'deepseek-chat',
        useImage: false, 
        provider: 'deepseek',
        description: 'deepseek-v3模型',   
        apiKey: process.env.THIRD_API_KEY,
        apiUrl: process.env.THIRD_API_URL,    
    }
]
