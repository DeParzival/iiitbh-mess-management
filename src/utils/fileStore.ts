import fs from 'fs';
import path from 'path';

/**
 * Utility for reading and writing JSON data files.
 * Acts as a simple file-based database.
 *
 * On Vercel (serverless), the deployment filesystem is read-only.
 * We copy seed data to /tmp on first access so writes work within
 * a single function invocation / warm instance.
 */

const IS_VERCEL = !!process.env.VERCEL;
const TMP_DATA_DIR = '/tmp/mess-data';

function getSourceDataDir(): string {
  // In compiled output (dist/utils/), go up to project root, then src/data
  return path.join(__dirname, '..', 'data');
}

function ensureTmpData(filename: string): string {
  const tmpPath = path.join(TMP_DATA_DIR, filename);

  if (!fs.existsSync(TMP_DATA_DIR)) {
    fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
  }

  // Copy seed data to /tmp if it doesn't exist there yet
  if (!fs.existsSync(tmpPath)) {
    const sourcePath = path.join(getSourceDataDir(), filename);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, tmpPath);
    } else {
      // Create empty array/object as fallback
      fs.writeFileSync(tmpPath, '[]', 'utf-8');
    }
  }

  return tmpPath;
}

export class FileStore<T> {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  private getFilePath(): string {
    if (IS_VERCEL) {
      return ensureTmpData(this.filename);
    }
    return path.join(getSourceDataDir(), this.filename);
  }

  /** Read all data from the JSON file */
  read(): T {
    try {
      const filePath = this.getFilePath();
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Error reading ${this.filename}:`, err);
      throw new Error(`Failed to read data file: ${this.filename}`);
    }
  }

  /** Write data to the JSON file (overwrites) */
  write(data: T): void {
    try {
      const filePath = this.getFilePath();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${this.filename}:`, err);
      throw new Error(`Failed to write data file: ${this.filename}`);
    }
  }
}
