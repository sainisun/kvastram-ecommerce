export interface Tag {
  id: string;
  name: string;
  slug: string;
  metadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface CreateTagInput {
  name: string;
  slug: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
}

export interface TagRepository {
  list(): Promise<Tag[]>;
  findById(id: string): Promise<Tag | undefined>;
  create(input: CreateTagInput): Promise<Tag>;
  update(id: string, input: UpdateTagInput): Promise<Tag | undefined>;
  delete(id: string): Promise<void>;
}

export interface TagService {
  list(): Promise<Tag[]>;
  getForAudit(id: string): Promise<Tag | undefined>;
  create(input: CreateTagInput): Promise<Tag>;
  update(id: string, input: UpdateTagInput): Promise<Tag | undefined>;
  delete(id: string): Promise<void>;
}
