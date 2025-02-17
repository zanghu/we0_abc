import { typeEnum } from "../prompt";

export function determineFileType(filesPath: string[]): typeEnum {
  if (filesPath.includes("app.json") || filesPath.includes("miniprogram/app.json") ) {
    return typeEnum.MiniProgram;
  } 
  return typeEnum.Other;
} 