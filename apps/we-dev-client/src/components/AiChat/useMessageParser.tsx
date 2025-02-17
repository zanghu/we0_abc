import { FileAction, StreamingMessageParser } from "./messae";
import { createFileWithContent } from "../WeIde/features/file-explorer/utils/fileSystem";
import { executeCommand } from "../WeIde/components/Terminal/utils/commands";

class List {
  private queue: string[] = [];
  private processing: boolean = false;

  // 添加命令到队列
  push(command: string) {
    this.queue.push(command);
    this.process();
  }

  // 获取队列中的下一个命令
  private getNext(): string | undefined {
    return this.queue.shift();
  }

  // 处理队列
  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const command = this.getNext();
        if (command) {
          await executeCommand(command);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // 清空队列
  clear() {
    this.queue = [];
    this.processing = false;
  }
}

const execList = new List();

const messageParser = new StreamingMessageParser({
  callbacks: {
    onActionClose: async (data) => {
      if (data.action.type === "shell") {
        const command = data.action.content.replace(/\n/g, "").trim();
        execList.push(command);
        if(messageParser.isUseStartCommand){
          messageParser.isUseStartCommand = false
        }
      } 
      if (data.action.type === "start") {
        const command = data.action.content.replace(/\n/g, "").trim();
        execList.push(command);
        messageParser.isUseStartCommand = true;
      }
    },
    onActionStream: async (data) => {
      console.log("onActionStream", data.action)
       createFileWithContent((data.action as FileAction).filePath, data.action.content, true);
      //   workbenchStore.runAction(data, true);
    },
  },
});

interface ParserCallbacks {
  onArtifactOpen?: (data: any) => void;
  onArtifactClose?: (data: any) => void;
  onActionOpen?: (data: any) => void;
  onActionClose?: (data: any) => void;
  onActionStream?: (data: any) => void;
  onProgress?: (progress: number) => void;
  onTaskComplete?: (filePath: string) => void;
}

export const parseMessages = async (messages: any) => {
  for (const [index, message] of messages.entries()) {
    if (message.role === "assistant") {
       messageParser.parse(
        message.id,
        message.content,
      );
    }
  }
}