import Papa from "papaparse";

export async function parseCsv(file: string): Promise<any[]> {
  try {
    const res = await fetch(file);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    }

    const csv = await res.text();

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
