import { Injectable, OnModuleInit } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { CartService, ICart, ICartItem } from "~eshop/cart/cart.service";
import {  ICondition } from "~eshop/cart/condition.service";
import { ICoupon } from "~eshop/cart/coupon.service";
import { OnEvent } from "@nestjs/event-emitter";
import { v4 } from "uuid";
import { IBaseFilter } from "~models/general";
import { Condition, IConditionCollection } from "~eshop/cart/Condition";
import { find, findIndex, isEqual } from "lodash";
import { extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";

@McmsDi({
  id: 'Cart',
  type: "class"
})
@Injectable()
export class Cart implements OnModuleInit, ICart {
  public id;
  public total = 0;
  public subTotal = 0;
  public vatRate = 0;
  public items: ICartItem[] = [];
  public metaData = {};
  public appliedConditions: IConditionCollection[] = [];
  public couponApplied: ICoupon = {};
  public cartService: CartService;
  protected jsonFields = [
    'couponApplied',
    'items',
    'metaData',
    'appliedConditions',
  ];

  constructor(id?: string) {
    this.cartService = new CartService();
    if (id) { this.id = id;}
/*    this.initialize(id)
      .then(cart => {})
      .catch(err => console.log(err));*/
  }

  async onModuleInit() {

  }

  @OnEvent('app.loaded')
  async onAppLoaded() {

  }

  public add(item: ICartItem) {
    let found;
    this.items.forEach(it => {
      if (isEqual(item, it)) {
        found = it;
      }
    });

    if (!found) {
      this.items.push(item);
      this.calculateSubtotal();

      return this;
    }

    found.quantity++;
    this.calculateSubtotal();
    return this;
  }

  public remove(filter: IBaseFilter) {
    const {key, value} = extractSingleFilterFromObject(filter);

    const idx = findIndex(this.items,[key, value]);
    this.items.splice(idx, 1);
    this.calculateSubtotal();
    return this;
  }


  public updateQuantity(filter: IBaseFilter, quantity = 1, appendToExisting = true) {
    const {key, value} = extractSingleFilterFromObject(filter);

    const item = find(this.items,[key, value]);

    item.quantity = (appendToExisting) ? item.quantity + quantity : item.quantity = quantity;

    this.calculateSubtotal();
    return this;
  }

  public getItem(filter: IBaseFilter) {
    const {key, value} = extractSingleFilterFromObject(filter);

    return find(this.items,[key, value]);
  }

  public count() {
    return this.items.map(item => item.quantity).reduce((pre,curr)=>pre+curr,0);
  }

  public async initialize(id?: string) {
    let cart;
    try {
      cart = await this.cartService.findOne({id});
      this.loadExistingCart(cart);
    }
    catch (e) {

    }

    if (!cart) {
      this.initializeDefaults();
    }


    return this;
  }

  protected initializeDefaults() {
    this.id = v4();
  }

  public toObject(): ICart {
    return {
      id: this.id,
      items: this.items,
      total: this.total,
      subTotal: this.subTotal,
      vatRate: this.vatRate,
      metaData: this.metaData,
      appliedConditions: this.appliedConditions,
      couponApplied: this.couponApplied,
    }
  }

  public toJSON() {
    return JSON.stringify(this.toObject());
  }

  public async save() {
    await this.cartService.save(this);
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

    this.appliedConditions.forEach(cond => {
      // const condition = (new Condition(cond)).apply({subtotal: subTotal});
    })

    this.subTotal = subTotal;

    return this;
  }

  protected itemsTotal() {
    return  this.items.map(item => {
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
      .reduce((pre,curr)=>pre+curr,0);
  }

  private loadExistingCart(cart) {

    Object.keys(cart).forEach(key => {
      this[key] = this.jsonFields.indexOf(key) !== -1 ? JSON.parse(cart[key]) : cart[key];
    })
  }
}
