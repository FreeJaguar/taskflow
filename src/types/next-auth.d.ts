import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      workspaceId?: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: string
    workspaceId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    workspaceId?: string
  }
}