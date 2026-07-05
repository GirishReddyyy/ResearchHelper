import { LibraryRepository } from "./libraryRepository";
import { Paper } from "../types";
import { getMongoClient } from "../mongodb";

const DB_NAME = "research_helper";
const COLLECTION_NAME = "library";

export class MongoLibraryRepository implements LibraryRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db(DB_NAME).collection<Paper>(COLLECTION_NAME);
  }

  async save(paper: Paper): Promise<void> {
    const collection = await this.getCollection();
    // Use upsert to avoid duplicates
    await collection.updateOne(
      { id: paper.id },
      { $set: paper },
      { upsert: true }
    );
  }

  async remove(id: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteOne({ id });
  }

  async isSaved(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ id }, { limit: 1 });
    return count > 0;
  }

  async getAll(): Promise<Paper[]> {
    const collection = await this.getCollection();
    const cursor = collection.find({});
    const results = await cursor.toArray();
    // Strip the MongoDB internal _id field so we only return the standard Paper object
    return results.map(({ _id, ...paper }) => paper as unknown as Paper);
  }
}

export const mongoLibraryRepo = new MongoLibraryRepository();
