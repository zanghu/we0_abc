import fs from 'fs';
import path from 'path';
import { sendTranslationRequest } from './request'

const targetLanguage = process.env.LANGUAGE || 'en'  // 默认为 'en'

// 假设你使用的是一个翻译 API 请求，替换成你的翻译接口
async function fetchTranslation(texts) {
    if (targetLanguage === 'en') {
        return texts;
    }

    // 假设你正在翻译的文本是英文翻译到中文
    const payload = {
        Source: 'en', // 原语言
        Target: targetLanguage, // 目标语言
        ProjectId: 0, // 默认项目ID
        SourceTextList: texts, // 待翻译的文本列表
    };

    console.log("fetch translation:", texts)

    // 将 payload 转换为 JSON 字符串
    const payloadStr = JSON.stringify(payload);

    try {
        // 发送翻译请求
        const response = await sendTranslationRequest(payloadStr);

        // 解析响应
        const result = JSON.parse(response);

        // 从响应中提取翻译结果
        const translatedTexts = result.Response.TargetTextList;

        if (translatedTexts && translatedTexts.length === texts.length) {
            // 返回翻译后的文本
            return translatedTexts;
        } else {
            throw new Error('翻译结果与请求文本数量不匹配');
        }
    } catch (error) {
        console.error('翻译请求失败:', error);
        throw error;
    }
}

// 读取现有的翻译文件
function loadTranslationCache() {
    const cachePath = path.resolve(__dirname, `./cache/${targetLanguage}.json`);
    if (fs.existsSync(cachePath)) {
        const cacheContent = fs.readFileSync(cachePath, 'utf-8');
        return JSON.parse(cacheContent);
    }
    return {};
}

// 更新翻译缓存文件
function updateTranslationCache(translations) {
    const cachePath = path.resolve(__dirname, `./cache/${targetLanguage}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(translations, null, 2), 'utf-8');
}

// 翻译函数
async function translate(text) {
    const cache = loadTranslationCache();
    // 如果文本已经有翻译，直接返回
    if (cache[text]) {
        return cache[text];
    }

    // 否则，返回空字符串，并添加到待翻译数组中
    return null;
}

async function translateBatch(texts) {
    const cache = loadTranslationCache();
    const toTranslate = [];

    // 检查哪些文本需要翻译
    texts.forEach(node => {
        const text = node.text
        console.log(`TranslateCache["${text}"]: `, cache[text])
        // console.log("cache[text]: ", cache, text, cache[text])
        if (cache[text]) {
            // 如果缓存中有翻译，直接使用
            node.translated = cache[text];
        } else {
            // 如果没有翻译，加入待翻译列表
            toTranslate.push(node);
        }
    });

    if (toTranslate.length > 0) {
        // 发送请求翻译所有待翻译的文本
        const translatedTexts = await fetchTranslation(toTranslate.map(t => t.text));

        // 更新缓存并为待翻译文本设置翻译结果
        translatedTexts.forEach((translatedText, index) => {
            const originalText = toTranslate[index].text;
            // console.log("originalText", originalText)
            cache[originalText] = translatedText;
            // console.log(cache)
            toTranslate[index].translated = translatedText;
        });
        // 更新翻译缓存
        updateTranslationCache(cache);
    }

    return texts.map(t => t.translated);
}

export { translate, translateBatch };
