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
  }
};
