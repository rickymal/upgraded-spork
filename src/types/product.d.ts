export type VendorProduct = {
  updatedAt: Date;
  productId: string;
  name: string;
  productDescription: string;
  primaryCategoryID: string;
  PrimaryCategoryName: string;
  SecondaryCategoryID: string;
  SecondaryCategoryName: string;
  variants: Variant[];
};

export type Variant = {
  PKG: string;
  UnitPrice: string;
  PriceDescription: string;
  ItemDescription: string;
};

export type RawVendorProduct = {
  SiteSource: string;
  ItemID: string;
  ManufacturerID: string;
  ManufacturerCode: string;
  ManufacturerName: string;
  ProductID: string;
  ProductName: string;
  ProductDescription: string;
  ManufacturerItemCode: string;
  ItemDescription: string;
  ImageFileName: string;
  ItemImageURL: string;
  NDCItemCode: string;
  PKG: string;
  UnitPrice: string;
  QuantityOnHand: string;
  PriceDescription: string;
  Availability: string;
  PrimaryCategoryID: string;
  PrimaryCategoryName: string;
  SecondaryCategoryID: string;
  SecondaryCategoryName: string;
  CategoryID: string;
  CategoryName: string;
  IsRX: string;
  IsTBD: string;
};
