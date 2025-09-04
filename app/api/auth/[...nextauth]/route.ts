import { handlers } from "@/auth"

export const runtime = 'nodejs'

// Export handlers with explicit error handling
export const GET = handlers.GET
export const POST = handlers.POST