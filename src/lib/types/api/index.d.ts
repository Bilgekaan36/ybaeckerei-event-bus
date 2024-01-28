export interface IStore {
  storeId?: string;
  storeTitle: string;
  street: string;
  postalCode: number;
  city: string;
}

export interface ICategory {
  categoryId?: string;
  categoryName: string;
  billboardId: string;
}

export interface IVariant {
  variantId?: string;
  variantTitle: string;
}

export interface ISize {
  sizeId?: string;
  sizeValue: number;
  sizeType: string;
}

export interface IImage {
  imageId?: string;
  imageTitle: string;
  imageUrl: string;
}
export interface IBillboard {
  billboardId?: string;
  billboardTitle: string;
  billboardImageUrl: string;
}

export interface IProduct {
  productId?: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  stockQuantity: number;
  variantId: string;
  categoryId: string;
}

export interface ICustomer {
  customerId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: number;
}

export interface ICheckoutOrder {
  customerId: string;
  statusId: string;
  products: any[];
}

export interface IPayOrder {
  orderId: string;
}
