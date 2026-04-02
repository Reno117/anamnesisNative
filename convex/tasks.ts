import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("verses").collect();
  },
});


export const update = mutation({
  args: {
    body: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("verses", {
      verse: args.body
    });
  },
});


export const removeVerse = mutation({
  args: {id: v.id("verses")},
  handler: async (ctx, args) => {
    await ctx.db.delete("verses", args.id);
  },
});

/*
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUserId(ctx);
    console.log("My user: ", user)
    if (!user) return null
    return await ctx.db.get(user)
  }
})
  */