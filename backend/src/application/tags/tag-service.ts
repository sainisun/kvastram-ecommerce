import type {
  CreateTagInput,
  Tag,
  TagRepository,
  TagService,
  UpdateTagInput,
} from './contracts';

export class TagApplicationService implements TagService {
  constructor(private readonly repository: TagRepository) {}

  list(): Promise<Tag[]> {
    return this.repository.list();
  }

  getForAudit(id: string): Promise<Tag | undefined> {
    return this.repository.findById(id);
  }

  create(input: CreateTagInput): Promise<Tag> {
    return this.repository.create(input);
  }

  update(id: string, input: UpdateTagInput): Promise<Tag | undefined> {
    return this.repository.update(id, input);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
