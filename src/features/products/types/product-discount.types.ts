export enum ProductDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export interface ProductDiscountDto {
  name: string;
  type: ProductDiscountType;
  value: number;
  percentOff: number;
  unitDiscount: number;
  endsAt?: string | null;
}
