import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

const verseFields = {
  book: v.string(),
  chapter: v.number(),
  verseStart: v.number(),
  verseEnd: v.optional(v.number()),
  translation: v.string(),
  text: v.string(),
  tags: v.optional(v.array(v.string())),
}

export const listVerses = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("verses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()
  },
})

export const addVerse = mutation({
  args: { userId: v.string(), ...verseFields },
  handler: async (ctx, args) => {
    return await ctx.db.insert("verses", {
      ...args,
      addedAt: Date.now(),
    })
  },
})

export const addVerses = mutation({
  args: {
    userId: v.string(),
    verses: v.array(v.object(verseFields)),
  },
  handler: async (ctx, { userId, verses }) => {
    const ids = await Promise.all(
      verses.map((v) =>
        ctx.db.insert("verses", { ...v, userId, addedAt: Date.now() })
      )
    )
    return ids
  },
})

export const removeVerse = mutation({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    await ctx.db.delete(verseId)
  },
})

export const updateVerse = mutation({
  args: {
    verseId: v.id("verses"),
    book: v.string(),
    chapter: v.number(),
    verseStart: v.number(),
    verseEnd: v.optional(v.number()),
    translation: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { verseId, ...fields }) => {
    await ctx.db.patch(verseId, fields)
  },
})

export const toggleMemorized = mutation({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    const verse = await ctx.db.get(verseId)
    if (!verse) return
    await ctx.db.patch(verseId, {
      isMemorized: !verse.isMemorized,
      lastReviewedAt: Date.now(),
    })
  },
})

export const markReviewed = mutation({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    await ctx.db.patch(verseId, { lastReviewedAt: Date.now() })
  },
})

export const getVerse = query({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    return await ctx.db.get(verseId)
  },
})


export const verseStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const verses = await ctx.db
      .query("verses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const total = verses.length
    const memorized = verses.filter((v) => v.isMemorized).length
    const remaining = total - memorized

    const now = Date.now()
    const REVIEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

    const needsReview = verses.filter((v) => {
      if (!v.isMemorized) return false
      if (!v.lastReviewedAt) return true
      return now - v.lastReviewedAt > REVIEW_THRESHOLD_MS
    })

    const byBook: Record<string, { total: number; memorized: number }> = {}
    for (const verse of verses) {
      if (!byBook[verse.book]) byBook[verse.book] = { total: 0, memorized: 0 }
      byBook[verse.book].total++
      if (verse.isMemorized) byBook[verse.book].memorized++
    }

    return { total, memorized, remaining, byBook, needsReview }
  },
})