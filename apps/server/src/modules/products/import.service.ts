import { parseCsv } from "./csv.parser.js";
import { Product, ImportResult, ImportOptions } from "./product.entity.js";
import { ProductRepository } from "./product.repository.js";

export class ProductImportService {
  private readonly FIELD_ALIASES = {
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

  constructor(private productRepository: ProductRepository) {}

  async importFromCsv(
    csvFile: string,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const { batchSize = 50, skipErrors = true, onProgress, onError } = options;

    console.log("Starting CSV import process...");

    // Parse CSV
    const csvData = await parseCsv(csvFile);

    const results: ImportResult = {
      processed: 0,
      inserted: 0,
      updated: 0,
      errors: [],
    };

    // Process in batches
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(csvData.length / batchSize)}`,
      );

      await this.processBatch(batch, i, results, {
        onProgress,
        onError,
        skipErrors,
      });

      // Small delay between batches
      if (i + batchSize < csvData.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.logSummary(results);
    return results;
  }

  private async processBatch(
    batch: Record<string, any>[],
    startIndex: number,
    results: ImportResult,
    options: {
      onProgress?: ImportOptions["onProgress"];
      onError?: ImportOptions["onError"];
      skipErrors: boolean;
    },
  ): Promise<void> {
    for (let j = 0; j < batch.length; j++) {
      const rowIndex = startIndex + j;
      const row = batch[j];

      try {
        const normalizedProduct = this.transformRowToProduct(row!);
        const result = await this.productRepository.upsert(normalizedProduct);

        if (result.action === "inserted") {
          results.inserted++;
        } else {
          results.updated++;
        }

        results.processed++;

        if (options.onProgress) {
          options.onProgress(
            results.processed,
            batch.length,
            normalizedProduct,
          );
        }

        console.log(
          `✓ ${result.action} product: ${normalizedProduct.product_code} - ${normalizedProduct.name}`,
        );
      } catch (error) {
        await this.handleError(error, row, rowIndex, results, options);
      }
    }
  }

  private async handleError(
    error: unknown,
    row: any,
    rowIndex: number,
    results: ImportResult,
    options: { onError?: ImportOptions["onError"]; skipErrors: boolean },
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`✗ Error processing row ${rowIndex + 1}: ${errorMessage}`);

    results.errors.push({
      index: rowIndex,
      error: errorMessage,
      row,
    });

    if (options.onError) {
      options.onError(
        error instanceof Error ? error : new Error(errorMessage),
        row,
        rowIndex,
      );
    }

    if (!options.skipErrors) {
      throw error;
    }
  }

  private transformRowToProduct(row: Record<string, any>): Product {
    return {
      product_code: this.getValue(row, this.FIELD_ALIASES.product_code),
      name: this.getValue(row, this.FIELD_ALIASES.name),
      description: this.getValue(row, this.FIELD_ALIASES.description) ?? "",
      price: Number(this.getValue(row, this.FIELD_ALIASES.price)) || 0,
      discount_price:
        Number(this.getValue(row, this.FIELD_ALIASES.discount_price)) ||
        undefined,
      currency: this.getValue(row, this.FIELD_ALIASES.currency) ?? "lei",
      brand: this.getValue(row, this.FIELD_ALIASES.brand) ?? "",
      advertiser: this.getValue(row, this.FIELD_ALIASES.advertiser) ?? "",
      category: "",
      subcategory: this.getValue(row, this.FIELD_ALIASES.subcategory) ?? "",
      affiliate_link: this.normalizeLink(
        this.getValue(row, this.FIELD_ALIASES.affiliate_link),
      ),
      image_url: this.getValue(row, this.FIELD_ALIASES.image_url),
      availability:
        this.getValue(row, this.FIELD_ALIASES.availability) ?? "unknown",
    };
  }

  private getValue(row: Record<string, any>, aliases: string[]): any {
    for (const key of aliases) {
      if (key in row && row[key] != null) {
        return row[key];
      }
    }
    return undefined;
  }

  private normalizeLink(link: string | undefined): string {
    if (!link) return "";
    return link.startsWith("http") ? link : `https:${link}`;
  }

  private logSummary(results: ImportResult): void {
    console.log("\n=== Import Summary ===");
    console.log(`Total rows processed: ${results.processed}`);
    console.log(`Products inserted: ${results.inserted}`);
    console.log(`Products updated: ${results.updated}`);
    console.log(`Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log("\nErrors:");
      results.errors.forEach(({ index, error }) => {
        console.log(`Row ${index + 1}: ${error}`);
      });
    }
  }
}
