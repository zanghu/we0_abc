import { Messages } from "../action";
import { parseMessage } from "../messagepParseJson";

export function processFiles(messages: Messages) {
  const files: { [key: string]: string } = {};
  let allContent = "";

  messages.forEach((message) => {
    allContent += message.content;
    const { content, files: messageFiles } = parseMessage(message.content);
    message.content = content;
    if (typeof messageFiles === "object") {
      const excludeFiles = [
        "components/weicon/base64.js",
        "components/weicon/icon.css",
        "components/weicon/index.js",
        "components/weicon/index.json",
        "components/weicon/index.wxml",
        "components/weicon/icondata.js",
      ];
      excludeFiles.forEach(file => delete messageFiles[file]);
    }
    Object.assign(files, messageFiles);
  });

  return { files, allContent };
} 