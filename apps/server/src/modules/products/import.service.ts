import { parseCsv } from "./csv.parser.js";
import { ImportResult, ImportOptions } from "./product.entity.js";
import { ProductRepository } from "./product.repository.js";
import { ProductTransformer } from "./product.transformer.js";

export class ProductImportService {
  constructor(
    private productRepository: ProductRepository,
    private productTransformer: ProductTransformer,
  ) {}

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
      if (!row) {
        await this.handleError(
          new Error("Invalid or missing row"),
          row,
          rowIndex,
          results,
          options,
        );

        continue;
      }

      try {
        const normalizedProduct = this.productTransformer.transform(row);
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
