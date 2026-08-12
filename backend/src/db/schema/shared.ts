

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  uuid,
  serial,
  index,
  uniqueIndex,
  primaryKey,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  uuid,
  serial,
  index,
  uniqueIndex,
  primaryKey,
  customType,
  relations,
};

export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
});

export const createdUpdated = {
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  deleted_at: timestamp('deleted_at'),
};