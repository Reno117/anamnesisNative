import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  verses: defineTable({
    userId: v.string(),
    book: v.string(),
    chapter: v.number(),
    verseStart: v.number(),
    verseEnd: v.optional(v.number()),
    translation: v.string(),
    text: v.string(),
    addedAt: v.number(),
    tags: v.optional(v.array(v.string())),
    isMemorized: v.optional(v.boolean()), // optional so existing rows don't break
    lastReviewedAt: v.optional(v.number()),  // <-- add this


  })
    .index("by_user", ["userId"])
    .index("by_user_book", ["userId", "book"]),

  memoryProgress: defineTable({
    userId: v.string(),
    verseId: v.id("verses"),
    masteryLevel: v.number(),
    nextReviewAt: v.number(),
    lastReviewedAt: v.optional(v.number()),
    reviewCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_due", ["userId", "nextReviewAt"]),

  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(),
    ownerType: v.union(v.literal("user"), v.literal("group")),
    isPublic: v.boolean(),
  }).index("by_owner", ["ownerId"]),

  collectionVerses: defineTable({
    collectionId: v.id("collections"),
    verseId: v.id("verses"),
    addedBy: v.string(),
    addedAt: v.number(),
    order: v.optional(v.number()),
  })
    .index("by_collection", ["collectionId"])
    .index("by_verse", ["verseId"]),

  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    inviteCode: v.optional(v.string()),
  }),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"]),
})