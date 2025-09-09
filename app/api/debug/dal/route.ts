import { NextResponse } from 'next/server'

/**
 * Test the actual Data Access Layer (DAL) that the app uses
 * GET /api/debug/dal
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Test importing the DAL
    console.log('Testing DAL import...')
    const { DAL } = await import('@/lib/database/dal')
    console.log('DAL imported successfully')
    
    results.dalImport = 'success'

    // Test each module
    const tests = [
      {
        name: 'blog',
        test: async () => {
          const posts = await DAL.blog.getPosts({ limit: 5 })
          return { count: posts.length, hasData: posts.length > 0 }
        }
      },
      {
        name: 'forum', 
        test: async () => {
          const posts = await DAL.forum.getPosts({ limit: 5 })
          return { count: posts.length, hasData: posts.length > 0 }
        }
      },
      {
        name: 'wiki',
        test: async () => {
          const guides = await DAL.wiki.getGuides({ limit: 5 })
          return { count: guides.length, hasData: guides.length > 0 }
        }
      },
      {
        name: 'dex',
        test: async () => {
          const monsters = await DAL.dex.getMonsters({ limit: 5 })
          return { count: monsters.length, hasData: monsters.length > 0 }
        }
      }
    ]

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name} DAL...`)
        const result = await test.test()
        console.log(`${test.name} result:`, result)
        results.tests[test.name] = { status: 'success', ...result }
      } catch (error) {
        console.error(`${test.name} DAL error:`, error)
        results.tests[test.name] = { 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

  } catch (error) {
    console.error('DAL test failed:', error)
    results.dalImport = 'failed'
    results.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json({
    success: true,
    data: results,
    message: 'DAL testing completed'
  })
}