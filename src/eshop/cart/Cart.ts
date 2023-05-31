import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { CartService, ICart, ICartItem } from '~eshop/cart/cart.service';
import { ICondition } from '~eshop/cart/condition.service';
import { ICoupon } from '~eshop/cart/coupon.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { v4 } from 'uuid';
import { IBaseFilter, IGenericObject } from '~models/general';
import { Condition, IConditionCollection } from '~eshop/cart/Condition';
import { find, findIndex, isEqual } from 'lodash';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { SharedModule } from '~shared/shared.module';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';

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
  public items: ICartItem[] = [];
  public metaData = {};
  public appliedConditions: IConditionCollection[] = [];
  public couponApplied: ICoupon = {};
  public cartService: CartService;
  protected jsonFields = ['couponApplied', 'items', 'metaData', 'appliedConditions'];
  protected settingsDefaults: ICartSettings = {
    formatNumbers: false,
    decimals: 2,
    decPoint: '.',
    thousandsSep: ',',
  };
  protected settings: ICartSettings;

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
      this.items.push({ ...item, uuid: v4() });
      this.updateTotals();

      return this;
    }

    if (item.quantity === 0) {
      this.remove({ productId: item.productId });
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
    return this.items.map((item) => item.quantity).reduce((pre, curr) => pre + curr, 0);
  }

  public async initialize(id?: string, userId?: string) {
    let cart;
    // Load a cart using the userID
    try {
      cart = await this.cartService.findUserCart({ uuid: userId });

      this.loadExistingCart(cart);
      this.eventEmitter.emit(Cart.cartReadyEventName, {
        cart: this.toObject(),
      });
      return this;
    } catch (e) {
      // No cart found... Move on
    }

    // IF not, try to find it by the session
    try {
      cart = await new CartService().findOne({ id });
      this.loadExistingCart(cart);
    } catch (e) {
      console.log(e);
    }

    if (!cart) {
      this.initializeDefaults(id);
    }

    this.eventEmitter.emit(Cart.cartReadyEventName, { cart: this.toObject() });
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
    return {
      id: this.id,
      items: this.items,
      total: this.total,
      numberOfItems: this.count(),
      subTotal: this.subTotal,
      vatRate: this.vatRate,
      metaData: this.metaData,
      appliedConditions: this.appliedConditions,
      couponApplied: this.couponApplied,
    };
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

  protected calculateSubtotal() {
    let subTotal = 0,
      conditionsTotal = 0;

    subTotal = this.itemsTotal();

    if (!Array.isArray(this.appliedConditions)) {
      return subTotal;
    }

    this.appliedConditions.forEach((cond) => {
      // const condition = (new Condition(cond)).apply({subtotal: subTotal});
    });

    this.subTotal = subTotal;

    return this;
  }

  public calculateTotals() {
    this.calculateSubtotal();
    const subtotal = this.subTotal;
    let newTotal = 0.0;
    let process = 0;

    // Figure out conditions here

    // if no conditions were added, just return the sub total
    /*    if (!$conditions->count()) {
          return Helpers::formatValue($subTotal, $this->config['format_numbers'], $this->config);
        }*/

    /*    $conditions
          ->each(function (CartCondition $cond) use ($subTotal, &$newTotal, &$process) {
          $toBeCalculated = ($process > 0) ? $newTotal : $subTotal;

          $newTotal = $cond->applyCondition($toBeCalculated);

          $process++;
        });*/

    newTotal = subtotal;
    this.total = newTotal;

    // return Helpers::formatValue($newTotal, $this->config['format_numbers'], $this->config);
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

  protected itemsTotal() {
    return this.items
      .map((item) => {
        let conditionsTotal = 0,
          price = item.price;
        if (Array.isArray(item.conditions)) {
          //line 308
        }

        /*      if (item.attributesPrice) {
              price = price + item.attributesPrice;
            }*/

        price = price + conditionsTotal;

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
    this.items.push({ ...item, uuid: v4() });
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
   * Override the cart contents
   * @param items
   */
  updateItems(items: ICartItem[]) {
    this.items = items;
    this.updateTotals();
    this.eventEmitter.emit(Cart.cartItemsUpdatedEventName, {
      cart: this.toObject(),
    });
    return this;
  }

}
