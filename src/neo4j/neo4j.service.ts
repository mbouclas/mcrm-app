import neo4j, { Result, Driver, int, Transaction, isInt, isDateTime } from 'neo4j-driver';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { Neo4jConfig } from './neo4j-config.interface';
import { NEO4J_CONFIG, NEO4J_DRIVER } from './neo4j.constants';
import { isNode, isRelationship, Transaction as TransactionImpl } from 'neo4j-driver-core';
import { parseDate } from '../helpers/neoDateToMoment';
import { defaultNeo4JConfig, Neo4jModule } from '~root/neo4j/neo4j.module';
import { IGenericObject } from '~models/general';
import { fromRecordToModel } from '~helpers/fromRecordToModel';
import { store } from '~root/state';
import { createWriteStream, existsSync, mkdirSync } from "fs";
import * as path from "path";
import { SharedModule } from "~shared/shared.module";

export enum Neo4jEventNames {
  BACKUP_STARTED = 'BACKUP.STARTED',
  BACKUP_COMPLETED = 'BACKUP.COMPLETED',
  RESTORE_STARTED = 'RESTORE.STARTED',
  RESTORE_COMPLETED = 'RESTORE.COMPLETED',
}

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  protected driver: Driver;
  public static driverInstance: Driver;

  constructor(@Inject(NEO4J_CONFIG) private readonly config?: Neo4jConfig) {
    this.config = config ? config : defaultNeo4JConfig;
    this.driver = Neo4jService.driverInstance;
  }

  setDriver(driver: Driver) {
    this.driver = driver;
  }

  getDriver(): Driver {
    return this.driver;
  }

  getConfig(): Neo4jConfig {
    return this.config;
  }

  int(value: number) {
    return int(value);
  }

  beginTransaction(database?: string): Transaction {
    const session = this.getWriteSession(database);

    return session.beginTransaction();
  }

  getReadSession(database?: string) {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: neo4j.session.READ,
    });
  }

  getWriteSession(database?: string) {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: neo4j.session.WRITE,
    });
  }

  read(cypher: string, params?: Record<string, any>, databaseOrTransaction?: string | Transaction): Result {
    if (databaseOrTransaction instanceof TransactionImpl) {
      return (<Transaction>databaseOrTransaction).run(cypher, params);
    }

    const session = this.getReadSession(<string>databaseOrTransaction);
    return session.run(cypher, params);
  }

  async readWithCleanUp(
    cypher: string,
    params?: Record<string, any>,
    databaseOrTransaction?: string | Transaction,
  ): Promise<any> {
    const res = await this.read(cypher, params, databaseOrTransaction);

    if (Array.isArray(res.records) && res.records.length === 0) {
      return [];
    }

    return res.records.map((rec) => {
      return Neo4jService.processRecord(rec);
    });
  }

  async writeWithCleanUp(cypher: string, params?: Record<string, any>, databaseOrTransaction?: string | Transaction) {
    const res = await this.write(cypher, params, databaseOrTransaction);
    if (Array.isArray(res.records) && res.records.length === 0) {
      return [];
    }

    return res.records.map((rec) => {
      return Neo4jService.processRecord(rec);
    });
  }

  write(cypher: string, params?: Record<string, any>, databaseOrTransaction?: string | Transaction): Result {
    if (databaseOrTransaction instanceof TransactionImpl) {
      return (<Transaction>databaseOrTransaction).run(cypher, params);
    }

    const session = this.getWriteSession(<string>databaseOrTransaction);
    return session.run(cypher, params);
  }

  onApplicationShutdown() {
    return this.driver.close();
  }

  static parseNeoProperties(obj) {
    for (const key in obj) {
      const item = obj[key];

      if (Array.isArray(item)) {
        obj[key] = item.map((i) => {
          if (isNode(i)) {
            return Neo4jService.parseNeoProperties(i.properties);
          }

          return Neo4jService.parseNeoProperties(i);
        });
      }

      if (!Array.isArray(item) && isNode(item)) {
        obj[key] = Neo4jService.parseNeoProperties(item.properties);
      }

      if (!Array.isArray(item) && isRelationship(item)) {
        obj[key] = Neo4jService.parseNeoProperties(item.properties);
      }

      if (isInt(item)) {
        obj[key] = item.toNumber();
      }

      if (isDateTime(item)) {
        obj[key] = parseDate(item);
      }
    }

    return obj;
  }

  static processRecord(rec: Record<any, any>) {
    const obj = {};

    for (let idx = 0; rec.keys.length > idx; idx++) {
      const key = rec.keys[idx];
      const r = rec.get(key);

      obj[key] = this.parseNodeResult(r, key);
    }

    return obj;
  }

  static parseNodeResult(r: any, key: string) {
    if (Array.isArray(r)) {
      const arr: any[] = [];
      for (let idx = 0; r.length > idx; idx++) {
        arr.push(Neo4jService.parseNodeResult(r[idx], key));
      }

      return arr;
    }

    if (!r) {
      return;
    }

    const keys = Object.keys(r);

    if (isNode(r) || isRelationship(r)) {
      if (isRelationship(r)) {
        // console.log('===',r.properties)
      }
      return r.properties ? Neo4jService.parseNeoProperties(r.properties) : Neo4jService.parseNeoProperties(r);
    } else if (isInt(r)) {
      return r.toNumber();
    }
    // This is for the case where we return nested objects. e.g [{category: {}}] instead of [{something: sd}]
    else if (keys.length === 1) {
      const masterKey = keys[0];
      if (!r[masterKey]) {
        return null;
      }
      return r[masterKey].properties
        ? Neo4jService.parseNeoProperties(r[masterKey].properties)
        : Neo4jService.parseNeoProperties(r);
    } else {
      return r.properties ? Neo4jService.parseNeoProperties(r.properties) : Neo4jService.parseNeoProperties(r);
    }
  }

  /**
   * Will merge all objects into one according to the parent key
   * @param record
   * @param parentKey
   */
  mergeRelationshipsToParentWithAlias(record: any, model: any, aliasKeyMap: any) {
    const parentKey = model.modelConfig.as;

    if (!record) {
      return null;
    }

    const obj: IGenericObject = fromRecordToModel(record[parentKey], model);

    if (!obj) {
      return record;
    }
    for (const key in record) {
      if (key === parentKey) {
        continue;
      }

      const returnKey = aliasKeyMap[key];

      if (!returnKey) {
        continue;
      }

      const relModel = store.getState().models[model.modelConfig.relationships[returnKey].model];

      const isCollection = model.modelConfig.relationships[returnKey].isCollection;

      if (relModel && record[key]) {
        if (isCollection) {
          if (!obj[returnKey]) {
            obj[returnKey] = [];
          }

          obj[returnKey] = [...obj[returnKey], fromRecordToModel(record[key], relModel)];
        } else {
          obj[returnKey] = fromRecordToModel(record[key], relModel);
        }
      }
    }

    return obj;
  }

  /**
   * Will merge all objects into one according to the parent key
   * @param record
   * @param parentKey
   */
  mergeRelationshipsToParent(record: any, model: any) {
    const modelRelKeys = Object.keys(model.modelConfig.relationships);

    const aliasKeyMap = modelRelKeys.reduce((acc, key) => {
      const alias = model.modelConfig.relationships[key].modelAlias;

      return {
        ...acc,
        [alias]: key,
      };
    }, {});

    const parentKey = model.modelConfig.as;

    if (!record) {
      return null;
    }

    const obj: IGenericObject = fromRecordToModel(record[parentKey], model);

    if (!obj) {
      return record;
    }
    for (const key in record) {
      if (key === parentKey || !aliasKeyMap[key]) {
        continue;
      }

      const returnKey = aliasKeyMap[key];

      const relModel = store.getState().models[model.modelConfig.relationships[returnKey].model];

      const isCollection = model.modelConfig.relationships[returnKey].isCollection;

      if (relModel) {
        if (record[key]) {
          if (isCollection) {
            obj[key] = record[key].map((r) => fromRecordToModel(r, relModel));
          } else {
            // If this is a count relationship or something like that, it will be a number, so we don't want to try to convert it to an object
            obj[key] =
              ['number', 'boolean', 'string'].indexOf(typeof record[key]) === -1
                ? fromRecordToModel(record[key], relModel)
                : record[key];
          }
        }
      }
    }

    return obj;
  }

  extractResultsFromArray(res: any[], model: any) {
    return res.map((r) => {
      return this.mergeRelationshipsToParent(r, model);
    });
  }

  async backupDb(filename?: string, databaseOrTransaction?: string) {
    return new Promise((resolve, reject) => {
      filename = filename || `backup-${Date.now()}.cypher`;
      // check if the backup folder exists
      // if not, create it
      const backupFolder = path.resolve('./backups');
      if (!existsSync(backupFolder)) {
        mkdirSync(backupFolder);
      }


      const outputStream = createWriteStream(path.resolve(backupFolder, filename));
      const session = this.getWriteSession(<string>databaseOrTransaction);
      SharedModule.eventEmitter.emit(Neo4jEventNames.BACKUP_STARTED );
      session.run(`
        CALL apoc.export.cypher.all(null, {format: "cypher-shell", stream: true, streamStatements: true, useOptimizations: {type: "UNWIND_BATCH", unwindBatchSize: 5}});`
      ).subscribe({
        onNext: record => {
          const data = record.get('cypherStatements');

          if (data) {
            outputStream.write(data);
          }
        },
        onCompleted: () => {
          outputStream.end();
          session.close();
          SharedModule.eventEmitter.emit(Neo4jEventNames.BACKUP_COMPLETED, {filename: path.resolve(backupFolder, filename)});
          resolve({
            success: true,
            filename
          });
        },
        onError: error => {
          console.error(error);
          outputStream.end();
          session.close();

          console.log(`ERROR BACKING UP DB`, error)
          reject({
            success: false,
            error
          });
        }
      });
    });

  }

  async clearDb(databaseOrTransaction?: string) {
    const session = this.getWriteSession(<string>databaseOrTransaction);

    // session.run(`MATCH (n) DETACH DELETE n;`);

    const resConstraints = await this.readWithCleanUp(`SHOW CONSTRAINTS;`)
    const constraints = resConstraints.map(r => r.name);
    for (const constraint of constraints) {
      // await session.run(`DROP CONSTRAINT ${constraint}; IF EXISTS`);
    }

    const resIndexes = await this.read(`SHOW INDEXES;`)
    const indexes = resIndexes.records.map(r => r.get('name'));
    for (const index of indexes) {
      // await session.run(`DROP INDEX ${index} IF EXISTS;`);
    }
    // session.run(`CALL apoc.schema.assert({}, {});`);


  }
}
