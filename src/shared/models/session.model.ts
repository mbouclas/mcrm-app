import { Cart } from "~eshop/cart/Cart";

declare module 'express-session' {
  export interface SessionData {
    id: string;
    cart: Cart;
    lang: string;
    user: any;
  }
}
