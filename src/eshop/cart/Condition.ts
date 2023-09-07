import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { z } from 'zod';
import {Helpers} from "~eshop/cart/helpers/helpers";
import { IGenericObject } from "~models/general";

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

export interface IConditionArgsConfig {
  name: string;
  type: 'tax'|'shipping';
  target: 'subtotal'|'price'|'total'|'promo'|'mix'|'item';
  value: string;
  order?: number;
  attributes?: IGenericObject;
}

@McmsDi({
  id: 'Condition',
  type: "class"
})
@Injectable()
export class Condition {
  public parsedRawValue: any; //the parsed raw value of the condition
  public name: string;
  public type: string;
  public target: string;
  public value: string;
  public order: number;
  public attributes: IGenericObject = {};

  constructor(protected args: IConditionArgsConfig) {
    this.validate(args);
  }

  getTarget(): string {
    return this.args['target'] ? this.args['target'] : '';
  }

  getName(): string {
    return this.args['name'];
  }

  getType(): string {
    return this.args['type'];
  }

  getAttributes(): IGenericObject {
    return this.args['attributes'] ? this.args['attributes'] : {};
  }

  getValue(): any {
    return this.args['value'];
  }

  setOrder(order: number = 1) {
    this.args['order'] = order;
  }

  getOrder(): number {
    return (typeof this.args['order'] === 'number') ? this.args['order'] : 0;
  }

  applyCondition(totalOrSubTotalOrPrice: number): number {
    return this.apply(totalOrSubTotalOrPrice, this.getValue());
  }

  protected apply(totalOrSubTotalOrPrice: number, conditionValue: any): number {
    // if value has a percentage sign on it, we will get first
    // its percentage then we will evaluate again if the value
    // has a minus or plus sign so we can decide what to do with the
    // percentage, whether to add or subtract it to the total/subtotal/price
    // if we can't find any plus/minus sign, we will assume it as plus sign

    let result: number;

    // If the value contains a percentage sign, calculate its effect based on whether
    // the condition is to add or subtract. If neither, assume addition.
    if (this.valueIsPercentage(conditionValue)) {
      if (this.valueIsToBeSubtracted(conditionValue)) {
        const value = Helpers.normalizePrice(this.cleanValue(conditionValue));
        this.parsedRawValue = totalOrSubTotalOrPrice * (value / 100);
        result = totalOrSubTotalOrPrice - this.parsedRawValue;
      }
      else if (this.valueIsToBeAdded(conditionValue)) {
        const value = Helpers.normalizePrice(this.cleanValue(conditionValue));
        this.parsedRawValue = totalOrSubTotalOrPrice * (value / 100);
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
      }
      else {
        const value = Helpers.normalizePrice(conditionValue);
        this.parsedRawValue = totalOrSubTotalOrPrice * (value / 100);
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
      }
    }

    // If the value does not contain a percentage sign, directly add or subtract based on condition.
    else {
      if (this.valueIsToBeSubtracted(conditionValue)) {
        this.parsedRawValue = Helpers.normalizePrice(this.cleanValue(conditionValue));
        result = totalOrSubTotalOrPrice - this.parsedRawValue;
      }
      else if (this.valueIsToBeAdded(conditionValue)) {
        this.parsedRawValue = Helpers.normalizePrice(this.cleanValue(conditionValue));
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
      }
      else {
        this.parsedRawValue = Helpers.normalizePrice(conditionValue);
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
      }
    }

    // Ensure no negative prices.
    return result < 0 ? 0.00 : result;
  }

  protected valueIsPercentage(value: string): boolean {
    return /%/.test(value);
  }

  protected valueIsToBeSubtracted(value: string): boolean {
    return /-/.test(value);
  }

  protected valueIsToBeAdded(value: string): boolean {
    return /\+/.test(value);
  }

  protected cleanValue(value: string): string {
    return value.replace(/[%+-]/g, '');
  }

  protected validate(args: IConditionArgsConfig) {
    const rules = z.object({
      name: z.string().min(1, 'Name is required'),
      type: z.string().min(1, 'Type is required'),
      value: z.string().min(1, 'Value is required'),
      target: z.string().min(1, 'Target is required'),
    })

    try {
      rules.parse(args);
    }
    catch (e) {
      if (e instanceof z.ZodError) {
        throw new Error(e.issues[0].message);
      }
    }

    for (const key in args) {
      if (args.hasOwnProperty(key)) {
        this[key] = args[key];
      }
    }

    return true;
  }
}
