CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"discount_price" numeric(10, 2),
	"currency" text DEFAULT 'lei' NOT NULL,
	"brand" text NOT NULL,
	"advertiser" text NOT NULL,
	"category" text,
	"subcategory" text NOT NULL,
	"affiliate_link" text NOT NULL,
	"image_url" text NOT NULL,
	"availability" text DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_product_code_unique" UNIQUE("product_code")
);
