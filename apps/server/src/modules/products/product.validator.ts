import { CreateProductSchema, type CreateProduct } from "./product.schema.js";

export class ProductValidator {
  validate(input: unknown): CreateProduct {
    const result = CreateProductSchema.safeParse(input);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
}
