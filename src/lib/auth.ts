import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDatabase } from "./cloudflare";
import { users } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Create auth config factory for D1
async function createAuthConfig() {
  const db = await getDatabase();
  
  return {
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" as const },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
      }),
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const db = await getDatabase();
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email as string),
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        },
      }),
    ],
    cookies: {
      pkceCodeVerifier: {
        name: "next-auth.pkce.code_verifier",
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
    callbacks: {
      async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
        if (user) {
          token.id = user.id;
        }
        if (account) {
          token.accessToken = account.access_token;
        }
        return token;
      },
      async session({ session, token }: { session: any; token: any }) {
        if (session.user) {
          session.user.id = token.id as string;
        }
        return session;
      },
    },
  };
}

// Export auth handlers that work with D1
export async function getAuthHandlers() {
  const config = await createAuthConfig();
  return NextAuth(config);
}

// For middleware and server components that need auth
export async function auth() {
  const { auth: authFn } = await getAuthHandlers();
  return authFn();
}
