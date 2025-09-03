import { Card } from '@/app/components/ui/Card'
import { Icon } from '@/app/components/ui/Icon'
import Link from 'next/link'
import { WikiDetailContent } from '@/app/components/pages/wiki/WikiDetailContent'

interface WikiDetailPageProps {
  params: Promise<{ slug: string }>
}

// Server-side data fetching function
async function getWikiGuideData(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Fetch specific wiki guide by slug using dedicated API endpoint
    const guideRes = await fetch(`${baseUrl}/api/wiki/guides/${slug}`, { 
      next: { 
        revalidate: 10, // Revalidate every 10 seconds for faster updates (consistent with blog/forum)
        tags: [`wiki-guide-${slug}`] // Add cache tag for targeted revalidation
      }
    })

    if (!guideRes.ok) {
      if (guideRes.status === 404) {
        return {
          guide: null,
          error: 'Wiki guide not found'
        }
      }
      throw new Error('Failed to fetch wiki guide')
    }

    const result = await guideRes.json()


    return {
      guide: result.success ? result.data.guide : null,
      error: !result.success ? result.message || 'Wiki guide not found' : null
    }
  } catch (error) {
    console.error('Error fetching wiki guide data:', error)
    return {
      guide: null,
      error: 'Failed to load wiki guide'
    }
  }
}

export default async function WikiDetailPage({ params }: WikiDetailPageProps) {
  const { slug } = await params
  const { guide, error } = await getWikiGuideData(slug)

  // Handle error states server-side
  if (error || !guide) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <Icon name="book" className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {error || 'Wiki guide not found'}
            </h1>
            <p className="text-slate-600 mb-4">
              The wiki guide you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <p className="text-xs text-slate-400 mb-4">Slug: {slug}</p>
            <Link href="/wiki" className="text-emerald-600 hover:text-emerald-700">
              ← Back to Wiki
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <WikiDetailContent 
      slug={slug}
      initialGuide={guide}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: WikiDetailPageProps) {
  const { slug } = await params
  const { guide } = await getWikiGuideData(slug)
  
  if (!guide) {
    return {
      title: 'Wiki Guide Not Found',
      description: 'The requested wiki guide could not be found.',
    }
  }

  // Get title and description - content is stored as simple markdown string
  const title = guide.title || 'Wiki Guide'
  const description = guide.excerpt || guide.metaDescription || 'A helpful guide for the Minecraft server'

  return {
    title: `${title} | Wiki`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      publishedTime: guide.publishedAt,
    },
  }
}
