import { Paper } from "../types";

export interface LibraryRepository {
  getAll(): Promise<Paper[]>;
  save(paper: Paper): Promise<void>;
  remove(paperId: string): Promise<void>;
  isSaved(paperId: string): Promise<boolean>;
}

// LocalStorage implementation
const STORAGE_KEY = "research_helper_library";

export class LocalStorageLibraryRepository implements LibraryRepository {
  private getStorage(): Record<string, Paper> {
    if (typeof window === "undefined") return {};
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStorage(data: Record<string, Paper>) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  async getAll(): Promise<Paper[]> {
    const data = this.getStorage();
    return Object.values(data);
  }

  async save(paper: Paper): Promise<void> {
    const data = this.getStorage();
    data[paper.id] = paper;
    this.setStorage(data);
  }

  async remove(paperId: string): Promise<void> {
    const data = this.getStorage();
    delete data[paperId];
    this.setStorage(data);
  }

  async isSaved(paperId: string): Promise<boolean> {
    const data = this.getStorage();
    return !!data[paperId];
  }
}

// Export a singleton instance
export const libraryRepo = new LocalStorageLibraryRepository();
