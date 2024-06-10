import { join } from "path";
import { projectRoot } from "~root/main";
import { Logger as WinstonLogger } from "winston";

const winston = require('winston');

export function logToFile(): WinstonLogger {
  // new file with date time as filename
  const fileName = `${new Date().toISOString().replace(/:/g, '-')}`
  return winston.createLogger({
    transports: [

      new winston.transports.File({ filename: join(projectRoot, 'logs', `${fileName}.log`) })
    ]
  });
}
