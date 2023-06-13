import { AppStateModel } from "~models/appState.model";
import create from "zustand/vanilla";
import { BaseModel } from "~models/base.model";

export const store = create<AppStateModel>(() => ({
  finishedBooting: false,
  defaultLanguageCode: 'en',
  defaultLanguage: {code: 'en', name: 'English', uuid:''},
  gates: [],
  userPreferences: {},
  activeComponents: [],
  languages: [],
  exportProviders: [],
  models: {},
  configs: {},
}));

export const AppStateActions = {
  setModel:(modelName: string, payload: typeof BaseModel) => {
    const models = store.getState().models;
    models[modelName] = payload;
    store.setState({models})
  },
  setModels: (models: typeof BaseModel[]) => {
    models.forEach(model => {
      AppStateActions.setModel(model.name, model)
    });
  },
  setConfig: (name: string, config: any, merge = false) => {
    const configs = store.getState().configs;

    if (!merge) {
      configs[name] = config;
      store.setState({ configs });
      return;
    }

    configs[name] = { ...configs[name], ...config };
    store.setState({ configs });
  },
};

export function getStoreProperty(key: string, obj?: any) {
  if (!key.includes('.') && !obj) {
    return store.getState()[key];
  }

  const keys = key.split('.'); // Split the key into an array of nested keys

  if (!obj) {
    obj = store.getState(); // Get the object to get the property from
  }

  if (keys.length === 1 && obj[keys[0]]) {
    return obj[key]; // Base case: Return the property value
  }

  const currentKey = keys.shift(); // Remove the current key from the array
  const nestedObject = obj[currentKey]; // Access the nested object

  if (!nestedObject) {
    return undefined; // Property not found, return undefined or handle the error
  }

  return getStoreProperty(keys.join('.'), nestedObject); // Recursive call with the remaining keys
}
