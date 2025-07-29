import { ProductImportService } from "#modules/products/import.service.js";
import { ProductRepository } from "#modules/products/product.repository.js";
import { ProductTransformer } from "#modules/products/product.transformer.js";
import { ProductValidator } from "#modules/products/product.validator.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runImport() {
  const productRepository = new ProductRepository();
  const productTransformer = new ProductTransformer();
  const productValidator = new ProductValidator();
  const productImportService = new ProductImportService(
    productRepository,
    productTransformer,
    productValidator,
  );

  const csvPath = path.resolve(__dirname, "../assets/csv/feed.csv");

  try {
    const result = await productImportService.importFromCsv(csvPath);
    console.log("Import completed successfully:", result);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runImport();
}
