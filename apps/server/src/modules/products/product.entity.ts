export interface Product {
  id?: string;
  product_code: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  currency: string;
  brand: string;
  advertiser: string;
  category?: string;
  subcategory: string;
  affiliate_link: string;
  image_url: string;
  availability: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImportResult {
  processed: number;
  inserted: number;
  updated: number;
  errors: Array<{ index: number; error: string; row: any }>;
}

export interface ImportOptions {
  batchSize?: number;
  skipErrors?: boolean;
  onProgress?: (processed: number, total: number, current: Product) => void;
  onError?: (error: Error, row: any, index: number) => void;
}
