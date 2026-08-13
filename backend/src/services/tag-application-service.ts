import { TagApplicationService } from '../application/tags/tag-service';
import { DrizzleTagRepository } from '../repositories/tag-repository';

export const tagApplicationService = new TagApplicationService(
  new DrizzleTagRepository()
);
