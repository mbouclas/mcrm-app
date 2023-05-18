import { Injectable } from '@nestjs/common';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IBaseFilter, IGenericObject } from '~models/general';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { findIndex, sortBy } from 'lodash';
import { isInt } from 'neo4j-driver';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { BaseTreeModel } from '~models/generic.model';
import { Neo4jService } from '~root/neo4j/neo4j.service';
import { BaseModel } from '../../models/base.model';
import { store } from '~root/state';

@Injectable()
export class BaseNeoTreeService extends BaseNeoService {
  async cleanTree() {
    const query = `MATCH (${this.model.modelConfig.select}) DETACH DELETE ${this.model.modelConfig.as} RETURN *`;
    await this.neo.write(query);
    return true;
  }

  async createTree(tree: BaseTreeModel, relationship: string) {
    let currentIndex = 0;
    let queue: any = [tree];

    let nextQueue = [];
    let allTreeUuids = [];

    while (queue && queue.length) {
      const currentChild = queue[currentIndex];
      let { children, set, ...currentChildItem } = currentChild;
      let parentUuid;

      if (currentChildItem.parentUuid) {
        parentUuid = currentChildItem.parentUuid;
        delete currentChildItem.parentUuid;
      }

      currentChildItem = currentChildItem.uuid ? currentChildItem : await this.store(currentChildItem);

      parentUuid && (await this.attachToModelById(parentUuid, currentChildItem.uuid, relationship));

      allTreeUuids = [...allTreeUuids, currentChildItem.uuid];

      if (children && children.length) {
        children.forEach((child) => {
          nextQueue.push({
            ...child,
            parentUuid: currentChildItem.uuid,
          });
        });
      }

      if (currentIndex === queue.length - 1) {
        queue = nextQueue;
        nextQueue = [];
        currentIndex = 0;
      } else {
        currentIndex += 1;
      }
    }

    await this.deleteExcept(allTreeUuids);

    return true;
  }

  async findAncestors(uuid: string) {
    const query = `MATCH (${this.model.modelConfig.select} {uuid: $uuid}) 
        WITH ${this.model.modelConfig.as}, [(${this.model.modelConfig.as})<-[:HAS_CHILD*]-(x) | x] as ancestors
        return *`;
    const res = await this.neo.readWithCleanUp(query, { uuid });

    const ancestors = res[0]['ancestors'];
    if (!ancestors.length || ancestors.length === 0) {
      return [];
    }

    return ancestors;
  }

  async findDescendants(uuid: string) {
    const query = `MATCH (${this.model.modelConfig.select} {uuid: $uuid}) 
        WITH ${this.model.modelConfig.as},[(x)<-[:HAS_CHILD*]-(${this.model.modelConfig.as}) | x] as descendants
        return *`;

    const res = await this.neo.readWithCleanUp(query, { uuid });
    const descendants = res[0]['descendants'];
    if (!descendants.length || descendants.length === 0) {
      return [];
    }

    return descendants;
  }

  async getParentAndChildren(uuid: string) {
    const query = `MATCH (parent:${this.model.modelName} {uuid: $uuid})
        WITH parent, [(x)<-[:HAS_CHILD*]-(parent) | x] as descendants
        return parent, descendants`;

    const res = await this.neo.readWithCleanUp(query, { uuid });

    let descendants = res[0].descendants;
    let parent = res[0].parent;

    if (!descendants.length || descendants.length === 0) {
      parent.children = [];
      return parent;
    }

    const flatList = this.flattenTree(descendants).map((node: any) => node);

    const uuids = flatList.map((node) => node.uuid);

    const extraQuery = `MATCH (a:${this.model.modelName}) WHERE a.uuid IN $uuids

        RETURN a`;
    const extrasResult = await this.neo.readWithCleanUp(extraQuery, { uuids });
    const extras = sortBy(
      extrasResult.map((r: any) => {
        let category = r.a;
        return category;
      }),
      'order',
    );

    flatList.forEach((item, index) => {
      const idx = findIndex(extras, { uuid: item.uuid });
      if (idx === -1) {
        flatList.splice(index, 1);
        return;
      }
      try {
        Object.keys(extras[idx]).forEach((key) => (item[key] = extras[idx][key])); // Overwrite keys
      } catch (e) {
        console.log(e);
        console.log(idx, item);
      }
    });

    const sortTree = (tree: any) => {
      tree.forEach((child: any) => {
        if (isInt(child.order)) {
          child.order = child.order.toNumber();
        }
        if (Array.isArray(child.children)) {
          child.children = sortTree(child.children);
        }
      });

      return sortBy(tree, 'order');
    };

    parent.children = sortTree(descendants);

    return parent;
  }

  async getRootTree(limitChildrenTo = 10, withAncestors = false) {
    const limitQuery = limitChildrenTo === 0 ? '' : `LIMIT ${limitChildrenTo}`;
    const query = `match (a:${this.model.modelName})
                        WHERE NOT (a)<-[:HAS_CHILD]-()
                        CALL apoc.cypher.run('
                        WITH $a as a
                        OPTIONAL MATCH (a)-[:HAS_CHILD*1..5]->(b:${this.model.modelName})
                         OPTIONAL MATCH (b)<-[:HAS_CHILD*1..5]-(p) where p.slug <> b.slug
                        with b,p
 
                        return coalesce(b) as category, coalesce(collect(distinct p)) as parents ORDER BY $a.title ${limitQuery}
                        ',{a:a}) YIELD value

          return a, collect(distinct value) as children;`;

    const res = await this.neo.readWithCleanUp(query, {});

    return sortBy(
      res.map((r: any) => {
        let category = r.a;

        const children = r['children'];

        // This stupid check is for when there's no children and the query returns children: [{category: null}]. It happens on root categories mainly
        if (children.length === 1 && !children[0]) {
          return category;
        }

        category.children = sortBy(
          children.map((child) => {
            return {
              ...child.category,
              ...{ parents: child.parents },
            };
          }),
          'order',
        );

        return category;
      }),
      'order',
    );
  }

  async updateTree(tree: BaseTreeModel[]) {
    const buildChildQueries = (children: BaseTreeModel[], parent: BaseTreeModel, idx = 0) => {
      let queries: string[] = [];
      const parentVarName = parent.uuid.replace(/-/g, '_');
      queries.push(
        `MATCH (p_${parentVarName}:${this.model.modelName} {slug:'${parent.slug}'}) SET p_${parentVarName}.order = ${idx} WITH *`,
      );
      children.forEach((child, index) => {
        const childVarName = child.uuid.replace(/-/g, '_');
        queries.push(`MATCH (c_${childVarName}:${this.model.modelName} {slug:'${child.slug}'}) 
               MERGE (p_${parentVarName})-[r_${childVarName}:HAS_CHILD]->(c_${childVarName})
               ON CREATE SET r_${childVarName}.createdAt = datetime(), c_${childVarName}.order = ${index}
               ON MATCH SET r_${childVarName}.updatedAt = datetime(), c_${childVarName}.order = ${index}
               `);
        queries.push(' WITH * ');
        if (Array.isArray(child.children) && child.children.length > 0) {
          queries = [...queries, ...buildChildQueries(child.children, child, idx + 1)];
        }
      });

      return queries;
    };

    const traverseTree = (tree: BaseTreeModel[]) => {
      let q: string[] = [];
      tree.forEach((node, index) => {
        if (Array.isArray(node.children)) {
          q = [...q, ...buildChildQueries(node.children, node, index)];
        } else {
          const parentVarName = node.uuid.replace(/-/g, '_');
          // These are orphan nodes
          q.push(
            `MATCH (p_${parentVarName}:${this.model.modelName} {uuid:'${node.uuid}'}) SET p_${parentVarName}.order = ${index} WITH *`,
          );
        }
      });

      return q.join('\n');
    };

    // Step 1. Drop all previous relationships
    const dropQuery = `MATCH (n:${this.model.modelName})-[r:HAS_CHILD]-(m:${this.model.modelName}) DELETE r`;
    await this.neo.write(dropQuery, {});

    // Step 2. Rebuild relationships during tree traversal
    try {
      const query = `${traverseTree(tree)}
        RETURN *`;

      // console.log(query)

      await this.neo.write(query, {});
    } catch (e) {
      console.log(e);
    }

    return tree;
  }

  async addChildToParent(parentFilter: IGenericObject, childFilter: IGenericObject) {
    const p = extractSingleFilterFromObject(parentFilter);
    const c = extractSingleFilterFromObject(childFilter);
    const query = `
    MATCH (parent:${this.model.modelName}) where parent.${p.key} =~ $parentFilterValue
    MATCH (child:${this.model.modelName}) where child.${c.key} =~ $childFilterValue
    MERGE (parent)-[r:HAS_CHILD]->(child) ON CREATE SET r.createdAt = datetime() ON MATCH SET r.updatedAt = datetime()
    return *;
    `;

    const res = await this.neo.write(query, {
      parentFilterValue: p.value,
      childFilterValue: c.value,
    });

    return res.records.map((rec) => Neo4jService.processRecord(rec));
  }

  async moveNode(filter: IBaseFilter, parentFilter?: IBaseFilter) {
    // locate the node and delete the old relationship to either parent or child
    // Add the node to the new parent, can be root if no parent is given
  }

  flattenTree(array: any[]) {
    let result: IGenericObject[] = [];
    array.forEach(function (a) {
      result.push(a);
      if (Array.isArray(a.children)) {
        result = result.concat(this.flattenTree(a.children));
      }
    });
    return result;
  }
}
