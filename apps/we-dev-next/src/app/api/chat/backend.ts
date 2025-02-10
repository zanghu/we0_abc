import { promptExtra } from "./prompt";

export const backendLanguageFunctionRegister = {
    "java":resolveJava
  }

  function resolveJava(extra:promptExtra){
    let promptArr = [];
    promptArr.push("IMPORTANT: 采用Maven构建后端项目，并且使用SpringBoot作为后端框架，使用MybaitsPlus作为ORM框架，实现相关的Controller层，Service层，ServiceImpl层，Mapper层，Model层");
    promptArr.push("IMPORTANT: 记得写好Application.java文件，SpringBoot配置文件采用yaml格式使用");
    return promptArr;
  }
  