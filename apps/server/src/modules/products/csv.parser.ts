import Papa from "papaparse";
import fs from "fs";

export async function parseCsv(file: string): Promise<any[]> {
  try {
    const csvFile = fs.readFileSync(file);

    const csv = csvFile.toString();

    return new Promise((resolve, reject) => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimitersToGuess: [",", "\t", "|", ";"],
        complete: (result) => {
          if (result.errors.length > 0) {
            console.warn("CSV parsing warnings:", result.errors);
          }
          resolve(result.data);
        },
        error: (error: any) => reject(error),
      });
    });
  } catch (error) {
    throw new Error(
      `CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
