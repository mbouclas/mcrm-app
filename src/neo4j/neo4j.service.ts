import neo4j, {
  Result,
  Driver,
  int,
  Transaction,
  isInt,
  isDateTime,
} from 'neo4j-driver';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { Neo4jConfig } from './neo4j-config.interface';
import { NEO4J_CONFIG, NEO4J_DRIVER } from './neo4j.constants';
import {
  isNode,
  isRelationship,
  Transaction as TransactionImpl,
} from 'neo4j-driver-core';
import { parseDate } from '../helpers/neoDateToMoment';
import { defaultNeo4JConfig, Neo4jModule } from '~root/neo4j/neo4j.module';
import { IGenericObject } from '~models/general';
import { fromRecordToModel } from '~helpers/fromRecordToModel';
import { store } from '~root/state';

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

  read(
    cypher: string,
    params?: Record<string, any>,
    databaseOrTransaction?: string | Transaction,
  ): Result {
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

  async writeWithCleanUp(
    cypher: string,
    params?: Record<string, any>,
    databaseOrTransaction?: string | Transaction,
  ) {
    const res = await this.write(cypher, params, databaseOrTransaction);
    if (Array.isArray(res.records) && res.records.length === 0) {
      return [];
    }

    return res.records.map((rec) => {
      return Neo4jService.processRecord(rec);
    });
  }

  write(
    cypher: string,
    params?: Record<string, any>,
    databaseOrTransaction?: string | Transaction,
  ): Result {
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
    for (let key in obj) {
      let item = obj[key];

      if (Array.isArray(item)) {
        obj[key] = item.map((i) => Neo4jService.parseNeoProperties(i));
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
      return r.properties
        ? Neo4jService.parseNeoProperties(r.properties)
        : Neo4jService.parseNeoProperties(r);
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
      return r.properties
        ? Neo4jService.parseNeoProperties(r.properties)
        : Neo4jService.parseNeoProperties(r);
    }
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

    let parentKey = model.modelConfig.as;

    if (!record) {
      return null;
    }

    const obj: IGenericObject = fromRecordToModel(record[parentKey], model);

    if (!obj) {
      return record;
    }
    for (let key in record) {
      if (key === parentKey) {
        continue;
      }

      const returnKey = aliasKeyMap[key];

      const relModel =
        store.getState().models[
          model.modelConfig.relationships[returnKey].model
        ];

      const isCollection =
        model.modelConfig.relationships[returnKey].isCollection;

      if (relModel) {
        if (record[key]) {
          if (isCollection) {
            obj[key] = record[key].map((r) => fromRecordToModel(r, relModel));
          } else {
            obj[key] = fromRecordToModel(record[key], relModel);
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
}
