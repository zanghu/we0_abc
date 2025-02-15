import { FileAction, StreamingMessageParser } from "./messae";
import { createFileWithContent } from "../WeIde/features/file-explorer/utils/fileSystem";
import { executeCommand } from "../WeIde/components/Terminal/utils/commands";

const messageParser = new StreamingMessageParser({
  callbacks: {
    onActionClose: async (data) => {
      if (data.action.type === "shell") {
        // 去掉\n的情况
        await executeCommand(data.action.content.replace(/\n/g, ""));
      } 
      if (data.action.type === "start") {
        await executeCommand(data.action.content.replace(/\n/g, ""));
        if(messageParser.isUseStartCommand){
          await executeCommand('npm run dev');
          messageParser.isUseStartCommand = false
        }
      }
    },
    onActionStream: async (data) => {
       createFileWithContent((data.action as FileAction).filePath, data.action.content, true);
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