import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import {  z } from "zod";
import {Helpers} from "~eshop/cart/helpers/helpers";
import { IGenericObject } from "~models/general";
import { ConditionRule } from "~eshop/cart/ConditionRule";
import { Cart } from "~eshop/cart/Cart";
import { CartItem } from "~eshop/cart/CartItem";
import { v4 } from "uuid";

export interface IConditionArgsConfig {
  uuid?: string;
  title: string;
  type: 'tax'|'shipping'|'coupon'|'sale'|'promo';
  target: 'subtotal'|'price'|'total'|'quantity'|'numberOfItems'|'item'|'shipping';
  value: string;
  order?: number;
  attributes?: IGenericObject;
  rules?: ConditionRule[];
}

@McmsDi({
  id: 'Condition',
  type: "class"
})
@Injectable()
export class Condition {
  public parsedRawValue: any; //the parsed raw value of the condition
  public uuid: string;
  public title: string;
  public type: string;
  public target: string;
  public value: string;
  public order: number;
  public rules: ConditionRule[] = [];
  public parsedRawValueType: {type: string, operator: string} = {type: "fixed", operator: "add" };
  public attributes: IGenericObject = {};

  constructor(protected args: IConditionArgsConfig) {
    if (args.rules) {
      this.rules = args.rules.map((rule) => {
        if (rule instanceof ConditionRule) {
          return rule;
        }

        return new ConditionRule(rule);
      });
    }



    this.validate(args);
  }

  protected validationRules() {
    return z.object({
      title: z.string().min(1, 'Name is required'),
      type: z.string().min(1, 'Type is required'),
      value: z.string().min(1, 'Value is required'),
      target: z.string().min(1, 'Target is required'),
    });
  }

  getId(): string {
    return this.args['uuid'];
  }

  getTarget(): string {
    return this.args['target'] ? this.args['target'] : '';
  }

  getName(): string {
    return this.args['title'];
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

  /**
   * Checks if the object has rules defined.
   *
   * @return {boolean} - Returns true if the object has rules, false otherwise.
   */
  public hasRules(): boolean {
    return (Array.isArray(this.rules) && this.rules.length > 0);
  }

  /**
   * Validates the cart rules.
   *
   * @param {Cart} cart - The cart to be validated.
   * @return {boolean} - `true` if all cart rules are valid, `false` otherwise.
   */
  public validateCartRules(cart: Cart): boolean {
    let isValid = true;

    for (let i = 0; i < this.rules.length; i++) {
      const rule = (!(this.rules[i] instanceof ConditionRule)) ? new ConditionRule(this.rules[i]) : this.rules[i];
      // if the rule is valid

      if (!rule.validate(typeof rule.field === 'function' ? rule.field(cart) : cart[rule.field])) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Validates the item rules based on the provided CartItem object.
   *
   * @param {CartItem} item - The CartItem object to validate.
   * @return {boolean} - True if all rules are valid, otherwise false.
   */
  public validateItemRules(item: CartItem): boolean {
    let isValid = true;

    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i];
      // if the rule is valid

      if (!rule.validate(typeof rule.field === 'function' ? rule.field(item) : item[rule.field])) {
        isValid = false;
      }
    }

    return isValid;
  }

  public isValid() {

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
        this.parsedRawValueType = {type: "percentage", operator: "subtract" };
      }
      else if (this.valueIsToBeAdded(conditionValue)) {
        const value = Helpers.normalizePrice(this.cleanValue(conditionValue));
        this.parsedRawValue = totalOrSubTotalOrPrice * (value / 100);
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
        this.parsedRawValueType = {type: "percentage", operator: "add" };
      }
      else {
        const value = Helpers.normalizePrice(conditionValue);
        this.parsedRawValue = totalOrSubTotalOrPrice * (value / 100);
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
        this.parsedRawValueType = {type: "percentage", operator: "add" };
      }
    }

    // If the value does not contain a percentage sign, directly add or subtract based on condition.
    else {
      if (this.valueIsToBeSubtracted(conditionValue)) {
        this.parsedRawValue = Helpers.normalizePrice(this.cleanValue(conditionValue));
        result = totalOrSubTotalOrPrice - this.parsedRawValue;
        this.parsedRawValueType = {type: "fixed", operator: "subtract" };
      }
      else if (this.valueIsToBeAdded(conditionValue)) {
        this.parsedRawValue = Helpers.normalizePrice(this.cleanValue(conditionValue));
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
        this.parsedRawValueType = {type: "fixed", operator: "add" };
      }
      else {
        this.parsedRawValue = Helpers.normalizePrice(conditionValue);
        result = totalOrSubTotalOrPrice + this.parsedRawValue;
        this.parsedRawValueType = {type: "fixed", operator: "add" };
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
    const rules = this.validationRules();

    try {
      rules.parse(args);
    }
    catch (e) {
      if (e instanceof z.ZodError) {
        console.log('--------------------------------',e.issues[0], e.issues[0].path)
        throw new Error(e.issues[0].message);
      }
    }

    if (!this.args['uuid']) {
      this.args['uuid'] = v4();
    }

    for (const key in args) {
      if (args.hasOwnProperty(key)) {
        this[key] = args[key];
      }
    }

    return true;
  }

}
