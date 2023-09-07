import { Condition } from "~eshop/cart/Condition";
import { Cart } from "~eshop/cart/Cart";


const cartItem = {
  productId: '94dce94a-f3ab-460f-ab1b-c6ac3dc5e08b',
  title: 'Betty',
  price: 10,
  quantity: 1,
  metaData: {
    slug: 'betty'
  }
};

export class ConditionSpec {
  async runTests() {
    try {
      this.itShouldInstantiate();
    }
    catch (e) {
      console.error(e);
    }

    try {
      await this.itShouldAddASingleCondition();
    }
    catch (e) {
      console.log(e)
    }

    try {
      await this.itShouldAddPerItemCondition();
    }
    catch (e) {
      console.log(e)
    }

    try {
      await this.itShouldAddPerItemAndCartCondition();
    }
    catch (e) {
      console.log(e)
    }

    try {
      await this.itShouldClearAllCartConditions();
    }
    catch (e) {
      console.log(e)
    }

    try {
      await this.itShouldClearAllItemConditions();
    }
    catch (e) {
      console.log(e)
    }

    try {
      await this.itShouldGetItemProperties();
    }
    catch (e) {
      console.log(e)
    }
  }

  itShouldInstantiate() {
    const condition = new Condition({
      name: 'test',
      type: 'tax',
      target: 'subtotal',
      value: '10',
    });

    if (!condition || !(condition instanceof Condition)) {
      throw new Error('Condition failed to instantiate');
    }

    if (condition.hasOwnProperty('args') === false) {
      throw new Error('Condition failed to instantiate');
    }

    console.log(`*** Test ItShouldInstantiate passed! ***`);
  }

  async itShouldAddASingleCondition() {
    const cart = await createCart();
    const condition = new Condition({
      name: "VAT 19%",
      type: "tax",
      target: "subtotal",
      value: "19%",
      order: 2,
      attributes: {
        description: "VAT 19%",
        more_data: "more data"
      }
    });

    // add the condition to the cart
    cart.condition(condition);
    cart.condition(new Condition({
      name: 'Express Shipping $15',
      type: 'shipping',
      target: 'total',
      value: '+15',
      order: 1,
    }));

    cart.add(cloneObject(cartItem));

    if (cart.getConditions().length < 1) {
      throw new Error('Condition failed to add');
    }

/*
    console.log('Subtotal without conditions',cart.getSubTotalWithoutConditions(true));
    console.log('Get Subtotal',  cart.subTotal);
    console.log('Cart Total', cart.total);
*/


    if (cart.total !== 26.9 && cart.subTotal !== 11.9) {
      throw new Error('Conditions failed to apply');
    }


    const cartObj = cart.toObject();
    if (cartObj.appliedConditions.length < 1) {
      throw new Error(`Applied conditions number is invalid. Expected 2, got ${cartObj.appliedConditions.length}`);
    }

    console.log(`*** Test itShouldAddASingleCondition passed! ***`);
  }

  async itShouldAddPerItemCondition() {
    const cart = await createCart();
    const itemCondition = new Condition({
      name: 'SALE 5%',
      type: 'tax',
      target: 'item',
      value: '-5%',
    });

    cart.add({...cloneObject(cartItem), ...{conditions: [itemCondition]}});

    // console.log('Subtotal without conditions',cart.getSubTotalWithoutConditions(true));
    // console.log('Get Subtotal',  cart.subTotal);
    // console.log('Cart Total', cart.total);

    if (cart.total !== 9.5 && cart.subTotal !== 9.5) {
      throw new Error('Per item condition failed to apply');
    }

    console.log(`*** Test itShouldAddPerItemCondition passed! ***`);
  }

  async itShouldAddPerItemAndCartCondition() {
    const cart = await createCart();
    const itemCondition = new Condition({
      name: 'SALE 5%',
      type: 'tax',
      target: 'item',
      value: '-5%',
    });

    cart.condition(new Condition({
      name: 'Express Shipping $15',
      type: 'shipping',
      target: 'total',
      value: '+15',
      order: 1,
    }));

    cart.add({...cloneObject(cartItem), ...{conditions: [itemCondition]}});



    // console.log('Subtotal without conditions',cart.getSubTotalWithoutConditions(true));
    // console.log('Get Subtotal',  cart.subTotal);
    // console.log('Cart Total', cart.total);

    if (cart.total !== 24.5 && cart.subTotal !== 9.5) {
      throw new Error('Conditions failed to apply');
    }

    console.log(`*** Test itShouldAddPerItemAndCartCondition passed! ***`);
  }

  async itShouldClearAllCartConditions() {
    const cart = await createCart();

    cart.condition(new Condition({
      name: 'Express Shipping $15',
      type: 'shipping',
      target: 'total',
      value: '+15',
      order: 1,
    }));

    if (cart.getConditions().length < 1) {
      throw new Error('Condition failed to add');
    }

    cart.clearCartConditions();

    if (cart.getConditions().length > 0) {
      throw new Error('Condition failed to clear');
    }

    console.log(`*** Test itShouldClearAllCartConditions passed! ***`);
  }

  async itShouldClearAllItemConditions() {
    const cart = await createCart();

    const itemCondition = new Condition({
      name: 'SALE 5%',
      type: 'tax',
      target: 'item',
      value: '-5%',
    });

    cart.add({...cloneObject(cartItem), ...{conditions: [itemCondition]}});

    cart.clearItemsConditions();

    if (cart.items[0].conditions.length > 0) {
      throw new Error('Condition failed to clear');
    }

    console.log(`*** Test itShouldClearAllItemConditions passed! ***`);
  }

  async itShouldGetItemProperties() {
    const cart = await createCart();

    const itemCondition = new Condition({
      name: 'SALE 5%',
      type: 'tax',
      target: 'item',
      value: '-5%',
    });

    cart.add({...cloneObject(cartItem), ...{conditions: [itemCondition], quantity: 2}});
    cart.add({...cloneObject(cartItem), ...{
      title: 'p2', productId: 'p2'
    }});
    console.log('Price with conditions',cart.items[0].getPriceWithConditions());
    console.log('Price without conditions',cart.items[0].getPriceWithoutConditions());
    console.log('Applied Conditions', cart.items[0].getConditions().length);

    console.log('Price sum',cart.items[0].getPriceSum());

    console.log('Subtotal with conditions',cart.subTotal);
    // console.log(cart.toJSON())
  }
}



async function createCart() {
  const cart = new Cart();
  await cart.initialize();



  return cart;
}


function cloneObject(item) {
  return JSON.parse(JSON.stringify(item));
}
