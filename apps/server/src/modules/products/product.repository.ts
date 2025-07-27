import { supabase } from "#modules/database/supabase.client.js";
import { Product } from "./product.entity.js";

export class ProductRepository {
  async exists(productCode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("product_code", productCode)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error checking product existence: ${error.message}`);
    }

    return !!data;
  }

  async upsert(
    product: Product,
  ): Promise<{ action: "inserted" | "updated"; product: any }> {
    const exists = await this.exists(product.product_code);

    if (exists) {
      return await this.update(product);
    } else {
      return await this.insert(product);
    }
  }

  private async update(
    product: Product,
  ): Promise<{ action: "updated"; product: any }> {
    const { data, error } = await supabase
      .from("products")
      .update(product)
      .eq("product_code", product.product_code)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Error updating product ${product.product_code}: ${error.message}`,
      );
    }

    return { action: "updated", product: data };
  }

  private async insert(
    product: Product,
  ): Promise<{ action: "inserted"; product: any }> {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Error inserting product ${product.product_code}: ${error.message}`,
      );
    }

    return { action: "inserted", product: data };
  }
}
