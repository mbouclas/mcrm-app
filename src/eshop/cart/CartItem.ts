import { ICartItem } from "~eshop/cart/cart.service";
import { IGenericObject } from "~models/general";
import { Condition } from "~eshop/cart/Condition";


export class CartItem implements ICartItem {
  conditions: Condition[] = [];
  metaData: IGenericObject = {};
  price: number;
  productId: string;
  quantity: number;
  sku: string;
  slug: string;
  thumb: string;
  title: string;
  uuid: string;
  variantId: string;

  constructor(args: ICartItem) {
    for (let key in args) {
      if (args.hasOwnProperty(key)) {
        this[key] = args[key];
      }
    }

    if (Array.isArray(this.conditions) && this.conditions.length > 0) {
      this.conditions = this.conditions.map(c => {
        if (c instanceof Condition) {
          return c;
        }

        return new Condition(c);
      });
    } {

    }
  }

  public getPriceSum(): number {
    return this.price * this.quantity;
  }

  public getConditions(): Condition[] {
    return this.conditions;
  }

  public setConditions(conditions: Condition[]): CartItem {
    this.conditions = conditions;
    return this;
  }

  public hasConditions(): boolean {
    return this.conditions.length > 0;
  }

  public getMetaData(): IGenericObject {
    return this.metaData;
  }

  /**
   * get the single price in which conditions are already applied
   */
  public getPriceWithConditions() {
    let originalPrice = this.price,
    newPrice = 0.00,
    processed = 0;

    if (!this.hasConditions()) {
      return originalPrice;
    }

    this.conditions.forEach((condition) => {
      const toBeCalculated = (processed > 0) ? newPrice : originalPrice;
      newPrice = condition.applyCondition(toBeCalculated);
      processed++;
    });

    return newPrice * this.quantity;
  }

  public getPriceWithoutConditions() {
    return this.price * this.quantity;
  }
}
