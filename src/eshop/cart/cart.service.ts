import { Injectable } from '@nestjs/common';
import { CacheService } from '~shared/services/cache.service';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IBaseFilter,  IGenericObject } from "~models/general";
import { ICoupon } from '~eshop/cart/coupon.service';
import { ICondition } from '~eshop/cart/condition.service';
import { UserService } from '~user/services/user.service';
import { UserNotFoundException } from '~user/exceptions/user-not-found.exception';
import { UserModel } from '~user/models/user.model';
import { OnEvent } from '@nestjs/event-emitter';
import { store } from '~root/state';
import { ProductService } from '~catalogue/product/services/product.service';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { Cart } from "~eshop/cart/Cart";
import { CouldNotAttachUserToCartException } from "~eshop/cart/exceptions/could-not-attach-user-to-cart.exception";
import { BaseModel } from "~models/base.model";
import { CouldNotAttachModelToCartException } from "~eshop/cart/exceptions/could-not-attach-model-to-cart.exception";
import { Condition } from "~eshop/cart/Condition";

export interface ICartItem {
  uuid?: string;
  quantity: number;
  price: number;
  productId: string;
  variantId: string;
  title: string;
  conditions?: Condition[];
  metaData?: IGenericObject;
  thumb?: string;
  slug?: string;
  sku?: string;
}

export interface ICart {
  id: string;
  total: number;
  subTotal: number;
  numberOfItems?: number;
  items: ICartItem[];
  vatRate: number;
  metaData?: IGenericObject;
  couponApplied?: ICoupon;
  appliedConditions?: ICondition[];
  user?: UserModel;
}

/**
 * Ths big idea is that if a user is logged in, the cart goes into the DB with a userID attached to it. Otherwise, it's an orphan one
 * The cart id should be unique
 */
@Injectable()
export class CartService extends BaseNeoService {
  protected redis: CacheService;
  protected static cartReadyEventName = 'cart.ready';
  public static userReadyToAttachEventName = 'cart.user.ready.to.attach';
  constructor() {
    super();
    this.model = store.getState().models.Cart;
    this.redis = new CacheService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    this.model = store.getState().models.Cart;

    /*        const s = new CartService();
            const cart = new Cart();
            const product = await (new ProductService()).findOne({ slug: "betty" });
            // Get the cart id from the Session. On the first run, add the id to the session
            await cart.initialize("1JfqkZXK9-H1iaVD_HIfs5VbwD4xSwtE");
            const cartItem = {
              id: product["uuid"],
              title: product.title,
              price: product.price,
              quantity: 1,
              metaData: {
                slug: product.slug
              }
            };

            // cart.add(cartItem);
            // cart.add(cartItem);
            // cart.add(cartItem);

            try {
              // await s.save(cart);
            }
            catch (e) {
              console.log(e)
            }


            setTimeout(() => console.log(cart.toObject()), 600)*/
  }

  @OnEvent(CartService.userReadyToAttachEventName)
  async onUserReadyToAttach({ userId, cart }: { userId: string; cart: Cart }) {

    try {
      await this.attachModelToCart(UserModel, { uuid: userId }, cart.id);
    }
    catch (e) {
      console.log(e)
    }
  }

  @OnEvent(CartService.cartReadyEventName)
  async onCartReady({ cart, userId }: { cart: Cart, userId?: string }) {
    if (!userId) {
      return;
    }

    // console.log("Cart ready", cart.items, userId);
    // await this.save(cart);
  }


  async attachModelToCart(model: typeof BaseModel, filter: IBaseFilter, cartId: string) {
    const {key, value } = extractSingleFilterFromObject(filter);
    const query = `
      MATCH (c:Cart {id: "${cartId}"})
      MATCH (m:${model.modelName} {${key}: "${value}"})
      MERGE (m)-[r:HAS_CART]->(c)
      ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
      ON MATCH SET   r.updatedAt = datetime()
      RETURN *;
    `;

    try {
      await this.neo.write(query, { cartId, value });
    }
    catch (e) {
      throw new CouldNotAttachModelToCartException('COULD_NOT_ATTACH_MODEL_TO_CART', '200.0', e);
    }
  }
  async attachCartToUser(userFilter: IBaseFilter, cartId: string) {
    const user = await new UserService().findOne(userFilter);
    if (!user) {
      throw new UserNotFoundException(`Can't find user`);
    }

    const query = `
    MATCH (u:User {uuid: $userId})
    MATCH (c:Cart {id: $cartId})
    MERGE (u)-[r:HAS_CART]->(c)
    ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET   r.updatedAt = datetime()
    RETURN *;
    `;

    try {
      await this.neo.write(query, { userId: user['uuid'], cartId });
    }
    catch (e) {
      throw new CouldNotAttachUserToCartException('COULD_NOT_ATTACH_USER_TO_CART', '200.1', e);
    }

    return this;
  }

  /**
   * Will create a valid cart item from a productId.
   * Calculates product price based on any conditions this user may have on them
   * @param id
   * @param quantity
   * @param variantId
   * @param userId
   */
  async createCartItemFromProductId(
    id: string,
    quantity = 1,
    variantId?: string,
    metaData?: IGenericObject,
    userId?: string,
  ): Promise<ICartItem> {
    let product, thumb, sku, slug;

    try {
      product = await new ProductService().findOne({ uuid: id }, ['variants', 'cartCondition']);
      thumb = typeof product.thumb === 'string' ? product.thumb : product?.thumb?.url || '';
      sku = product.sku;
      slug = product.slug;
    } catch (e) {
      throw new RecordNotFoundException(e);
    }

    let price = product.price;
    if (variantId) {
      const variant = ProductService.findVariant(product, { uuid: variantId });
      thumb = typeof variant.thumb === 'string' ? variant.thumb : variant.thumb.url;
      price = variant.price;
      sku = variant.sku;
      slug = variant.slug;
    }

    return {
      productId: id,
      variantId,
      quantity,
      sku,
      slug,
      price,
      metaData,
      title: product.title,
      thumb,
      conditions: (Array.isArray(product.cartCondition) && product.cartCondition.length > 0) ? product.cartCondition.map(c => new Condition(c)) : undefined,
    };
  }

  async save(cart: Cart) {
    // need the userId to associate to the user
    let existingCart;
    try {
      existingCart = await this.findOne({ id: cart.id });
    } catch (e) {}

    const objToStore = {
      ...cart.toObject(),
      ...{
        items: JSON.stringify(cart.items),
        appliedConditions: JSON.stringify(cart.appliedConditions),
        conditions: JSON.stringify(cart.conditions),
        metaData: JSON.stringify(cart.metaData),
        couponApplied: JSON.stringify(cart.couponApplied),
      },
    };

    const fieldsQuery = Object.keys(objToStore)
      .map((field) => {
        return `n.${field} = $${field}`;
      })
      .join(', ');

    const query = `MERGE (n:Cart {uuid:$uuid}) SET ${fieldsQuery} RETURN *`;

    return this.neo.write(query, { ...objToStore, ...{ uuid: objToStore.id } });
  }

  async findUserCart(filter: IBaseFilter) {
    const { key, value } = extractSingleFilterFromObject(filter);
    const query = `MATCH (user:User {${key}: '${value}'})-[r:HAS_CART]->(cart:Cart)
    return *;
    `;

    const cartResult = await this.neo.readWithCleanUp(query);
    if (cartResult.length === 0) {
      throw new RecordNotFoundException('NoCartFound');
    }

    return cartResult[0].cart;
  }

  async clearItems(cartId: string) {
    const query = `MATCH (n:Cart {id: $cartId})
    WHERE n.items is not null
    SET n.items = [], n.total = 0, n.subTotal = 0, n.numberOfItems = 0;
    `;

    await this.neo.write(query, { cartId });

    return this;
  }
}
