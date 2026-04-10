import { v } from "convex/values";
import { BOOK_ID_MAP } from "../constants/bible-books";
import { action, mutation, query } from "./_generated/server";

const verseFields = {
  book: v.string(),
  chapter: v.number(),
  verseStart: v.number(),
  verseEnd: v.optional(v.number()),
  translation: v.string(),
  text: v.string(),
  tags: v.optional(v.array(v.string())),
};

export const listVerses = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("verses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const addVerse = mutation({
  args: { userId: v.string(), ...verseFields },
  handler: async (ctx, args) => {
    const verseId = await ctx.db.insert("verses", {
      ...args,
      addedAt: Date.now(),
    });

    // Auto-add to Uncategorized collection
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    const uncategorized = collections.find((c) => c.name === "Uncategorized");
    if (uncategorized) {
      await ctx.db.insert("collectionVerses", {
        collectionId: uncategorized._id,
        verseId,
        addedBy: args.userId,
        addedAt: Date.now(),
      });
    }

    return verseId;
  },
});
export const addVerses = mutation({
  args: {
    userId: v.string(),
    verses: v.array(v.object(verseFields)),
  },
  handler: async (ctx, { userId, verses }) => {
    const ids = await Promise.all(
      verses.map((v) =>
        ctx.db.insert("verses", { ...v, userId, addedAt: Date.now() }),
      ),
    );
    return ids;
  },
});

export const removeVerse = mutation({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    await ctx.db.delete(verseId);
  },
});

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
    await ctx.db.patch(verseId, fields);
  },
});

export const toggleMemorized = mutation({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    const verse = await ctx.db.get(verseId);
    if (!verse) return;
    await ctx.db.patch(verseId, {
      isMemorized: !verse.isMemorized,
      lastReviewedAt: Date.now(),
    });
  },
});

export const markReviewed = mutation({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    await ctx.db.patch(verseId, { lastReviewedAt: Date.now() });
  },
});

export const getVerse = query({
  args: { verseId: v.id("verses") },
  handler: async (ctx, { verseId }) => {
    return await ctx.db.get(verseId);
  },
});

export const verseStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const verses = await ctx.db
      .query("verses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const total = verses.length;
    const memorized = verses.filter((v) => v.isMemorized).length;
    const remaining = total - memorized;

    const now = Date.now();
    const REVIEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    const needsReview = verses.filter((v) => {
      if (!v.isMemorized) return false;
      if (!v.lastReviewedAt) return true;
      return now - v.lastReviewedAt > REVIEW_THRESHOLD_MS;
    });

    const byBook: Record<string, { total: number; memorized: number }> = {};
    for (const verse of verses) {
      if (!byBook[verse.book]) byBook[verse.book] = { total: 0, memorized: 0 };
      byBook[verse.book].total++;
      if (verse.isMemorized) byBook[verse.book].memorized++;
    }

    return { total, memorized, remaining, byBook, needsReview };
  },
});

export const getVerseText = action({
  args: {
    book: v.string(),
    chapter: v.number(),
    verseStart: v.number(),
    verseEnd: v.optional(v.number()),
    translation: v.union(
      v.literal("ESV"),
      v.literal("NIV"),
      v.literal("CSB"),
      v.literal("NASB"),
      v.literal("KJV"),
      v.literal("BSB"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Unauthorized" };

    const esvApiKey = process.env.ESV_API_KEY ?? "";
    const bibleApiKey = process.env.BIBLE_API_KEY ?? "";

    const passage = args.verseEnd
      ? `${args.book} ${args.chapter}:${args.verseStart}-${args.verseEnd}`
      : `${args.book} ${args.chapter}:${args.verseStart}`;

    const bookCode = BOOK_ID_MAP[args.book];
    if (!bookCode) return { error: `Unsupported book: ${args.book}` };

    try {
      switch (args.translation) {
        case "ESV": {
          const res = await fetch(
            `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(passage)}&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false`,
            { headers: { Authorization: `Token ${esvApiKey}` } },
          );
          const data = await res.json();
          const text = data.passages?.[0]?.trim();
          if (!text) return { error: "Verse not found" };
          return { text };
        }

        case "NIV":
        case "CSB":
        case "NASB": {
          const bibleIds: Record<string, string> = {
            NIV: "78a9f6124f344018-01",
            CSB: "a556c6ee0d4c1c95-01",
            NASB: "a761ca71b4ef4f7c-01",
          };
          const bibleId = bibleIds[args.translation];
          const passageId = args.verseEnd
            ? `${bookCode}.${args.chapter}.${args.verseStart}-${bookCode}.${args.chapter}.${args.verseEnd}`
            : `${bookCode}.${args.chapter}.${args.verseStart}`;

          const res = await fetch(
            `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}?content-type=text&include-verse-numbers=false`,
            { headers: { "api-key": bibleApiKey } },
          );
          const data = await res.json();
          console.log("API.Bible response:", JSON.stringify(data, null, 2));

          const text = data?.data?.content?.trim();
          if (!text) return { error: "Verse not found" };
          return { text };
        }

        default:
          return { error: "Invalid translation" };
      }
    } catch (err) {
      console.error("getVerseText error:", err);
      return { error: "Request failed" };
    }
  },
});
