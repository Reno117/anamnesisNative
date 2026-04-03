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