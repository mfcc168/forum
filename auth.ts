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
      try {
        if (session.user && token.sub) {
          session.user.id = token.sub
          // Populate user role from JWT token
          if (token.role) {
            session.user.role = token.role as 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
          } else {
            // Fallback to member if no role is set
            session.user.role = 'member'
          }
          // Map NextAuth image to avatar field for UI consistency
          if (session.user.image && !('avatar' in session.user)) {
            Object.assign(session.user, { avatar: session.user.image })
          }
        }
        return session
      } catch (error) {
        console.error('Error in session callback:', error)
        // Return session even if there's an error, but with safe defaults
        if (session.user) {
          session.user.role = 'member'
          if (token.sub) {
            session.user.id = token.sub
          }
        }
        return session
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.sub = user.id
        }
        
        // Query database for user role on first JWT generation
        if (token.sub && !token.role) {
          try {
            const client = await clientPromise
            const db = client.db(process.env.MONGODB_DB || 'minecraft_server')
            
            // More robust user lookup with timeout
            const dbUser = await Promise.race([
              db.collection('users').findOne({
                $or: [
                  { discordId: token.sub },
                  { email: token.email },
                  { 'providers.discord.id': token.sub }
                ]
              }, {
                // Only fetch the role field for performance
                projection: { role: 1 },
                maxTimeMS: 5000 // 5 second timeout
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 5000)
              )
            ])
            
            if (dbUser && typeof dbUser === 'object' && 'role' in dbUser) {
              token.role = dbUser.role || 'member'
            } else {
              // User doesn't exist in database, set default role
              token.role = 'member'
            }
          } catch (error) {
            console.error('Error fetching user role in JWT callback:', error)
            console.error('JWT callback error type:', error instanceof Error ? error.constructor.name : 'Unknown')
            console.error('JWT callback error message:', error instanceof Error ? error.message : 'Unknown error')
            // Ensure we always set a role to avoid infinite loops
            token.role = 'member'
            console.log('JWT callback: Using fallback role "member" due to database error')
          }
        }
        
        return token
      } catch (error) {
        console.error('Error in JWT callback:', error)
        // Ensure we return a valid token even on error
        return { ...token, role: token.role || 'member' }
      }
    },
    async signIn() {
      // User creation handled in API routes to avoid Edge Runtime MongoDB limitations
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)