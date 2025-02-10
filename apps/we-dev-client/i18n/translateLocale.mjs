import fs from "fs";
import path from "path";
import { sendTranslationRequest } from "./request.mjs";

// 配置
const CONFIG = {
  sourceLanguage: "en",
  targetLanguages: ["zh"], // 支持的目标语言
  sourcePath: path.resolve(process.cwd(), "./src/locale/en.json"),
  localePath: path.resolve(process.cwd(), "./src/locale/"),
};

// 将对象扁平化，方便翻译
function flattenObject(obj, prefix = "") {
  let result = {};
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(result, flattenObject(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

// 将扁平化的对象还原为嵌套结构
function unflattenObject(obj) {
  const result = {};
  for (const key in obj) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = obj[key];
  }
  return result;
}

// 翻译文本
async function translateText(texts, targetLang) {
  const payload = {
    Source: CONFIG.sourceLanguage,
    Target: targetLang,
    ProjectId: 0,
    SourceTextList: texts,
  };

  try {
    const response = await sendTranslationRequest(JSON.stringify(payload));
    const result = JSON.parse(response);
    return result.Response.TargetTextList;
  } catch (error) {
    console.error(`翻译失败 (${targetLang}):`, error);
    throw error;
  }
}

// 批量翻译对象
async function translateObject(flatObj, targetLang) {
  const keys = Object.keys(flatObj);
  const values = Object.values(flatObj);

  // 过滤掉不需要翻译的值（如空字符串、数字等）
  const textsToTranslate = values.filter(
    (v) => typeof v === "string" && v.trim()
  );
  const translatedTexts = await translateText(textsToTranslate, targetLang);

  // 将翻译结果重新组装成对象
  const result = {};
  let translatedIndex = 0;

  keys.forEach((key, index) => {
    if (typeof values[index] === "string" && values[index].trim()) {
      result[key] = translatedTexts[translatedIndex++];
    } else {
      result[key] = values[index];
    }
  });

  return result;
}

// 保存翻译结果
function saveTranslation(data, lang) {
  const targetPath = path.join(CONFIG.localePath, `${lang}.json`);

  // 确保目录存在
  if (!fs.existsSync(CONFIG.localePath)) {
    fs.mkdirSync(CONFIG.localePath, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`已保存翻译文件: ${targetPath}`);
}

// 主函数
async function main() {
  try {
    // 读取源文件
    const sourceContent = JSON.parse(
      fs.readFileSync(CONFIG.sourcePath, "utf8")
    );

    // 扁平化对象
    const flattenedContent = flattenObject(sourceContent);

    // 对每种目标语言进行翻译
    for (const targetLang of CONFIG.targetLanguages) {
      console.log(`开始翻译 ${targetLang}...`);

      // 翻译
      const translatedFlat = await translateObject(
        flattenedContent,
        targetLang
      );

      // 还原嵌套结构
      const translatedNested = unflattenObject(translatedFlat);

      // 保存结果
      saveTranslation(translatedNested, targetLang);

      console.log(`${targetLang} 翻译完成`);
    }

    console.log("所有翻译任务完成！");
  } catch (error) {
    console.error("翻译过程出错:", error);
    process.exit(1);
  }
}

// 运行脚本
main();
