import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "@shared/schema";
import type { InsertUser } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export class UsersRepository {
  async list(executor: Executor = getDb()) {
    return executor
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(asc(users.username));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async findByUsername(username: string, executor: Executor = getDb()) {
    const [user] = await executor
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    return user ?? null;
  }

  async findByEmail(email: string, executor: Executor = getDb()) {
    const [user] = await executor
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return user ?? null;
  }

  async create(data: InsertUser, executor: Executor = getDb()) {
    const [user] = await executor.insert(users).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<InsertUser>, executor: Executor = getDb()) {
    const [user] = await executor
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return user ?? null;
  }

  async deactivate(id: string, executor: Executor = getDb()) {
    const [user] = await executor
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return user ?? null;
  }

  async activate(id: string, executor: Executor = getDb()) {
    const [user] = await executor
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return user ?? null;
  }
}
