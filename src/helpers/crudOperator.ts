export const crudOperator = <T extends { [key: string]: unknown }>(
  service,
  item: T,
) => {
  const parsedItem: T = cloneItem(item);

  return {
    create: async (): Promise<T & { uuid: string }> => createPage(service, parsedItem),
    update: async (item) => updatePage(service, parsedItem.uuid, item),
    delete: async () => deletePage(service, parsedItem),
    findOne: async (): Promise<T> => findOnePage(service, parsedItem.uuid),
  };
};

const createPage = async (service, item) => {
  return await service.store(item);
};

const updatePage = async (service, uuid, item) => {
  return await service.update(uuid, item);
};

const deletePage = async (service, item) => {
  return await service.delete(item.uuid);
};

const findOnePage = async (service, uuid) => {
  return await service.findOne({ uuid });
};

const cloneItem = (item) => {
  return JSON.parse(JSON.stringify(item));
};
