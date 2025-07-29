import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().optional(),

  product_code: z
    .string()
    .min(1, "Product code is required")
    .max(100, "Product code must be less than 100 characters")
    .trim(),

  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be less than 255 characters")
    .trim(),

  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),

  price: z.number().positive("Price must be positive"),

  discount_price: z
    .number()
    .positive("Discount price must be positive")
    .optional(),

  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .transform((val) => val.toUpperCase()),

  brand: z
    .string()
    .min(1, "Brand is required")
    .max(100, "Brand must be less than 100 characters")
    .trim(),

  advertiser: z
    .string()
    .min(1, "Advertiser is required")
    .max(100, "Advertiser must be less than 100 characters")
    .trim(),

  category: z
    .string()
    .max(100, "Category must be less than 100 characters")
    .optional(),

  subcategory: z
    .string()
    .min(1, "Subcategory is required")
    .max(100, "Subcategory must be less than 100 characters")
    .trim(),

  affiliate_link: z.string(),
  image_url: z.string(),

  availability: z
    .string()
    .min(1, "Availability is required")
    .max(50, "Availability must be less than 100 characters")
    .trim(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateProduct = z.infer<typeof CreateProductSchema>;
