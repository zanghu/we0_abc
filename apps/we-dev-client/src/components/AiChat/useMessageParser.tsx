import { useCallback, useState } from "react";
import { FileAction, StreamingMessageParser } from "./messae";
import { createFileWithContent } from "../WeIde/features/file-explorer/utils/fileSystem";
import { executeCommand } from "../WeIde/components/Terminal/utils/commands";

const messageParser = new StreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      console.log("onArtifactOpen", data);
      // TODO: add artifact

      //   workbenchStore.addArtifact(data);
    },
    onArtifactClose: async (data) => {
      console.log("onArtifactClose", data);
      // await executeCommand("npm run dev");

      // await createFileWithContent(data.action.filePath, data.action.content, true);
      //   workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      // we only add shell actions when when the close tag got parsed because only then we have the content
      if (data.action.type !== "shell") {
        // executeCommand(data.action.content);
        // workbenchStore.addAction(data);
      }
    },
    onActionClose: async (data) => {
      console.log("onActionClose", data.action,);
      if (data.action.type === "shell") {
        // 去掉\n的情况
        await executeCommand(data.action.content.replace(/\n/g, ""));
      } 
      if (data.action.type === "start") {
        await executeCommand(data.action.content.replace(/\n/g, ""));
      }
      console.log("onActionClose", data,'datadata')
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