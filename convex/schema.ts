import {defineSchema, defineTable} from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    verses: defineTable({
        verse: v.string(),
    }),

})