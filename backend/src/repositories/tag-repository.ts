import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { tags } from '../db/schema';
import type {
  CreateTagInput,
  Tag,
  TagRepository,
  UpdateTagInput,
} from '../application/tags/contracts';

type DatabaseTag = typeof tags.$inferSelect;

function toTag(record: DatabaseTag): Tag {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    metadata: record.metadata,
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
    deletedAt: record.deleted_at ?? null,
  };
}

export class DrizzleTagRepository implements TagRepository {
  async list(): Promise<Tag[]> {
    const records = await db.select().from(tags).orderBy(desc(tags.created_at));
    return records.map(toTag);
  }

  async findById(id: string): Promise<Tag | undefined> {
    const [record] = await db.select().from(tags).where(eq(tags.id, id));
    return record ? toTag(record) : undefined;
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const [record] = await db.insert(tags).values(input).returning();
    if (!record) throw new Error('Tag creation did not return a record.');
    return toTag(record);
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag | undefined> {
    const [record] = await db
      .update(tags)
      .set({ ...input, updated_at: new Date() })
      .where(eq(tags.id, id))
      .returning();
    return record ? toTag(record) : undefined;
  }

  async delete(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }
}
