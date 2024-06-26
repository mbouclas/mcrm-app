import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { CartService, ICart, ICartItem } from '~eshop/cart/cart.service';
import { ICoupon } from '~eshop/cart/coupon.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { v4 } from 'uuid';
import { IBaseFilter, IGenericObject } from '~models/general';
import { Condition, IConditionArgsConfig } from "~eshop/cart/Condition";
import { find, findIndex, isEqual } from 'lodash';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { SharedModule } from '~shared/shared.module';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';
import { InvalidConditionTypeException } from "~eshop/cart/exceptions/invalid-condition-type.exception";
import { Helpers } from "~eshop/cart/helpers/helpers";
import { CartItem } from "~eshop/cart/CartItem";

export interface ICartSettings {
  formatNumbers: boolean;
  decimals: number;
  decPoint: string;
  thousandsSep: string;
}

@McmsDi({
  id: 'Cart',
  type: 'class',
})
@Injectable()
export class Cart implements OnModuleInit, ICart {
  protected eventEmitter: EventEmitter2;
  static itemAddedEventName = 'cart.item.added';
  static itemUpdatedEventName = 'cart.item.updated';
  static itemRemovedEventName = 'cart.item.removed';
  static itemMetaDataUpdatedEventName = 'cart.item.metaDataUpdated';
  static cartItemsUpdatedEventName = 'cart.items.updated';
  static cartSavedEventName = 'cart.saved';
  static cartClearedEventName = 'cart.cleared';
  static cartReadyEventName = 'cart.ready';
  public id;
  public total = 0;
  public subTotal = 0;
  public vatRate = 0;
  public shipping = 0;
  public items: CartItem[] = [];
  public metaData = {};
  public numberOfItems = 0;
  public appliedConditions: Condition[] = [];
  public couponApplied: ICoupon = {};
  public cartService: CartService;
  protected jsonFields = ['couponApplied', 'items', 'metaData', 'appliedConditions', 'conditions'];
  protected settingsDefaults: ICartSettings = {
    formatNumbers: false,
    decimals: 2,
    decPoint: '.',
    thousandsSep: ',',
  };
  protected settings: ICartSettings;
  public conditions: Condition[] = [];

  constructor(id?: string, settings?: ICartSettings) {
    this.cartService = new CartService();
    if (id) {
      this.id = id;
    }
    /*    this.initialize(id)
          .then(cart => {})
          .catch(err => console.log(err));*/
    this.eventEmitter = SharedModule.eventEmitter;
    this.setCartSettings(settings ? settings : this.settingsDefaults);
  }

  async onModuleInit() {}

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  public getCartDefaultSettings() {
    return this.settingsDefaults;
  }

  public getCartSettings() {
    return this.settings;
  }

  public add(item: ICartItem, overwriteQuantity = false) {
    let found;
    this.items.forEach((it) => {
      if (item.uuid) {
        found = it;
        return;
      }

      if (it.productId === item.productId && isEqual(item.metaData, it.metaData)) {
        found = it;
      }
    });


    if (!found) {
      this.items.push(new CartItem({ ...item, uuid: v4() }));
      this.count();
      this.updateTotals();

      return this;
    }

    if (item.quantity === 0) {
      this.remove({ productId: item.productId });
      this.count();
      this.updateTotals();

      this.eventEmitter.emit(Cart.itemAddedEventName, {
        item,
        cart: this.toObject(),
      });
      return this;
    }

    // The quantity needs to be adjusted based on the item being added
    if (!overwriteQuantity){
      found.quantity += item.quantity;
    }
    else {
      found.quantity = item.quantity;
    }


    this.count();
    this.updateTotals();

    this.eventEmitter.emit(Cart.itemAddedEventName, {
      item,
      cart: this.toObject(),
    });
    return this;
  }

  public remove(filter: IBaseFilter) {
    const { key, value } = extractSingleFilterFromObject(filter);

    const idx = findIndex(this.items, [key, value]);
    if (idx === -1) {
      throw new RecordNotFoundException('ProductNotFound');
    }

    const item = Object.assign({}, this.items[idx]);
    this.items.splice(idx, 1);
    this.updateTotals();

    this.eventEmitter.emit(Cart.itemRemovedEventName, {
      item,
      cart: this.toObject(),
    });
    return this;
  }

  public clear() {
    this.items = [];
    this.conditions = [];
    this.appliedConditions = [];
    this.updateTotals();

    this.eventEmitter.emit(Cart.cartClearedEventName, {
      cart: this.toObject(),
    });
    return this;
  }

  public async clearWithDb() {
    this.clear();
    await this.save();

    this.clear();
    return this;
  }

  public updateQuantity(filter: IBaseFilter, quantity = 1, appendToExisting = true) {
    const { key, value } = extractSingleFilterFromObject(filter);

    const item = find(this.items, [key, value]);

    item.quantity = appendToExisting ? item.quantity + quantity : (item.quantity = quantity);

    this.updateTotals();

    this.eventEmitter.emit(Cart.itemUpdatedEventName, {
      item,
      cart: this.toObject(),
    });
    return this;
  }

  public updateTotals() {
    this.calculateItemsTotal();
    this.calculateSubtotal();
    this.calculateTotals();
  }

  public isEmpty() {
    return this.items.length === 0;
  }

  public getItem(filter: IBaseFilter) {
    const { key, value } = extractSingleFilterFromObject(filter);

    return find(this.items, [key, value]);
  }

  public count() {
    this.numberOfItems = this.items.map((item) => item.quantity).reduce((pre, curr) => pre + curr, 0);
    return this.numberOfItems;
  }

  public async initialize(id?: string, userId?: string) {
    let cart;
    // Load a cart using the userID
    try {
      cart = await this.cartService.findUserCart({ uuid: userId });

      this.loadExistingCart(cart);
      this.eventEmitter.emit(Cart.cartReadyEventName, {
        cart: this.toObject(), userId
      });
      SharedModule.eventEmitter.emit(CartService.userReadyToAttachEventName, {userId, cart: this});
      return this;
    } catch (e) {
      // No cart found... Move on
    }

    // IF not, try to find it by the session
    try {
      cart = await new CartService().findOne({ id });
      this.loadExistingCart(cart);
    } catch (e) {
      // console.log(e);
    }

    if (!cart) {
      this.initializeDefaults(id);
    }

    this.eventEmitter.emit(Cart.cartReadyEventName, { cart: this.toObject(), userId });

    SharedModule.eventEmitter.emit(CartService.userReadyToAttachEventName, {userId, cart: this});
    return this;

    /*  if (!userId) {
        try {
          cart = await (new CartService).findOne({id});
          this.loadExistingCart(cart);
        }
        catch (e) {
          console.log(e)
        }

        if (!cart) {
          this.initializeDefaults(id);
        }

        this.eventEmitter.emit(Cart.cartReadyEventName, {cart: this.toObject()});
        return this;
      }
      // Load a cart from the user relationship instead of using the id
      cart = await this.cartService.findUserCart(userId);

      if (!cart) {
        this.initializeDefaults(id);
      }

      this.loadExistingCart(cart);

      this.eventEmitter.emit(Cart.cartReadyEventName, {cart: this.toObject()});
      return this;*/
  }

  protected initializeDefaults(id?: string) {
    this.id = id || v4();
  }

  public toObject(): ICart {
    this.calculateTotals();
    return {
      id: this.id,
      items: this.items,
      total: this.total,
      numberOfItems: this.count(),
      shipping: this.shipping,
      subTotal: this.subTotal,
      vatRate: this.vatRate,
      metaData: this.metaData,
      appliedConditions: this.getAppliedConditions(),
      couponApplied: this.couponApplied,
    };
  }

  getAppliedConditions(): Condition[] {
    return this.appliedConditions.map((c) => {
      if (!(c instanceof Condition)) {
        c = new Condition(c as IConditionArgsConfig);
      }

      return c;
    });
  }

  public toJSON() {
    return JSON.stringify(this.toObject());
  }

  public async save() {
    await this.cartService.save(this);

    this.eventEmitter.emit(Cart.cartSavedEventName, { cart: this.toObject() });
    return this;
  }

  public async attachCartToUser(userFilter: IBaseFilter) {
    await this.cartService.attachCartToUser(userFilter, this.id);
  }

  public getSubTotal(formatted = true) {
    // get the conditions that are meant to be applied
    // on the subtotal and apply it here before returning the subtotal

    const conditions = this.getConditionsByTarget('subtotal');
    this.resetAppliedConditionsByTarget('subtotal'); //reset so they will be properly filled
    // if there is no conditions, lets just return the sum

    if (!conditions.length || conditions.length === 0) {
      return this.itemsTotal() + this.calculateShipping();
    }

    // there are conditions, lets apply it
    let newTotal = this.itemsTotal();
    let process = 0;

    conditions.forEach((cond) => {
      if (cond.hasRules()) {
        const valid = cond.validateCartRules(this);

        if (!valid) {
          return;
        }
      }

      // if this is the first iteration, the toBeCalculated
      // should be the sum as initial point of value.
      let toBeCalculated = (process > 0) ? newTotal : this.sum();
      // console.log('----', newTotal, toBeCalculated, process, cond.applyCondition(toBeCalculated))
      newTotal = cond.applyCondition(toBeCalculated);
      this.addAppliedCondition(cond);
      process++;
    });

    this.subTotal = newTotal + this.calculateShipping();

    return Helpers.formatValue(newTotal, formatted, this.settings)
  }

  public calculateSubtotal() {
    this.subTotal = this.getSubTotal(false) as number;

    return this;
  }

  public calculateItemsTotal() {
    this.total = this.itemsTotal();

    return this;
  }

  public getShipping() {
    const condition = this.getConditionsByType('shipping');

    if (!condition || condition.length === 0) {
      return null;
    }

    return condition[0];
  }


  /**
   * Shipping is calculated by looking for a condition of type shipping
   */
  public calculateShipping() {
    let newTotal = 0.0;
    let process = 0;


    // apply any conditions targeting shipping
    const shippingConditions = this.getConditionsByTarget('shipping');


    this.resetAppliedConditionsByTarget('shipping');

    shippingConditions.forEach((cond) => {
      // validate any rules that are attached to this condition
      if (cond.hasRules()) {
        const valid = cond.validateCartRules(this);

        if (!valid) {
          return;
        }
      }

      let toBeCalculated = (process > 0) ? newTotal : this.shipping;
      newTotal = cond.applyCondition(newTotal);


      this.addAppliedCondition(cond);
      process++;
    });

    this.shipping = newTotal;

    return newTotal;
  }

  public calculateTotals() {
    this.calculateSubtotal();

    let newTotal = 0.0;
    let subTotal = this.getSubTotal() as number;
    let process = 0;


    newTotal = this.subTotal;

    const conditions = this.getConditionsByTarget('total');
    this.resetAppliedConditionsByTarget('total'); //reset so they will be properly filled

    // if no conditions were added, just return the sub total
    if ((!conditions.length || conditions.length === 0) ) {
      this.total = newTotal;
      return this;
    }

    conditions.forEach((cond) => {
      // validate any rules that are attached to this condition
      if (cond.hasRules()) {
        const valid = cond.validateCartRules(this);

        if (!valid) {
          return;
        }
      }

      let toBeCalculated = (process > 0) ? newTotal : subTotal;
      newTotal = cond.applyCondition(toBeCalculated);

      this.addAppliedCondition(cond);
      process++;
    });


    this.total = newTotal;
    return this;
  }

  protected addAppliedCondition(condition: Condition) {
    const foundIdx = this.appliedConditions.findIndex((c) => c.uuid === condition.uuid);

    if (foundIdx === -1) {
      this.appliedConditions.push(condition);
    } else {
      this.appliedConditions[foundIdx] = condition;
    }

    return this;
  }

  public getMetaData(filter: IBaseFilter) {
    const { key, value } = extractSingleFilterFromObject(filter);

    return find(this.items, [key, value]).metaData;
  }

  public setMetaData(filter: IBaseFilter, metaData: IGenericObject) {
    const { key, value } = extractSingleFilterFromObject(filter);
    const item = find(this.items, [key, value]);
    Object.keys(metaData).forEach((key) => {
      item.metaData[key] = metaData[key];
    });

    this.eventEmitter.emit(Cart.itemMetaDataUpdatedEventName, {
      item,
      metaData,
      cart: this.toObject(),
    });

    return this;
  }

  public getTotalQuantity() {
    return this.items.map((item) => item.quantity).reduce((pre, curr) => pre + curr, 0);
  }

  protected itemsTotal() {
    this.items.forEach((item, idx) => {
      if (!(item instanceof CartItem)) {
        this.items[idx] = new CartItem(item);
      }
    });

    return this.items
      .map((item) => {
        let price = item.price;
// console.log('*********', item.uuid, item.conditions)
        if (Array.isArray(item.conditions) && item.conditions.length > 0) {
          price = item.conditions.filter(cond => {

            if (cond.hasRules()) {
              const valid = cond.validateItemRules(item);
              if (!valid) {
                return false;
              }
            }

            return true;
          })
            .map((c) => c.applyCondition(price)).reduce((pre, curr) => pre + curr, 0);
        }

        return price * item.quantity;
      })
      .reduce((pre, curr) => pre + curr, 0);
  }

  private loadExistingCart(cart) {
    Object.keys(cart).forEach((key) => {
      if (this.jsonFields.indexOf(key) === -1) {
        this[key] = cart[key];
        return;
      }


      this[key] = (typeof cart[key] === 'string') ? JSON.parse(cart[key]) : cart[key];
      if (key === 'conditions') {
        this.conditions = this.conditions.map((c) => new Condition(c as IConditionArgsConfig));
      }
    });
  }

  public setCartSettings(settings: ICartSettings) {
    this.settings = settings;

    return this;
  }

  public existingItem(item: ICartItem) {
    return this.items.findIndex((it) => {
      if (item.productId === it.productId && isEqual(item.metaData, it.metaData)) {
        if ((!item.variantId && !it.variantId) || item.variantId === it.variantId) {
          return true;
        }
      }
    });
  }

  public manageAdd(item: ICartItem) {
    this.items.push(new CartItem({ ...item, uuid: v4() }));
    this.updateTotals();
    this.eventEmitter.emit(Cart.itemAddedEventName, {
      item,
      cart: this.toObject(),
    });
    return this;
  }

  public manageRemove(idx: number) {
    const foundItem = Object.assign({}, this.items[idx]);
    this.items.splice(idx, 1);
    this.updateTotals();
    this.eventEmitter.emit(Cart.itemRemovedEventName, {
      item: foundItem,
      cart: this.toObject(),
    });

    return this;
  }

  public manageUpdateQuantity(idx: number, quantity = 1) {
    this.items[idx].quantity = quantity;
    this.updateTotals();

    const item = this.items[idx];
    this.eventEmitter.emit(Cart.itemUpdatedEventName, {
      item,
      cart: this.toObject(),
    });
    return this;
  }

  /**
   * add condition on an existing item on the cart
   * @param productId
   * @param condition
   */
  public addItemCondition(productId: string, condition: Condition) {
    // find the product
    const product = this.getItem({ productId });
    if (!product) {
      return this;
    }

    const itemConditionTempHolder = product.conditions;
    if (!Array.isArray(itemConditionTempHolder)) {
      return this;
    }

    itemConditionTempHolder.push(condition);

    this.updateItem(productId, { conditions: itemConditionTempHolder });

    return this;
  }

  /**
   * useful for applying coupons and discounts after the cart has been filled
   * @param condition
   */
  public addCartCondition(condition: Condition) {
    this.condition(condition);
    this.updateTotals();
    return this;
  }

  public updateItem(productId: string, item: Partial<ICartItem>) {
    const idx = this.items.findIndex((it) => it.productId === productId);
    if (idx === -1) {
      return this;
    }

    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        this.items[idx][key] = item[key];
      }
    }

    this.eventEmitter.emit(Cart.cartItemsUpdatedEventName, {
      productId,
      item,
      cart: this.toObject(),
    });

    return this;
  }

  /**
   * Override the cart contents
   * @param items
   */
  updateItems(items: ICartItem[]) {
    this.items = items.map((item) => new CartItem(item));
    this.updateTotals();
    this.eventEmitter.emit(Cart.cartItemsUpdatedEventName, {
      cart: this.toObject(),
    });
    return this;
  }

  public getConditions(): Condition[] {
    return this.conditions;
  }

  public getCondition(filter: IGenericObject): Condition {
    const {key, value} = extractSingleFilterFromObject(filter);
    return this.conditions.find((c => c[key] === value));
  }

  public getConditionIdx (filter: IGenericObject): number {
    const {key, value} = extractSingleFilterFromObject(filter);
    return this.conditions.findIndex((c => c[key] === value));
  }

  public getConditionsByType(type: string): Condition[] {
    return this.conditions.filter((c => c.getType() === type));
  }

  public getConditionsByTarget(target: string): Condition[] {
    return this.conditions.filter((c => {
      if (typeof c.target === 'string') {
        return c.target === target;
      }

      return typeof c.target === 'function' && c.getTarget() === target;
    }));
  }

  public removeConditionsByType(type: string): Condition[] {
    const conditions = this.getConditionsByType(type);
    conditions.forEach((c) => {
      this.removeCartCondition(c);
    });

    return conditions;
  }

  /**
   * removes a condition on a cart by condition name,
   *  this can only remove conditions that are added on cart bases not conditions that are added on an item/product.
   * If you wish to remove a condition that has been added for a specific item/product, you may
   * use the removeItemCondition(itemId, conditionName) method instead.
   *
   * @param condition
   */
  public removeCartCondition(condition: Condition): Condition {
    const conditions = this.getConditions();
    const idx = conditions.findIndex((c) => c.title === condition.title);
    conditions.splice(idx, 1);

    return condition;
  }

  /**
   * remove a condition that has been applied on an item that is already on the cart
   */
  public removeItemCondition(itemId: string, conditionName: string): boolean {
    const item = this.getItem({ uuid: itemId });
    if (!this.itemHasConditions(item)) {
      return false;
    }

    const tempConditionsHolder = item.conditions;
    if (!Array.isArray(tempConditionsHolder)) {
      return false;
    }

    tempConditionsHolder.forEach((c, idx) => {
      if (c.title === conditionName) {
        tempConditionsHolder.splice(idx, 1);
      }
    });

    item.conditions = tempConditionsHolder;
    return true;
  }

  public clearItemConditions(itemId: string) {
    const item = this.getItem({ uuid: itemId });
    if (!this.itemHasConditions(item)) {
      return false;
    }

    item.conditions = [];
    return true;
  }

  public clearItemsConditions() {
    this.items.forEach((item) => {
      this.clearItemConditions(item.uuid);
    });

    return true;
  }

  public clearCartConditions() {
    this.conditions = [];
    return true;
  }

  public clearCartConditionsByTarget(target: string) {
    this.conditions = this.conditions.filter((c) => c.getTarget() !== target);
    return true;
  }

  public getSubTotalWithoutConditions(formatted = true) {
    const subTotal = this.sum();

    return formatted ? Helpers.formatValue(subTotal, formatted, this.settings) : subTotal;
  }

  public sum() {
    let sum = 0;
    this.items.forEach((item) => {
      if (Array.isArray(item.conditions) && item.conditions.length > 0) {
        sum += item.conditions.map((c) => c.applyCondition(item.price)).reduce((pre, curr) => pre + curr, 0) * item.quantity;
        return;
      }
      sum += item.price * item.quantity;
    });

    return sum;
  }

  public getItemPriceSum(item: ICartItem) {
    return Helpers.formatValue(item.price * item.quantity, this.settings.formatNumbers, this.settings);
  }

  public itemHasConditions(item: ICartItem): boolean {
    if (!item.conditions || !Array.isArray(item.conditions) || item.conditions.length === 0) {
      return false;
    }

    return true;
  }

  public condition(condition: Condition|Condition[]) {
    if (Array.isArray(condition)) {
      condition.forEach((cond) => {
        this.condition(cond);
      });
    }

  // if not instanceof condition throw exception
    if (!(condition instanceof Condition)) {
      throw new InvalidConditionTypeException('NotInstanceOfCondition', '1600.1');
    }

    const conditions = this.getConditions();

    const foundIdx = this.getConditionIdx({uuid: condition.getId()});

    // only add the condition 1 time
    if (foundIdx > -1) {
      this.conditions[foundIdx] = condition;
      this.addAppliedCondition(condition);
      return this.conditions;
    }

    let last: Condition;

    if (condition.getOrder() === 0) {
      // last becomes the last condition in the array
      last = conditions[conditions.length - 1];
      condition.setOrder(last ? last.getOrder() + 1 : 1);
    }

    conditions.push(condition);

    // sort conditions by order
    conditions.sort((a, b) => {
      return a.getOrder() - b.getOrder();
    });

    this.conditions = conditions;

    return this.conditions;
  }

  /**
   * remove conditions of this target from the array of applied conditions
   * @param target
   * @private
   */
  resetAppliedConditionsByTarget(target: string) {
    this.appliedConditions
      .filter(c => c.target === target)
      .forEach(c => {
        const idx = this.appliedConditions.findIndex(co => co.uuid === c.uuid);
        this.appliedConditions.splice(idx, 1)
      });
  }
}
