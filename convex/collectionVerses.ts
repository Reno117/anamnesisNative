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

    // Only return collections owned by this user
    return collections.filter((c) => c && c.ownerId === userId)
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
    const entries = await ctx.db
      .query("collectionVerses")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect()
    const entry = entries.find((e) => e.verseId === verseId)
    if (!entry) return

    // Only the person who added it can remove it (admin check comes later for groups)
    if (entry.addedBy !== userId) return

    await ctx.db.delete(entry._id)
  },
})