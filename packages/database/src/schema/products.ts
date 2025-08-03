import { pgTable, text, numeric, timestamp, uuid } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  product_code: text("product_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discount_price: numeric("discount_price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("lei"),
  brand: text("brand").notNull(),
  advertiser: text("advertiser").notNull(),
  category: text("category"),
  subcategory: text("subcategory").notNull(),
  affiliate_link: text("affiliate_link").notNull(),
  image_url: text("image_url").notNull(),
  availability: text("availability").notNull().default("unknown"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Type inference for TypeScript
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
