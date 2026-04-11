import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getVersesInCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    const entries = await ctx.db
      .query("collectionVerses")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect()

    const verses = await Promise.all(
      entries.map(async (entry) => {
        const verse = await ctx.db.get(entry.verseId)
        return verse ? { ...verse, entryId: entry._id, addedBy: entry.addedBy } : null
      })
    )

    return verses.filter(Boolean)
  },
})

export const getCollectionsForVerse = query({
  args: { verseId: v.id("verses"), userId: v.string() },
  handler: async (ctx, { verseId, userId }) => {
    const entries = await ctx.db
      .query("collectionVerses")
      .withIndex("by_verse", (q) => q.eq("verseId", verseId))
      .collect()

    const collections = await Promise.all(
      entries.map((e) => ctx.db.get(e.collectionId))
    )

    // Get groups the user belongs to
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
    const groupIds = memberships.map((m) => m.groupId)

    // Return collections owned by user OR by a group the user belongs to
    return collections.filter((c) => {
      if (!c) return false
      if (c.ownerType === "user" && c.ownerId === userId) return true
      if (c.ownerType === "group" && groupIds.includes(c.ownerId as any)) return true
      return false
    })
  },
})

export const addVerseToCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    verseId: v.id("verses"),
    userId: v.string(),
  },
  handler: async (ctx, { collectionId, verseId, userId }) => {
    // Prevent duplicates
    const existing = await ctx.db
      .query("collectionVerses")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect()
    const alreadyIn = existing.some((e) => e.verseId === verseId)
    if (alreadyIn) return

    await ctx.db.insert("collectionVerses", {
      collectionId,
      verseId,
      addedBy: userId,
      addedAt: Date.now(),
    })
  },
})
export const removeVerseFromCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    verseId: v.id("verses"),
    userId: v.string(),
  },
  handler: async (ctx, { collectionId, verseId, userId }) => {
    const col = await ctx.db.get(collectionId)
    if (!col) return

    const entry = await ctx.db
      .query("collectionVerses")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .filter((q) => q.eq(q.field("verseId"), verseId))
      .first()

    if (!entry) return

    // Check permission: added by user OR group admin
    const isAdder = entry.addedBy === userId
    let isAdmin = false

    if (col.ownerType === "group") {
      const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", col.ownerId as any))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first()
      isAdmin = membership?.role === "admin"
    }

    if (!isAdder && !isAdmin) return

    await ctx.db.delete(entry._id)
  },
})