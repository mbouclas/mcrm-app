import { Cart } from "~eshop/cart/Cart";
import {SessionData} from 'express-session'
declare module 'express-session' {
  export interface SessionData {
    id: string;
    cart: Cart;
    lang: string;
    user: any;
  }
}
export interface ISessionData extends SessionData {
  id: string;
  cart: Cart;
  lang: string;
  user: any;
}
