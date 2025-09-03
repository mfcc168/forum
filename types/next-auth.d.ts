import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
      avatar?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
    avatar?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
  }
}