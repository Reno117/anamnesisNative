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