import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listCollections = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Personal collections
    const personal = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect()

    // Group collections the user belongs to
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const groupCollections = (
      await Promise.all(
        memberships.map(async (m) => {
          const cols = await ctx.db
            .query("collections")
            .withIndex("by_owner", (q) => q.eq("ownerId", m.groupId))
            .collect()
          return cols.map((c) => ({ ...c, role: m.role }))
        })
      )
    ).flat()

    const all = [
      ...personal.map((c) => ({ ...c, role: "owner" as const, isShared: false })),
      ...groupCollections.map((c) => ({ ...c, isShared: true })),
    ]

    // Attach verse counts
    const withCounts = await Promise.all(
      all.map(async (col) => {
        const verses = await ctx.db
          .query("collectionVerses")
          .withIndex("by_collection", (q) => q.eq("collectionId", col._id))
          .collect()
        return { ...col, verseCount: verses.length }
      })
    )

    return withCounts.sort((a, b) => {
      if (a.name === "Uncategorized") return 1
      if (b.name === "Uncategorized") return -1
      return a.name.localeCompare(b.name)
    })
  },
})

export const getCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    return await ctx.db.get(collectionId);
  },
});

export const createCollection = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, { userId, name, description, groupId }) => {
    return await ctx.db.insert("collections", {
      name: name.trim(),
      description,
      ownerId: groupId ?? userId,
      ownerType: groupId ? "group" : "user",
      isPublic: false,
    })
  },
})

export const deleteCollection = mutation({
  args: { collectionId: v.id("collections"), userId: v.string() },
  handler: async (ctx, { collectionId, userId }) => {
    const col = await ctx.db.get(collectionId)
    if (!col) return

    if (col.ownerType === "group") {
      const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", col.ownerId as any))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first()
      if (!membership || membership.role !== "admin") return { error: "Not authorized" }
    } else {
      if (col.ownerId !== userId) return { error: "Not authorized" }
    }

    const entries = await ctx.db
      .query("collectionVerses")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect()
    await Promise.all(entries.map((e) => ctx.db.delete(e._id)))
    await ctx.db.delete(collectionId)
  },
})

export const updateCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { collectionId, userId, name, description }) => {
    const col = await ctx.db.get(collectionId)
    if (!col) return

    if (col.ownerType === "group") {
      const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", col.ownerId as any))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first()
      if (!membership || membership.role !== "admin") return { error: "Not authorized" }
    } else {
      if (col.ownerId !== userId) return { error: "Not authorized" }
    }

    await ctx.db.patch(collectionId, { name: name.trim(), description })
  },
})
// Ensures every user always has an Uncategorized collection
export const ensureUncategorized = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const hasUncategorized = existing.some((c) => c.name === "Uncategorized");
    if (!hasUncategorized) {
      return await ctx.db.insert("collections", {
        name: "Uncategorized",
        ownerId: userId,
        ownerType: "user",
        isPublic: false,
      });
    }
    return existing.find((c) => c.name === "Uncategorized")!._id;
  },
});
