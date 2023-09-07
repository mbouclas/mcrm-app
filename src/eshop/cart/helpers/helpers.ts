import { ICartSettings } from "~eshop/cart/Cart";

export class Helpers {

  /**
   * normalize price
   *
   * @param price: string | number
   * @return number
   */
  public static normalizePrice(price: string | number): number {
    return typeof price === 'string' ? parseFloat(price) : price;
  }


  /**
   * check if variable is set and has value, return a default value
   *
   * @param var: any
   * @param default: any (default = false)
   * @return any
   */
  public static issetAndHasValueOrAssignDefault(variable: any, defaultVal: any = false): any {
    if (variable !== undefined && variable !== '') return variable;
    return defaultVal;
  }

  /**
   * format value
   *
   * @param value: number
   * @param format_numbers: boolean
   * @param config: { format_numbers: boolean, decimals: number, dec_point: string, thousands_sep: string }
   * @return string | number
   */
  public static formatValue(value: number, format_numbers: boolean, config: ICartSettings): string | number {
    if (format_numbers && config.formatNumbers) {
      return value.toLocaleString(undefined, { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals }).replace('.', config.decPoint).replace(/,/g, config.thousandsSep);
    } else {
      return value;
    }
  }
}
