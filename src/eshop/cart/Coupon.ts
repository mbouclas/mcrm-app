import { Condition, IConditionArgsConfig } from "~eshop/cart/Condition";
import { z } from "zod";

export interface ICouponArgsConfig extends IConditionArgsConfig {
  validFrom: Date;
  validUntil: Date;
  usageCount?: number; // Number of times this coupon has been used
  maxUsage?: number;   // Maximum number of times this coupon can be used
}

/**
 * Coupons are applied to the cart to give discounts.
 * Coupons can be applied to the subtotal, shipping, or tax.
 * Coupons can be applied to the total amount, or to individual items.
 * Coupons can be applied to a specific item, or to all items.
 * Coupons can be applied to a specific category, or to all categories.
 * Coupons can be applied to a specific brand, or to all brands.
 * Coupons can be applied to a specific product, or to all products.
 * Coupons can be applied to a specific customer, or to all customers.
 * Coupons can be applied to a specific customer group, or to all customer groups.
 * Coupons can be applied to a specific country, or to all countries.
 *
 */
export class Coupon extends Condition {
  validFrom: Date;
  validUntil: Date;
  usageCount?: number; // Number of times this coupon has been used
  maxUsage?: number;   // Maximum number of times this coupon can be used


  constructor(protected args: ICouponArgsConfig) {
    super(args);
    this.validate(args);
  }

  protected validationRules() {
    return z.object({
      title: z.string().min(1, 'Name is required'),
      kind: z.string().min(1, 'Type is required'),
      value: z.string().min(1, 'Value is required'),
      target: z.string().min(1, 'Target is required'),
      validFrom: z.date().min(new Date(), 'Valid from date must be in the future'),
      validUntil: z.date().min(new Date(), 'Valid until date must be in the future'),
    })
  }
}
