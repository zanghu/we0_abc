import { promptExtra } from "./prompt";

export const databaseeFunctionRegister = {
    "mysql":resolveMySql
  }

  function resolveMySql(extra:promptExtra){
    let promptArr = [];
    let username = extra.extra['databaseUsername']??"root";
    let password = extra.extra['databasePassword']??"root";
    let databaseUrl = extra.extra['databaseUrl']??"localhost:3306";
    promptArr.push("IMPORTANT: 根据前端的代码，并且将SQL文件放到SQL文件夹下，实现sql语句，写好数据库创建语句和创表语句，并且写几个样例数据刷到数据库");
    promptArr.push(`IMPORTANT: 使用Mysql做数据库,Mysql的Url为${databaseUrl},账号为${username},密码为${password},把他写入到后端配置中。`);
    return promptArr;
  }