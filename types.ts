export interface Product {
  name: string;
  imageUrl: string;
}

export interface ProductGroup {
  name: string;
  products: Product[];
}

export interface ProductCategory {
  size: string;
  sizeReferenceImage?: string; // Add this line
  products?: Product[];
  groups?: ProductGroup[];
}

export interface Brand {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  color: string;
  image: string;
  categories: ProductCategory[];
}