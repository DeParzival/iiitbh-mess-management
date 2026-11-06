import fs from 'fs';
import path from 'path';

/**
 * Utility for reading and writing JSON data files.
 * Acts as a simple file-based database.
 */
export class FileStore<T> {
  private filePath: string;

  constructor(filename: string) {
    this.filePath = path.join(__dirname, '..', 'data', filename);
  }

  /** Read all data from the JSON file */
  read(): T {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Error reading ${this.filePath}:`, err);
      throw new Error(`Failed to read data file: ${this.filePath}`);
    }
  }

  /** Write data to the JSON file (overwrites) */
  write(data: T): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${this.filePath}:`, err);
      throw new Error(`Failed to write data file: ${this.filePath}`);
    }
  }
}
