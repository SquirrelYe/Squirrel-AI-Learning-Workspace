import winston from 'winston';

// 创建 logger
export const logger = winston.createLogger({
  level: 'info', // 默认日志级别
  format: winston.format.simple(), // 简单格式
  transports: [
    new winston.transports.Console() // 输出到控制台
  ]
});
