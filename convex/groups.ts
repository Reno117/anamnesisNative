import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no confusable chars
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const createGroup = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { userId, name }) => {
    const inviteCode = generateInviteCode()
    const groupId = await ctx.db.insert("groups", {
      name,
      createdBy: userId,
      createdAt: Date.now(),
      inviteCode,
    })
    // Creator is automatically admin
    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    })
    return { groupId, inviteCode }
  },
})

export const getGroupByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    return await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("inviteCode"), inviteCode))
      .first()
  },
})

export const joinGroupByCode = mutation({
  args: { userId: v.string(), inviteCode: v.string() },
  handler: async (ctx, { userId, inviteCode }) => {
    const group = await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("inviteCode"), inviteCode))
      .first()

    if (!group) return { error: "Invalid invite code" }

    // Check if already a member
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first()

    if (existing) return { error: "Already a member" }

    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId,
      role: "member",
      joinedAt: Date.now(),
    })

    return { groupId: group._id, groupName: group.name }
  },
})

export const leaveGroup = mutation({
  args: { userId: v.string(), groupId: v.id("groups") },
  handler: async (ctx, { userId, groupId }) => {
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first()

    if (!membership) return { error: "Not a member" }

    // If leaving user is admin, promote longest-standing member
    if (membership.role === "admin") {
      const otherMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .filter((q) => q.neq(q.field("userId"), userId))
        .collect()

      if (otherMembers.length === 0) {
        // Last member — dissolve the group and its collections
        const collections = await ctx.db
          .query("collections")
          .withIndex("by_owner", (q) => q.eq("ownerId", groupId))
          .collect()
        for (const col of collections) {
          const entries = await ctx.db
            .query("collectionVerses")
            .withIndex("by_collection", (q) => q.eq("collectionId", col._id))
            .collect()
          await Promise.all(entries.map((e) => ctx.db.delete(e._id)))
          await ctx.db.delete(col._id)
        }
        await ctx.db.delete(membership._id)
        await ctx.db.delete(groupId)
        return { dissolved: true }
      }

      // Promote earliest joiner
      const next = otherMembers.sort((a, b) => a.joinedAt - b.joinedAt)[0]
      await ctx.db.patch(next._id, { role: "admin" })
    }

    await ctx.db.delete(membership._id)
    return { success: true }
  },
})

export const removeMember = mutation({
  args: {
    adminUserId: v.string(),
    groupId: v.id("groups"),
    targetUserId: v.string(),
  },
  handler: async (ctx, { adminUserId, groupId, targetUserId }) => {
    // Verify requester is admin
    const adminMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) => q.eq(q.field("userId"), adminUserId))
      .first()

    if (!adminMembership || adminMembership.role !== "admin") {
      return { error: "Not authorized" }
    }

    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) => q.eq(q.field("userId"), targetUserId))
      .first()

    if (!targetMembership) return { error: "Member not found" }
    await ctx.db.delete(targetMembership._id)
    return { success: true }
  },
})

export const regenerateInviteCode = mutation({
  args: { adminUserId: v.string(), groupId: v.id("groups") },
  handler: async (ctx, { adminUserId, groupId }) => {
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) => q.eq(q.field("userId"), adminUserId))
      .first()

    if (!membership || membership.role !== "admin") {
      return { error: "Not authorized" }
    }

    const newCode = generateInviteCode()
    await ctx.db.patch(groupId, { inviteCode: newCode })
    return { inviteCode: newCode }
  },
})

export const getGroupMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect()
    return members
  },
})

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    return await ctx.db.get(groupId)
  },
})

export const getUserGroups = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const group = await ctx.db.get(m.groupId)
        return group ? { ...group, role: m.role } : null
      })
    )

    return groups.filter(Boolean)
  },
})