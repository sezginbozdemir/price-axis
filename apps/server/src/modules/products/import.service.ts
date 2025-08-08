import { parseCsv } from "./csv.parser.js";
import type { ImportResult, ImportOptions } from "./product.entity.js";
import { ProductRepository } from "./product.repository.js";
import { ProductTransformer } from "./product.transformer.js";
import { ProductValidator } from "./product.validator.js";
import { createLogger } from "@repo/shared";

const fileLogger = createLogger("product import service", {
  enableFile: true,
  enableConsole: false,
});

const logger = createLogger("product import service");
export class ProductImportService {
  constructor(
    private productRepository: ProductRepository,
    private productTransformer: ProductTransformer,
    private productValidator: ProductValidator,
  ) {}

  async importFromCsv(
    csvFile: string,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const { batchSize = 50, skipErrors = true, onProgress, onError } = options;

    logger.info("Starting CSV import process...");
    logger.startTimer("import-csv");
    fileLogger.info(`=== CSV Import Started: ${csvFile} ===`);
    fileLogger.startTimer("import-csv");

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
      logger.info(
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
    logger.endTimer("import-csv");
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
        const validatedProduct =
          this.productValidator.validate(normalizedProduct);
        const result = await this.productRepository.upsert(validatedProduct);

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

        logger.info(
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
    logger.error(`✗ Error processing row ${rowIndex + 1}: ${errorMessage}`);

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
    fileLogger.endTimer("import-csv");
    fileLogger.info("=== Import Summary ===");
    fileLogger.info(`Total rows processed: ${results.processed}`);
    fileLogger.info(`Products inserted: ${results.inserted}`);
    fileLogger.info(`Products updated: ${results.updated}`);
    fileLogger.info(`Errors: ${results.errors.length}`);

    logger.info("=== Import Summary ===");
    logger.info(`Total rows processed: ${results.processed}`);
    logger.info(`Products inserted: ${results.inserted}`);
    logger.info(`Products updated: ${results.updated}`);
    logger.info(`Errors: ${results.errors.length}`);
    if (results.errors.length > 0) {
      fileLogger.warn("Errors detail:");
      logger.warn("Errors detail:");
      results.errors.forEach(({ index, error }) => {
        logger.warn(`Row ${index + 1}: ${error}`);
        fileLogger.warn(`Row ${index + 1}: ${error}`);
      });
    }
  }
}
