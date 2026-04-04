import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const listCollections = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect()

    // For each collection, get the verse count
    const withCounts = await Promise.all(
      collections.map(async (col) => {
        const verses = await ctx.db
          .query("collectionVerses")
          .withIndex("by_collection", (q) => q.eq("collectionId", col._id))
          .collect()
        return { ...col, verseCount: verses.length }
      })
    )

    return withCounts.sort((a, b) => {
      // Uncategorized always last
      if (a.name === "Uncategorized") return 1
      if (b.name === "Uncategorized") return -1
      return a.name.localeCompare(b.name)
    })
  },
})

export const getCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    return await ctx.db.get(collectionId)
  },
})

export const createCollection = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, description }) => {
    return await ctx.db.insert("collections", {
      name: name.trim(),
      description,
      ownerId: userId,
      ownerType: "user",
      isPublic: false,
    })
  },
})

export const updateCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { collectionId, name, description }) => {
    await ctx.db.patch(collectionId, { name: name.trim(), description })
  },
})

export const deleteCollection = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    // Delete all collectionVerses entries first
    const entries = await ctx.db
      .query("collectionVerses")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect()
    await Promise.all(entries.map((e) => ctx.db.delete(e._id)))
    await ctx.db.delete(collectionId)
  },
})

// Ensures every user always has an Uncategorized collection
export const ensureUncategorized = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect()
    const hasUncategorized = existing.some((c) => c.name === "Uncategorized")
    if (!hasUncategorized) {
      return await ctx.db.insert("collections", {
        name: "Uncategorized",
        ownerId: userId,
        ownerType: "user",
        isPublic: false,
      })
    }
    return existing.find((c) => c.name === "Uncategorized")!._id
  },
})