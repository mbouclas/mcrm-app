import { ModelGeneratorService } from "./model-generator.service";
import { BaseModel } from "../../models/base.model";
const modelString = `{"name":"Test","isDynamic":true,"modelConfig":"{\\"select\\":\\"test:Test\\",\\"as\\":\\"test\\",\\"relationships\\":{\\"business\\":{\\"rel\\":\\"HAS_TEST_REL\\",\\"alias\\":\\"testRelationship\\",\\"model\\":\\"Business\\",\\"modelAlias\\":\\"business\\",\\"type\\":\\"inverse\\",\\"isCollection\\":false}}}","injectRelationships":"{\\"Business\\":{\\"test\\":{\\"rel\\":\\"HAS_TEST\\",\\"alias\\":\\"testRelationship\\",\\"model\\":\\"Test\\",\\"modelAlias\\":\\"test\\",\\"type\\":\\"normal\\",\\"isCollection\\":false,\\"isSortable\\":true,\\"orderByKey\\":\\"code\\",\\"defaultProperty\\":\\"code\\"}}}","uuid":"b3f6e53b-5c9b-44a6-ad74-793a23b4441e","filterConfig":"{\\"filterParamName\\":\\"q\\",\\"defaultOrderBy\\":\\"name\\",\\"defaultWay\\":\\"ASC\\"}","fields":[{"varName":"website","label":"Website","placeholder":"Website","type":"text","uuid":"b420787c-6043-42ef-abe7-cae356bfa205","updatedAt":"2021-03-23T10:38:04.221Z"},{"varName":"name","placeholder":"Name","label":"Name","type":"text","uuid":"52dae06b-afcd-49a4-bcb3-7074728f76b4","updatedAt":"2021-05-26T04:51:47.293Z"}],"filterFields":[]}`
const dummyModel = JSON.parse(modelString);

// dummyModel.fields = JSON.parse(dummyModel.fields);
// dummyModel.filterFields = JSON.parse(dummyModel.filterFields);
// dummyModel.modelConfig = JSON.parse(dummyModel.modelConfig);

describe('ModelGeneratorService', () => {
  it("should Create a new static class from a model config", () => {
    const m = new ModelGeneratorService(dummyModel);

    expect(Object.getPrototypeOf(m.staticClass).name).toEqual(BaseModel.name);
  });
});
