export const crudOperator = (service, item) => {
  const parsedItem = cloneItem(item);

  return {
    create: async () =>  createPage(service, parsedItem),
    update: async (item) => updatePage(service, parsedItem.uuid, item),
    delete: async () => deletePage(service, parsedItem),
    findOne: async () => findOnePage(service, parsedItem.uuid),
  }
}

const createPage = async(service, item) => {
  return await service.store(item);
}

const updatePage = async(service, uuid, item) => {
  return await service.update(uuid, item);
}

const deletePage = async (service, item) => {
  return await service.delete(item.uuid);
}

const findOnePage = async (service, uuid) => {
  return await service.findOne({ uuid })
}


const cloneItem  = (item) => {
  return JSON.parse(JSON.stringify(item));
}

