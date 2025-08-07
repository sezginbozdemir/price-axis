import { Product } from "./product.entity.js";

export class ProductTransformer {
  private readonly FIELD_ALIASES: Record<string, string[]> = {
    product_code: ["Product code", "product_code", "code"],
    name: ["Product name", "name"],
    description: ["Product description", "desc", "description"],
    price: ["Price with VAT", "price_vat", "vat_price"],
    discount_price: ["Price with discount, with VAT", "discount_price"],
    currency: ["Currency"],
    brand: ["Manufacturer", "Brand"],
    advertiser: ["Advertiser name", "Advertiser"],
    category: [],
    subcategory: ["Category"],
    affiliate_link: ["Product affiliate link", "Affiliate link"],
    image_url: ["Product picture", "Image URL"],
    availability: ["Availability", "Stock"],
  };

  transform(row: Record<string, any>): Product {
    const product: Product = {
      product_code: String(this.getValue(row, this.FIELD_ALIASES.product_code)),
      name: this.getValue(row, this.FIELD_ALIASES.name),
      description: this.getValue(row, this.FIELD_ALIASES.description) ?? "",
      price: Number(this.getValue(row, this.FIELD_ALIASES.price)) || 0,
      discount_price:
        Number(this.getValue(row, this.FIELD_ALIASES.discount_price)) ||
        undefined,
      currency: this.getValue(row, this.FIELD_ALIASES.currency) ?? "lei",
      brand: this.getValue(row, this.FIELD_ALIASES.brand) ?? "",
      advertiser: this.getValue(row, this.FIELD_ALIASES.advertiser) ?? "",
      category: "", //TODO: Decide how to implement main categories automatically
      subcategory: this.getValue(row, this.FIELD_ALIASES.subcategory) ?? "",
      affiliate_link: this.normalizeLink(
        this.getValue(row, this.FIELD_ALIASES.affiliate_link),
      ),
      image_url: this.getValue(row, this.FIELD_ALIASES.image_url),
      availability:
        this.getValue(row, this.FIELD_ALIASES.availability) ?? "unknown",
    };
    return product;
  }

  private getValue(
    row: Record<string, any>,
    aliases: string[] | undefined,
  ): any {
    if (aliases) {
      for (const key of aliases) {
        if (key in row && row[key] != null) {
          return row[key];
        }
      }
    }

    return undefined;
  }

  private normalizeLink(link: string): string {
    return link.startsWith("http") ? link : `https:${link}`;
  }
}
