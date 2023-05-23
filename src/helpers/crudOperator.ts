import { IGenericObject } from '~models/general';

export const crudOperator = <T extends { [key: string]: unknown } & { uuid?: string }>(service, item: T) => {
  const parsedItem: T = cloneItem(item);

  return {
    create: async (
      userId?: string,
      relationships?: Array<{
        id: string;
        name: string;
        relationshipProps?: IGenericObject;
      }>,
    ): Promise<T & { uuid: string }> => {
      const item = await createItem(service, parsedItem, userId, relationships);
      parsedItem.uuid = item.uuid;

      return item;
    },
    update: async (item) => updateItem(service, parsedItem.uuid, item),
    delete: async () => deleteItem(service, parsedItem),
    findOne: async (): Promise<T> => findOneItem(service, parsedItem.uuid),
  };
};

const createItem = async (
  service,
  item,
  userId?: string,
  relationships?: Array<{
    id: string;
    name: string;
    relationshipProps?: IGenericObject;
  }>,
) => {
  return await service.store(item, userId, relationships);
};

const updateItem = async (service, uuid, item) => {
  return await service.update(uuid, item);
};

const deleteItem = async (service, item) => {
  return await service.delete(item.uuid);
};

const findOneItem = async (service, uuid) => {
  return await service.findOne({ uuid });
};

const cloneItem = (item) => {
  return JSON.parse(JSON.stringify(item));
};
