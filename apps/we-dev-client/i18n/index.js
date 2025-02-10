import traverse from "@babel/traverse";
import * as babelParser from "@babel/parser";
import * as babelTypes from "@babel/types";
import * as babelGenerator from "@babel/generator";
import { translateBatch } from "./translateReq";

export function checkClassnameTranslate() {
  return {
    name: "check-classname-translate",
    enforce: "pre", // 强制在其他插件之前运行
    async transform(code, id) {
      // 将 transform 改为异步函数
      if (id.endsWith(".tsx") || id.endsWith(".jsx")) {
        try {
          // console.log('Processing file:', id);

          const ast = babelParser.parse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
          });

          // 收集所有待翻译的文本内容
          const textNodes = [];

          traverse(ast, {
            JSXElement(path) {
              const classNameAttr = path.node.openingElement.attributes.find(
                (attr) => attr.name && attr.name.name === "className"
              );

              if (classNameAttr) {
                let classValue = "";
                if (babelTypes.isStringLiteral(classNameAttr.value)) {
                  classValue = classNameAttr.value.value;
                } else if (
                  babelTypes.isJSXExpressionContainer(classNameAttr.value)
                ) {
                  const expression = classNameAttr.value.expression;
                  if (babelTypes.isStringLiteral(expression)) {
                    classValue = expression.value;
                  }
                }

                // 判断 className 中是否包含 "translate"
                if (classValue.split(" ").includes("translate")) {
                  // console.log(id,'Found translate className, modifying text content');
                  // 提取标签中的文本内容
                  path.node.children.forEach((child) => {
                    if (babelTypes.isJSXText(child)) {
                      const text = child.value.trim();
                      // 过滤掉空字符串
                      if (text) {
                        console.log("需要翻译的内容：", text);
                        textNodes.push({ text, child });
                      }
                    } else if (babelTypes.isJSXElement(child)) {
                      // 如果子元素是 JSXElement，递归修改
                      textNodes.push(...collectTextNodes(child));
                    }
                  });
                }
              }
            },
          });

          // 进行批量翻译
          const translatedTexts = await translateBatch(textNodes);
          // 更新翻译后的文本
          textNodes.forEach((node, index) => {
            if (translatedTexts[index]) {
              node.child.value = translatedTexts[index];
            }
          });

          // 使用 babel-generator 将 AST 转换为代码
          const { code: transformedCode } = babelGenerator.default(
            ast,
            {},
            code
          );

          // 返回修改后的代码
          return {
            code: transformedCode,
            map: null,
          };
        } catch (error) {
          console.error(`解析文件 ${id} 时出错:`, error);
        }

        return null;
      }
    },
  };
}

function collectTextNodes(node) {
  const textNodes = [];

  if (babelTypes.isJSXText(node)) {
    const text = node.value.trim();
    if (text) {
      textNodes.push({ text, child: node });
    }
  } else if (babelTypes.isJSXElement(node)) {
    node.children.forEach((child) => {
      textNodes.push(...collectTextNodes(child));
    });
  }

  return textNodes;
}
