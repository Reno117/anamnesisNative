import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectTo ?? "http://localhost:8081";
    },
  },
});
