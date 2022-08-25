import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";

export interface IConditionRules {

}

export interface IConditionAction {
  value: string;
  inclusive: boolean;
}

export interface IConditionCollection2 {
  rules?: IConditionRules[];
  actions?: IConditionAction[];
  result?: number;
  subtotal?: number;
}

export interface IConditionCollection {
  name: string;
  type: 'tax'|'shipping'
  target: 'subtotal'|'price'|'total'|'promo'|'mix';
  value: string;
  order?: number;
}

@McmsDi({
  id: 'Condition',
  type: "class"
})
@Injectable()
export class Condition {
  constructor(public collection: IConditionCollection) {
  }

  apply(collection, target) {

  }
}
