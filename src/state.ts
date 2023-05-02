import { AppStateModel } from "./models/appState.model";
import create from "zustand/vanilla";
import { BaseModel } from "./models/base.model";

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
