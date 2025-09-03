import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import type { NextAuthConfig } from "next-auth"
import clientPromise from "@/lib/database/connection/mongodb"

// NextAuth configuration optimized for Edge Runtime
export const config = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        // Populate user role from JWT token
        if (token.role) {
          session.user.role = token.role as 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
        }
        // Map NextAuth image to avatar field for UI consistency
        if (session.user.image && !('avatar' in session.user)) {
          Object.assign(session.user, { avatar: session.user.image })
        }
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id
      }
      
      // Query database for user role on first JWT generation
      if (token.sub && !token.role) {
        try {
          const client = await clientPromise
          const db = client.db('minecraft_server')
          const dbUser = await db.collection('users').findOne({
            $or: [
              { discordId: token.sub },
              { email: token.email }
            ]
          })
          if (dbUser) {
            token.role = dbUser.role || 'member'
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          token.role = 'member'
        }
      }
      
      return token
    },
    async signIn({ user, account, profile }) {
      // User creation handled in API routes to avoid Edge Runtime MongoDB limitations
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)