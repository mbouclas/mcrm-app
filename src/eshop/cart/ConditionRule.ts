export interface IConditionArgsConfig {
  name: string;
  field: 'quantity'|'price'|'subTotal'|'total'|'promo'|'items'|'numberOfItems'|Function;
  operator: '=='|'!='|'>'|'>='|'<'|'<='|'in'|'not in';
  value: string|number;
}
export class ConditionRule {
  public name: string;
  public field: 'quantity'|'price'|'subTotal'|'total'|'promo'|'items'|'numberOfItems'|Function;
  public operator: '=='|'!='|'>'|'>='|'<'|'<='|'in'|'not in';
  public value: string|number;

  constructor(args: IConditionArgsConfig) {
    this.name = args.name;
    this.field = args.field;
    this.operator = args.operator;
    this.value = args.value;
  }

  public validate(value: string|number) {
    if (Array.isArray(value)) {
      value = value.length;
    }

    switch (this.operator) {
      case '==':
        return value == this.value;
      case '!=':
        return value != this.value;
      case '>':
        return value > this.value;
      case '>=':
        return value >= this.value;
      case '<':
        return value < this.value;
      case '<=':
        return value <= this.value;
    }
  }
}
