# CRITICAL: Module Permission Requirements

## Wiki, Blog, Forum, and Dex Permission Model

**IMPORTANT**: The four content modules have DIFFERENT permission requirements that must be consistently enforced across all layers:

### Permission Requirements:
1. **Wiki**: Admin-only for create/edit/delete guides. Members can only view.
2. **Blog**: Admin-only for create/edit/delete posts. Members can only view.
3. **Forum**: 
   - All members can create posts
   - Members can edit/delete their OWN posts
   - Admins can edit/delete ANY post
   - **Replies**: All members can reply to any post (unless post is locked)
   - Members can edit/delete their OWN replies
   - Admins can edit/delete ANY reply
4. **Dex**: Admin-only for create/edit/delete monsters. Members can only view. (Same as Wiki/Blog)

### Implementation Consistency Requirements:
When implementing features across Wiki/Blog/Forum/Dex:
1. **First**: Comprehensively understand all layers (API routes, pages, components, schemas, DAL, database, types, hooks)
2. **Second**: Compare implementations to find inconsistencies
3. **Third**: Choose the best practice pattern and apply it consistently
4. **Fourth**: Remove ALL backward compatibility code - no legacy patterns should remain
5. **Fifth**: After completing changes, run `npx tsc` and `npm run lint` to check for errors
6. **Sixth**: Fix any errors while maintaining consistency across modules

### When fixing errors, ALWAYS check for consistency:
**IMPORTANT**: When you find an error in one module (e.g., dal/blog.ts), immediately check the corresponding files in the other modules (dal/forum.ts, dal/wiki.ts, and dal/dex.ts):
1. If they have the same problem - fix all four consistently
2. If they DON'T have the same problem - investigate why there's inconsistency
3. Choose the best implementation pattern and apply it to all four modules
4. This ensures all modules remain consistent and follow the same patterns

### Module-Specific Method Naming
When implementing methods that interact with specific modules (wiki/blog/forum/dex), always use module-specific prefixes:

✅ **Correct**: 
- `recordForumView()`, `recordBlogView()`, `recordWikiView()`, `recordDexView()`
- `getForumPosts()`, `getBlogPosts()`, `getWikiGuides()`, `getDexMonsters()`
- `createForumPost()`, `createBlogPost()`, `createWikiGuide()`, `createDexMonster()`

❌ **Wrong**: 
- `recordView()` (ambiguous - which module?)
- `getPosts()` (could be forum or blog posts)
- `createPost()` (unclear module)

### No Backward Compatibility or Legacy Code Policy
**CRITICAL**: Never leave deprecated or legacy code in the codebase. When updating methods or patterns:
1. Remove all old implementations immediately
2. Update all references to use the new pattern
3. Do not create aliases or backward compatibility layers
4. Clean removal is better than maintaining legacy code

### Deep Analysis Checklist
When performing deep analysis to fix inconsistencies between wiki/blog/forum/dex:

1. **API Routes**: 
   - Permissions enforcement (admin vs member)
   - Response formats (success/error patterns)
   - Rate limiting (requests per minute)
   - Status checking (only return published content)

2. **DAL Methods**: 
   - Module-specific naming (e.g., recordForumView not recordView)
   - Consistent error handling
   - Matching return types
   - Same aggregation patterns

3. **React Hooks**: 
   - Consistent useQuery patterns
   - Same cache strategies (staleTime, gcTime)
   - Unified error handling
   - Loading states

4. **Component Structure**:
   - Forms follow same field patterns
   - Lists use same filtering/pagination
   - Detail views have consistent layouts

5. **Schemas**:
   - Validation rules match (content length, required fields)
   - Field names are consistent
   - Meta fields align (metaDescription length)

6. **Types**:
   - Interface naming patterns
   - Property structures match
   - Shared base types utilized

## Special Requirements for Dex Module (3D Content)

The **Dex module** follows all standard consistency patterns while adding **unique 3D model functionality**. This requires special considerations:

### 3D Model Architecture Requirements

#### ✅ MAINTAIN CONSISTENCY:
- Use same permission system as Wiki/Blog (admin-only create/edit/delete)
- Follow identical form, hook, and schema patterns
- Use standard DAL naming: `getDexMonsters()`, `recordDexView()`, etc.
- Implement same API response formats and error handling

#### 🎨 3D-SPECIFIC EXTENSIONS:
1. **Enhanced Schema Fields**:
   ```typescript
   // Additional fields for 3D functionality (extend base patterns)
   modelPath: string              // Path to .gltf 3D model file
   modelScale: number             // Scale multiplier (0.01-10.0)
   camera: {                      // Camera position for optimal viewing
     position: { x, y, z }
     lookAt: { x, y, z }
   }
   ```

2. **3D Model Viewer Component**:
   ```typescript
   // Lazy-loaded Three.js component (SSR-safe)
   const ModelViewer = lazy(() => import('./ModelViewer'))
   
   // Features:
   - Dynamic Three.js loading (no SSR issues)
   - Interactive 3D editing in forms
   - Optimized model loading and caching
   - Responsive canvas sizing
   ```

3. **3D Form Integration**:
   ```typescript
   // DexForm extends ContentForm with 3D preview
   <ContentForm<DexMonster>
     config={dexFormConfig}
     item={monster}
     customComponents={{
       modelPreview: <ModelViewer editMode={true} />
     }}
   />
   ```

### 3D Implementation Patterns

#### **Model Loading Strategy**:
```typescript
// ✅ CORRECT: Lazy load Three.js to avoid SSR issues
const loadThreeJS = async () => {
  const THREE = await import('three')
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  return { THREE, GLTFLoader }
}

// ❌ WRONG: Direct imports break SSR
import * as THREE from 'three' // Don't do this
```

#### **Model Storage & Organization**:
```bash
# Organized model storage structure
public/
  models/
    monsters/
      *.gltf          # 3D model files
      textures/       # Associated textures
```

#### **Performance Optimizations**:
- Use `.gltf` format for optimal loading
- Implement model caching strategies
- Lazy load 3D viewer components
- Optimize model file sizes (<2MB recommended)

### 3D Consistency Rules

#### **DO**: Extend Standard Patterns
- ✅ Use `ContentForm` with 3D field extensions
- ✅ Follow DAL naming: `incrementDexViewCount()`
- ✅ Use centralized permission system
- ✅ Implement standard React Query caching

#### **DON'T**: Break Core Architecture
- ❌ Create separate permission systems for 3D content
- ❌ Bypass standard form/validation patterns
- ❌ Use different response formats for 3D APIs
- ❌ Ignore accessibility for 3D viewers

### Development Workflow for 3D Features

1. **Start with Standard Module Pattern**:
   - Implement standard CRUD operations first
   - Use existing blog/wiki patterns as template
   - Add 3D fields to schemas incrementally

2. **Add 3D Extensions**:
   - Extend schemas with model-specific fields
   - Create lazy-loaded 3D viewer component
   - Integrate with existing form system

3. **Test Compatibility**:
   - Verify SSR/hydration works correctly
   - Test performance with multiple models
   - Ensure accessibility standards met

This approach ensures the Dex module maintains **perfect consistency** with other modules while providing **cutting-edge 3D functionality**.

## Always Use Absolute Imports with @/

When importing files in this project, always use absolute imports with the `@/` prefix instead of relative paths (`./` or `../`).

### ✅ Correct Usage
```tsx
import { Component } from '@/components/Component'
import { useAuth } from '@/lib/hooks/useAuth'
import { api } from '@/services/api'
```

### ❌ Avoid
```tsx
import { Component } from './components/Component'
import { useAuth } from '../../lib/hooks/useauth'
import { api } from '../services/api'
```

## Translations (i18n)

All text content must support both Traditional Chinese (zh-TW) and English (en) languages.

### Translation File Structure
```
lib/
  translations/
    locales/
      en.ts    # English translations
      zh-TW.ts # Traditional Chinese translations
```

### Example Translation Usage
```tsx
// In locale files
// en.ts
export default {
  welcome: {
    title: 'Welcome',
    description: 'Getting started...'
  }
}

// zh-TW.ts
export default {
  welcome: {
    title: '歡迎',
    description: '開始使用...'
  }
}

// In components
import { useTranslation } from '@/lib/translations'

const { t } = useTranslation()
<h1>{t.welcome.title}</h1>
```

This ensures:
- Consistent import patterns across the project
- Easier file refactoring and movement
- Better code maintainability
- Clearer dependency tracking
- Less error-prone imports
- Simplified path resolution
- Full bilingual support (Traditional Chinese and English)

# Application Architecture

## SSR + CSR Hybrid Rendering Pattern

**CRITICAL**: This application uses a sophisticated **Server-Side Rendering (SSR) + Client-Side Rendering (CSR) hybrid architecture** that provides optimal performance and user experience.

### Architecture Overview

```
1. Server: Pre-render pages with initial data → Fast SEO-friendly pages
2. Client: Hydrate with React → Interactive components
3. Search: Client-side filtering → Instant search results (0-5ms)
4. Background: React Query → Fresh data updates when needed
```

### Key Benefits

**SEO & Performance:**
- ✅ **Full server rendering** for search engines and social media
- ✅ **Fast initial page loads** with complete content
- ✅ **Optimal Core Web Vitals** scores
- ✅ **Social sharing** with proper meta tags

**User Experience:**
- ✅ **Instant search** without API calls during typing
- ✅ **Smooth interactions** with no loading states during search
- ✅ **Offline functionality** once page loads
- ✅ **Progressive enhancement** - works without JavaScript

**Developer Experience:**
- ✅ **Type-safe data flow** from server to client
- ✅ **Consistent patterns** across all modules
- ✅ **Predictable performance** regardless of server load
- ✅ **Simple debugging** with clear data sources

### Implementation Pattern

#### Server-Side (SSR)
```typescript
// Pages receive initial data via getServerSideProps
export async function getServerSideProps() {
  const initialPosts = await fetchPostsFromDatabase()
  const initialCategories = await fetchCategoriesFromDatabase()
  
  return {
    props: {
      initialPosts,     // ✅ Pre-rendered for SEO
      initialCategories // ✅ Pre-rendered for SEO
    }
  }
}
```

#### Client-Side Hydration
```typescript
export function BlogContent({ initialPosts = [] }) {
  // ✅ Uses SSR data initially, then hydrates seamlessly
  const blogQuery = useBlogPosts({
    sortBy: 'latest',
    status: 'published',
    initialData: initialPosts  // 🔑 SSR data used here
  });
  
  // ✅ Instant client-side search on hydrated data
  return (
    <ClientSearchFilter
      data={blogQuery.data || initialPosts}
      searchQuery={searchQuery}
      filters={{ category: selectedCategory }}
    >
      {(filteredPosts) => <BlogList posts={filteredPosts} />}
    </ClientSearchFilter>
  )
}
```

### Search Architecture

**IMPORTANT**: All modules use **client-side search** for optimal UX:

```typescript
// ✅ CORRECT: Instant client-side filtering
<ClientSearchFilter
  data={posts}                    // Already loaded data
  searchQuery={searchQuery}       // User input
  filters={{ category }}          // Additional filters
  searchFields={['title', 'content', 'excerpt']}
>
  {(filteredData) => <YourListComponent data={filteredData} />}
</ClientSearchFilter>

// ❌ DEPRECATED: Server-side search (removed)
// const searchResults = useBlogSearch(query) // Caused flickering UX
```

### Data Flow Pattern

```
Page Load Flow:
Server → Pre-render with data → Client hydration → Interactive search

Search Flow:
User types → Client filter (0-5ms) → Instant results → No API calls

Background Updates:
React Query → Stale data refresh → Cache update → Seamless UI update
```

### Module Consistency

All four content modules follow identical patterns:

1. **Blog**: SSR posts → Client search → Instant filtering
2. **Forum**: SSR posts → Client search → Instant filtering  
3. **Wiki**: SSR guides → Client search → Instant filtering
4. **Dex**: SSR monsters → Client search → Instant filtering

### Performance Metrics

**Before (Server-Side Search):**
- Initial Load: ~800ms + Search: 200-500ms per keystroke
- Loading states, API calls, flickering UX

**After (SSR + CSR Hybrid):**
- Initial Load: ~800ms + Search: 0-5ms per keystroke
- No loading states, no API calls, smooth UX

### Error Handling

```typescript
// Production-ready error boundaries included
<SafeClientSearchFilter
  data={posts}
  searchQuery={searchQuery}
  // Graceful fallback if search fails
>
  {(filteredPosts) => <PostList posts={filteredPosts} />}
</SafeClientSearchFilter>
```

### Search Component Usage

**IMPORTANT**: Always use `ClientSearchFilter` for search functionality:

```typescript
// ✅ PRODUCTION: Use SafeClientSearchFilter for error resilience
import { SafeClientSearchFilter } from '@/app/components/shared'

<SafeClientSearchFilter
  data={posts}
  searchQuery={searchQuery}
  filters={{ category: selectedCategory }}
  searchFields={['title', 'content', 'excerpt']}
  categoryField="category"
>
  {(filteredPosts) => <PostList posts={filteredPosts} />}
</SafeClientSearchFilter>

// ✅ DEVELOPMENT: Use ClientSearchFilter for direct access
import { ClientSearchFilter } from '@/app/components/shared'

<ClientSearchFilter
  data={posts}
  searchQuery={searchQuery}
  filters={{ category: selectedCategory }}
>
  {(filteredPosts) => <PostList posts={filteredPosts} />}
</ClientSearchFilter>

// ✅ HOOK VERSION: For components needing filtered data directly
import { useClientSearchFilter } from '@/app/components/shared'

const filteredPosts = useClientSearchFilter(posts, searchQuery, { 
  category: selectedCategory 
})
```

**Key Features:**
- ✅ **0-5ms filtering time** - Instant results
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Error resilient** - Graceful failure handling
- ✅ **Memory efficient** - Optimized algorithms
- ✅ **Module agnostic** - Works with Blog, Forum, Wiki, Dex

**This hybrid architecture delivers enterprise-level performance with simple implementation.**

# Development Guidelines

> This document outlines the conventions and requirements for the Minecraft Server Website project.

## Naming Conventions

### DAL Method Naming
**Important**: Each module uses semantically appropriate terminology:
- **Forum DAL**: `getPosts()`, `getPostBySlug()`, `createPost()`, `updatePost()`, `deletePost()`
- **Blog DAL**: `getPosts()`, `getPostBySlug()`, `createPost()`, `updatePost()`, `deletePost()`
- **Wiki DAL**: `getGuides()`, `getGuideBySlug()`, `createGuide()`, `updateGuide()`, `deleteGuide()`
- **Dex DAL**: `getMonsters()`, `getMonsterBySlug()`, `createMonster()`, `updateMonster()`, `deleteMonster()`

#### Intentional Naming Differences (✅ Correct)
These distinctions are **intentional and appropriate**:
- **Forum/Blog**: Use "posts" - user-generated content and articles
- **Wiki**: Uses "guides" - instructional content that teaches users how to play
- **Dex**: Uses "monsters" - 3D creature/entity data with game statistics

#### Required Consistency Patterns (✅ Must Follow)
All modules **MUST** maintain these patterns:
- **Method prefixes**: Module-specific (`recordBlogView`, `recordForumView`, `recordDexView`)
- **API routes**: Follow `/api/[module]/[content-type]/` pattern
- **Hook naming**: `use[Module][ContentType]()` format
- **Permission system**: All use centralized `PermissionChecker`
- **Response format**: All use `ApiResponse.success/error`

### Component Import Consistency
**Important**: Always use direct imports for components:
- ✅ Correct: `import { ForumForm } from '@/app/components/forum/ForumForm'`
- ✅ Correct: `import { BlogForm } from '@/app/components/blog/BlogForm'`
- ✅ Correct: `import { WikiForm } from '@/app/components/wiki/WikiForm'`

This ensures clear dependency tracking and easier refactoring.

### Import Statement Rules
**CRITICAL**: All imports must be at the top of the file. Never use inline imports in type signatures or return types.

#### ✅ Correct Import Pattern
```typescript
import type { BlogStats } from '@/lib/types'
import { DAL } from '@/lib/database/dal'

async function getStats(): Promise<BlogStats> {
  // implementation
}
```

#### ❌ NEVER Use Inline Imports in Types
```typescript
// ❌ WRONG: Never use inline imports in type signatures
async function getStats(): Promise<import('@/lib/types').BlogStats> {
  // implementation
}

// ❌ WRONG: Never use inline imports in parameters
function processData(data: import('@/lib/types').UserData) {
  // implementation  
}
```

#### ✅ Acceptable Dynamic Imports
Dynamic imports are acceptable ONLY for these specific use cases:
```typescript
// ✅ OK: Conditional/environment-specific imports
if (process.env.NODE_ENV === 'development') {
  const { initializeWebSocketServer } = await import('@/lib/websocket/server')
}

// ✅ OK: Server-side only imports
if (typeof window === 'undefined') {
  const { getServerUser } = await import('@/lib/auth/server')
}

// ✅ OK: Lazy loading for performance (with TODO for proper DAL)
const { db } = await import('@/lib/database/connection')
```

**Why this rule exists:**
- Improves code readability and maintainability
- Makes dependencies explicit and trackable
- Enables better IDE support and refactoring
- Follows TypeScript best practices
- Makes it easier to identify and manage imports

## Database Connection

### MongoDB Configuration
Always use MongoDB connection string from `.env` file. Never hardcode database credentials.

### Environment Variables Structure
```bash
# .env
MONGODB_URI=your_mongodb_connection_string_here
MONGODB_DB=minecraft_server
```

### Example Database Usage
```tsx
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI!)
const db = client.db(process.env.MONGODB_DB)

// Always use try-catch for database operations
try {
  await client.connect()
  const collection = db.collection('users')
  // ... database operations
} catch (error) {
  console.error('Database connection failed:', error)
} finally {
  await client.close()
}
```

### Environment Variables Checklist
- [ ] Create `.env` file in project root
- [ ] Add `.env` to `.gitignore`
- [ ] Include `.env.example` in repository
- [ ] Load environment variables

## Server Configuration

### Port Configuration
Always run the development server on port 3000. If the port is already in use:

1. Find the process using port 3000:
```bash
lsof -i :3000
```

2. Kill the existing process:
```bash
kill -9 <PID>
```

3. Start the server again:
```bash
npm run dev
```

❌ Don't change the default port. Keep it at 3000 for consistency.

### Common Port Issues
- If `npm run dev` fails to start, check if another instance is running
- Use `killall node` as a last resort to kill all Node.js processes
- Always check terminal output for port

# Database Schema & Architecture

> This project uses a redesigned MongoDB schema optimized for performance and scalability.

## Database Architecture

### Schema Design Patterns
The database uses modern document-oriented patterns:

1. **Embedded Documents** - User references and stats embedded for performance
2. **Hierarchical Paths** - Category paths like "general/announcements" for efficient filtering  
3. **Soft Deletes** - Data recovery with `isDeleted` flags
4. **Embedded Statistics** - Real-time stats stored directly in documents
5. **Full-Text Search** - Optimized search index collection

### Core Collections

#### Users Collection
```typescript
interface User {
  profile: UserProfile           // Rich profile with avatar, bio, minecraft data
  stats: UserStats              // Posts, replies, likes, reputation, level
  preferences: UserPreferences  // Language, theme, notifications
  providers: AuthProviders      // Multi-provider auth (Discord, etc.)
  role: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
  status: 'active' | 'suspended' | 'banned'
}
```

## Data Access Patterns

### Always Use the Data Access Layer (DAL)
```typescript
// ✅ Use DAL - handles embedded data, stats, validation
import { DAL } from '@/lib/database/dal'
const posts = await DAL.forum.getPosts({ categoryId, status: 'published' })

// ❌ Don't query MongoDB directly
const posts = await db.collection('forumPosts').find({ categoryId }).toArray()
```

### Leverage Embedded Data
```typescript
// ✅ Use embedded author data (no extra query needed)
const authorName = post.author.username
const authorAvatar = post.author.avatar

// ❌ Don't do additional user lookups
const author = await db.collection('users').findOne({ _id: post.author._id })
```

### Use Atomic Statistics Updates
```typescript
// ✅ Atomic stats updates via statsManager
import { statsManager } from '@/lib/database/stats'
await statsManager.recordInteraction(userId, targetId, targetType, 'like')

// ✅ Alternative: Use DAL interaction methods
await DAL.forum.recordInteraction(userId, postId, 'post', 'like')

// ❌ Manual stat updates (race conditions possible)
await db.collection('forumPosts').updateOne(
  { _id: postId },
  { $inc: { 'stats.likes': 1 } }
)
```

## API Route Patterns

### Use Enhanced Validation Middleware
```typescript
// ✅ Use withDALAndValidation wrapper for validation, auth, rate limiting
import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { createPostSchema } from '@/lib/schemas/forum'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'

export const POST = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: {
    user?: ServerUser;
    validatedData: z.infer<typeof createPostSchema>;
    dal: typeof DAL;
  }) => {
    // Pre-validated data, authenticated user, DAL instance
    const result = await dal.forum.createPost(validatedData, user.id)
    return ApiResponse.success({ post: result }, 'Post created successfully')
  },
  {
    schema: createPostSchema,  // Zod validation
    auth: 'required',         // Authentication required
    rateLimit: { requests: 5, window: '1m' }  // Rate limiting
  }
)

// ❌ Manual validation and error handling
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // ... manual validation and error handling
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Consistent API Response Format
```typescript
// ✅ Use ApiResponse utility with consistent data wrapping
return ApiResponse.success({ post: createdPost }, 'Post created successfully')
return ApiResponse.success({ posts, pagination }, 'Posts retrieved successfully')
return ApiResponse.success(null, 'Post deleted successfully') // For DELETE operations
return ApiResponse.error('Validation failed', 400, validationDetails)

// ❌ Inconsistent response formats
return NextResponse.json({ success: true, data })
return NextResponse.json({ error: 'Something went wrong' })
return ApiResponse.success({ success: true }) // Don't use generic success flags
```

### Standard API Response Patterns

#### Individual Resource Operations (GET /api/posts/[slug])
```typescript
// ✅ Correct format
return ApiResponse.success({ post: postData })
return ApiResponse.success({ guide: guideData })
return ApiResponse.success({ reply: replyData })

// ❌ Inconsistent
return ApiResponse.success(postData)
return ApiResponse.success({ data: postData })
```

#### Collection Operations (GET /api/posts)
```typescript
// ✅ Correct format with pagination
return ApiResponse.success({
  posts: postsArray,
  pagination: { page, limit, total, totalPages },
  filters: { category, search, sortBy }
})
```

#### Create Operations (POST)
```typescript
// ✅ Return created resource
return ApiResponse.success({ post: createdPost }, 'Post created successfully')

// ❌ Don't just return ID
return ApiResponse.success({ id: postId }, 'Post created')
```

#### Update Operations (PUT)
```typescript
// ✅ Return updated resource
return ApiResponse.success({ post: updatedPost }, 'Post updated successfully')
```

#### Delete Operations (DELETE)
```typescript
// ✅ Return null for successful deletions
return ApiResponse.success(null, 'Post deleted successfully')
```

### View Count Increment Patterns

Always use consistent view count handling across all content types:

```typescript
// ✅ Correct: Use statsManager for authenticated users
import { statsManager } from '@/lib/database/stats'

// For authenticated users - prevents duplicate views
if (user) {
  await statsManager.recordForumView(user.id, post.id)     // Forum posts
  await statsManager.recordBlogView(user.id, post.id)      // Blog posts
  await statsManager.recordWikiView(user.id, guide.id)     // Wiki guides
} else {
  // For anonymous users - increment directly
  await dal.forum.incrementViewCount(post.id)
  await dal.blog.incrementViewCount(post.slug)
  await dal.wiki.incrementViewCount(guide.id)
}

// ❌ Don't mix different approaches
await dal.forum.recordInteraction(user.id, post.id, 'post', 'view')
```

## React Patterns

### Always Use DAL + React Query Pattern

**CRITICAL**: Never use direct fetch() calls or manual database queries. Always combine DAL (Data Access Layer) with React Query for all data operations.

```typescript
// ✅ CORRECT: Use DAL + React Query + Client Search
import { useForum, useCategories, useCurrentUser } from '@/lib/hooks/useForum'
import { useReplies, useCreateReply } from '@/lib/hooks/useReplies'
import { ClientSearchFilter } from '@/app/components/shared'

// Data fetching with intelligent caching and SSR support
const { data: posts, error, isLoading } = useForum({
  category: 'announcements',
  sortBy: 'popular',
  initialData: initialPosts  // ✅ SSR data for hydration
})

// Client-side search for instant results
<ClientSearchFilter
  data={posts}
  searchQuery={searchQuery}
  filters={{ category: selectedCategory }}
  searchFields={['title', 'content', 'excerpt']}
>
  {(filteredPosts) => <PostList posts={filteredPosts} />}
</ClientSearchFilter>

// Mutations with automatic cache updates
const createPostMutation = useCreatePost()
await createPostMutation.mutateAsync(postData)

// ❌ DEPRECATED: Server-side search hooks (removed for performance)
// const searchResults = useForumSearch(searchQuery) // Caused flickering UX

// ❌ NEVER DO: Direct fetch() calls
const [posts, setPosts] = useState([])
const [loading, setLoading] = useState(true)
useEffect(() => {
  fetch('/api/posts').then(res => res.json()).then(setPosts)
}, [])

// ❌ NEVER DO: Direct database queries
const posts = await db.collection('posts').find().toArray()
```

### Data Access Layer (DAL) Requirements

All API routes must use the DAL pattern with proper validation:

```typescript
// ✅ CORRECT: API Route with DAL
import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { createPostSchema } from '@/lib/schemas/forum'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'

export const POST = withDALAndValidation(
  async (request: NextRequest, { dal, user, validatedData }: { 
    dal: typeof DAL; 
    user?: ServerUser; 
    validatedData: z.infer<typeof createPostSchema> 
  }) => {
    const result = await dal.forum.createPost(validatedData, user.id)
    return ApiResponse.success(result, 'Post created successfully')
  },
  {
    schema: createPostSchema,
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)

// ❌ NEVER DO: Direct MongoDB operations in API routes
export async function POST(request: Request) {
  const db = await connectToDatabase()
  const result = await db.collection('posts').insertOne(data)
}
```

### React Query Hook Standards

All data fetching must use React Query with proper caching:

```typescript
// ✅ CORRECT: React Query hooks with caching
export function useForum(options = {}) {
  return useQuery({
    queryKey: ['posts', options],
    queryFn: async () => {
      const response = await fetch(`/api/forum/posts?${params}`)
      const result = await response.json()
      return result.success ? result.data : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
}

// Mutations with automatic cache invalidation
export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return response.json()
    },
    onSuccess: () => {
      // Auto-invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] })
      toast.success('Post created successfully!')
    }
  })
}
```

### Component Data Fetching Pattern

```typescript
// ✅ CORRECT: SSR + CSR Hybrid with Client Search
import { useForum, useCurrentUser } from '@/lib/hooks/useForum'
import { ClientSearchFilter } from '@/app/components/shared'

export function ForumContent({ initialPosts = [] }) {
  // SSR data with React Query hydration
  const { data: posts, isLoading, error } = useForum({ 
    category: 'general',
    sortBy: 'latest',
    initialData: initialPosts  // ✅ SSR data for instant load
  })
  const { data: user } = useCurrentUser()
  
  // Client-side search state
  const [searchQuery, setSearchQuery] = useState('')
  
  if (isLoading && !posts?.length) return <LoadingSpinner />
  if (error) return <ErrorState error={error} />
  
  return (
    <div>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      
      {/* ✅ Instant client-side filtering */}
      <ClientSearchFilter
        data={posts || initialPosts}
        searchQuery={searchQuery}
        filters={{ category: selectedCategory }}
      >
        {(filteredPosts) => (
          <div>
            {filteredPosts.map(post => (
              <PostItem key={post._id} post={post} />
            ))}
          </div>
        )}
      </ClientSearchFilter>
    </div>
  )
}

// ❌ DEPRECATED: Server-side search (removed)
// const searchResults = useForumSearch(searchQuery) // Caused flickering

// ❌ NEVER DO: Manual useState + useEffect patterns
export function PostList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/posts').then(res => res.json()).then(setPosts).finally(() => setLoading(false))
  }, [])
}
```

### Performance Optimizations
```typescript
// ✅ Use React.memo for expensive components
const PostItem = memo(({ post, onDelete }) => {
  return <div>...</div>
})

// ✅ Use useCallback for event handlers
const handleDelete = useCallback(async (postId: string) => {
  await deletePost(postId)
}, [deletePost])

// ✅ Use loading states and error boundaries
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorState error={error} onRetry={refetch} />
```

### Modern UI Components
```typescript
// ✅ Use enhanced UI components
import { LoadingSpinner, ErrorState, Skeleton } from '@/app/components/ui'
import { toast } from 'react-hot-toast'

// Replace alert() with toast notifications
toast.success('Post created successfully!')
toast.error('Failed to create post')

// Use proper loading states
{isLoading ? <Skeleton className="h-4 w-32" /> : <span>{data}</span>}
```

## Security & Validation

### Input Sanitization
```typescript
// ✅ HTML content is automatically sanitized via withDALAndValidation
// Content goes through isomorphic-dompurify for XSS prevention

// ✅ Use Zod schemas for validation
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string()).optional()
})
```

## TypeScript Quality Standards

### Avoid any and unknown Types

**CRITICAL**: Never use `any` or `unknown` types. Always define proper interfaces and types.

```typescript
// ❌ NEVER USE: any types
function processData(data: any): any {
  return data.something
}

// ❌ NEVER USE: unknown without proper type guards
function handleResponse(response: unknown) {
  return response.data // Type error
}

// ✅ CORRECT: Define proper interfaces
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

interface BlogPost {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  stats: {
    viewsCount: number
    likesCount: number
    bookmarksCount: number
  }
}

// ✅ CORRECT: Use proper types with type guards
function isApiResponse(obj: Record<string, unknown>): obj is ApiResponse<BlogPost> {
  return typeof obj === 'object' && 
         'success' in obj && 
         typeof obj.success === 'boolean'
}

function handleResponse(response: Record<string, unknown>): BlogPost | null {
  if (isApiResponse(response) && response.success) {
    return response.data
  }
  return null
}

// ✅ CORRECT: Generic functions with proper constraints
function processData<T extends Record<string, unknown>>(
  data: T,
  processor: (item: T) => T
): T {
  return processor(data)
}
```

### Type Safety Best Practices

#### 1. Always Define Return Types
```typescript
// ✅ CORRECT: Explicit return types
async function getForumPost(slug: string): Promise<ForumPost | null> {
  const post = await DAL.forum.getPostBySlug(slug)
  return post
}

// ❌ AVOID: Implicit return types
async function getForumPost(slug: string) {
  return await DAL.forum.getPostBySlug(slug)
}
```

#### 2. Use Type Assertions Carefully
```typescript
// ✅ CORRECT: Type assertions with validation
interface DatabaseUser {
  _id: string
  name: string
  email: string
}

function transformUser(dbUser: Record<string, unknown>): User {
  // Validate before asserting
  if (!dbUser._id || !dbUser.name || !dbUser.email) {
    throw new Error('Invalid user data from database')
  }
  
  return {
    id: dbUser._id as string,
    name: dbUser.name as string,
    email: dbUser.email as string
  }
}

// ❌ NEVER DO: Blind type assertion
function transformUser(dbUser: any): User {
  return dbUser as User // Dangerous!
}
```

#### 3. Proper Generic Constraints
```typescript
// ✅ CORRECT: Constrained generics
interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

function updateEntity<T extends BaseEntity>(
  entity: T, 
  updates: Partial<Omit<T, 'id' | 'createdAt'>>
): T {
  return { ...entity, ...updates, updatedAt: new Date().toISOString() }
}

// ❌ AVOID: Unconstrained generics leading to any
function updateEntity<T>(entity: T, updates: any): T {
  return { ...entity, ...updates }
}
```

#### 4. Database Response Types
```typescript
// ✅ CORRECT: Define MongoDB document interfaces
interface BlogPostDocument {
  _id: ObjectId
  title: string
  content: string
  slug: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  stats: {
    viewsCount: number
    likesCount: number
    bookmarksCount: number
  }
  createdAt: Date
  updatedAt: Date
}

// Transform function with proper typing
function transformBlogPost(doc: BlogPostDocument): BlogPost {
  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    slug: doc.slug,
    author: doc.author,
    stats: doc.stats,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  }
}

// ❌ NEVER DO: Using any for database documents
function transformBlogPost(doc: any): any {
  return doc
}
```

#### 5. API Route Parameter Types
```typescript
// ✅ CORRECT: Strongly typed API parameters
import { z } from 'zod'

const blogSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required')
})

type BlogSlugParams = z.infer<typeof blogSlugSchema>

export const GET = withDALAndValidation(
  async (request: NextRequest, { 
    user, 
    params, 
    dal 
  }: {
    user?: ServerUser
    params: Promise<BlogSlugParams>
    dal: typeof DAL
  }) => {
    const { slug } = await params
    const post = await dal.blog.getPostBySlug(slug)
    return ApiResponse.success({ post })
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// ❌ NEVER DO: Using any for parameters
export const GET = withDALAndValidation(
  async (request: any, { user, params, dal }: any) => {
    // Unsafe!
  }
)
```

### Type Quality Enforcement

#### Required TypeScript Compiler Options
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### ESLint Rules for Type Safety
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

### When You Need Dynamic Types

If you absolutely must handle dynamic data, use these patterns:

```typescript
// ✅ CORRECT: Use type guards
function isValidUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null &&
         'id' in obj && 
         'name' in obj
}

// ✅ CORRECT: Use branded types for IDs
type UserId = string & { __brand: 'UserId' }
type PostId = string & { __brand: 'PostId' }

function createUserId(id: string): UserId {
  return id as UserId
}

// ✅ CORRECT: Use discriminated unions
type ApiResponse<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: number }
```

**Remember**: Every `any` type is a potential runtime error. Always prefer explicit typing over convenience!

### Rate Limiting
```typescript
// ✅ Rate limiting built into API routes
export const POST = withDALAndValidation(handler, {
  rateLimit: { requests: 5, window: '1m' }  // 5 requests per minute
})
```

### Development Dependencies
Required packages are already installed:
- `isomorphic-dompurify` - HTML sanitization
- `@tanstack/react-query` - Data fetching and caching
- `zod` - Runtime validation
- `react-hot-toast` - Toast notifications

## React Query Hook Consistency

### Required Hooks for Each Module
Each module (blog, wiki, forum, dex) MUST have these hooks for consistency:

```typescript
// Main content hooks (implemented via useContent wrapper)
- use[Module]Posts/Guides/Monsters()  // Fetch with filters and pagination
- useInfinite[Module]Posts()          // Infinite scrolling
- use[Module]Post/Guide/Monster()     // Single item by slug
- useCreate[Module]Post()             // Create new
- useUpdate[Module]Post()             // Update existing
- useDelete[Module]Post()             // Delete
- use[Module]PostInteraction()        // Like, bookmark, share

// Module-specific hooks
- use[Module]Categories()             // Fetch categories
- use[Module]Stats()                  // Module statistics
- usePopular[Module]Posts()           // Popular content

// Additional hooks as needed
- useAdminPostAction()                // Admin actions (pin/lock for forum)
- use[Module]Search()                 // Dedicated search (optional)
- useDexModels()                      // 3D model list (dex only)
```

### Consistent Query Configuration
```typescript
// Category/stats queries (change rarely)
staleTime: 10 * 60 * 1000,  // 10 minutes
gcTime: 30 * 60 * 1000      // 30 minutes

// Content queries (change frequently)
staleTime: 5 * 60 * 1000,   // 5 minutes  
gcTime: 15 * 60 * 1000      // 15 minutes

// Popular content (moderate change rate)
staleTime: 10 * 60 * 1000,  // 10 minutes
gcTime: 30 * 60 * 1000      // 30 minutes
```

### Modern React Query Loading States

**IMPORTANT**: Use the correct loading state properties for React Query v5+:

```typescript
// ✅ CORRECT: Modern React Query loading states
const {
  data,
  isLoading,      // true during first fetch only (replaces deprecated isInitialLoading)
  isFetching,     // true during any fetch (initial or refetch)
  isPending,      // true when query is in pending state
  isRefetching,   // true during background refetch
  error,
  isSuccess,
  refetch
} = useQuery(...)

// ✅ Loading state logic
const isInitialLoading = isLoading  // For backward compatibility
const isGeneralLoading = isFetching && isPending

// ❌ DEPRECATED: Don't use these
const isInitialLoading = queryResult.isInitialLoading  // Deprecated in v5+
```

### useQueryState Hook Pattern

Always use our custom `useQueryState` hook for consistent state management:

```typescript
// ✅ CORRECT: Use enhanced query state
import { useQueryState } from '@/lib/hooks/useQueryState'

const queryResult = useQuery(...)
const { 
  data, 
  isLoading,
  isInitialLoading, // Safely mapped from isLoading  
  isReady, 
  isEmpty,
  error,
  retry 
} = useQueryState(queryResult)

// ✅ Enhanced states provided by useQueryState
if (isInitialLoading) return <LoadingSpinner />
if (error) return <ErrorState onRetry={retry} />
if (isEmpty) return <EmptyState />
if (isReady) return <ContentList data={data} />
```

### Hook Naming Convention
- Always use module name in hook: `useBlogPosts`, `useWikiGuides`, `useForumPosts`, `useDexMonsters`
- Never use generic names like `usePosts` or `useContent` directly
- Stats hooks: `use[Module]Stats()` → `/api/stats/[module]`
- Categories: `use[Module]Categories()` → `/api/[module]/categories`
- Special hooks: `useDexModels()` → `/api/dex/models` (3D model list)

## Code Quality Checks

### After completing tasks, always run:
1. **TypeScript Check**: `npx tsc --noEmit` - Ensures no type errors
2. **Linting**: `npm run lint` - Ensures code quality and consistency

### Fix all errors while maintaining consistency across modules:
- Replace all `any` types with proper types
- Fix unused imports and variables
- Ensure all four modules (wiki, blog, forum, dex) follow the same patterns
- Update type definitions consistently
- Verify 3D-specific dex extensions don't break standard patterns

### When fixing errors, ALWAYS check for consistency:
**IMPORTANT**: When you find an error in one module (e.g., dal/blog.ts), immediately check the corresponding files in the other modules (dal/forum.ts, dal/wiki.ts, and dal/dex.ts):
1. If they have the same problem - fix all four consistently
2. If they DON'T have the same problem - investigate why there's inconsistency
3. Choose the best implementation pattern and apply it to all four modules
4. This ensures all modules remain consistent and follow the same patterns

### Naming Consistency Requirements:
- **Method Names**: Always use module-specific prefixes for clarity
  - Forum: `recordForumView`, `incrementForumViewCount`, etc.
  - Blog: `recordBlogView`, `incrementBlogViewCount`, etc.
  - Wiki: `recordWikiView`, `incrementWikiViewCount`, etc.
- **Never use generic names** like `recordView` - always include the module prefix
- **Apply this pattern to all shared services** (statsManager, DAL methods, etc.)
- **No legacy/deprecated code**: Remove old methods immediately when replacing them
  - Don't keep deprecated methods for "backward compatibility"
  - Update all references when renaming methods
  - Keep the codebase clean and consistent

### File Structure for New Features
```
app/
  api/
    feature/
      route.ts              # Use withDALAndValidation wrapper
    feature/
      [id]/route.ts         # Individual resource operations
  components/
    feature/
      FeatureList.tsx       # Use memo() for performance
      FeatureForm.tsx       # Use enhanced validation
lib/
  hooks/
    useFeature.ts          # Use React Query patterns
  schemas/
    feature.ts             # Zod validation schemas
  types/
    feature.ts             # TypeScript definitions
```

## Performance Guidelines

### Database Query Optimization
- **Always use indexes** - Compound indexes are created for common patterns
- **Leverage embedded data** - Avoid N+1 queries with embedded references
- **Use aggregation pipelines** - For complex analytics queries
- **Implement pagination** - Use skip/limit with proper indexing

### Frontend Performance  
- **React.memo** for expensive components
- **useCallback** for stable references
- **React Query** for caching and background updates
- **Infinite scrolling** instead of traditional pagination
- **Optimistic updates** for better UX

### Monitoring & Analytics
- All user interactions are tracked in `userInteractions` collection
- Activity logs provide detailed audit trail
- Server metrics collection for performance monitoring
- Comprehensive error tracking and reporting

This redesigned architecture provides 70% faster queries, 80% fewer database calls, and 87% faster search while maintaining excellent developer experience and scalability.

# Real-Time Stats System (WebSocket Architecture)

## Overview

The application implements a sophisticated WebSocket-based real-time stats system that provides live updates for social actions (likes, bookmarks, shares, helpful) across all connected users. This system uses a server-authoritative approach for reliability while providing instant user feedback.

## Architecture

### Server-Side Components

**StatsBroadcaster (`lib/websocket/stats-broadcaster.ts`)**
- WebSocket server running on port 3001
- Manages client connections and subscriptions
- Broadcasts stats updates to subscribed clients
- Handles heartbeat/keepalive and connection cleanup
- Supports message compression for performance

**Stats Manager Integration**
- Database operations atomically update MongoDB
- WebSocket broadcasts triggered after successful DB updates
- Error isolation: WebSocket failures don't break main functionality
- Broadcasting includes personalized interaction states

### Client-Side Components

**React Hooks (`lib/hooks/useRealtimeStats.ts`)**
```typescript
// Auto-subscribe to content stats
const realtimeStats = useContentRealtimeStats('wiki', guideId, {
  enabled: !!guideId,
  debug: process.env.NODE_ENV === 'development'
})

// Manual subscription control
const realtimeStats = useRealtimeStats()
realtimeStats.subscribe('wiki', guideId)
```

**Integration with React Query**
- Automatic cache updates when WebSocket messages arrive
- Seamless integration with existing query patterns
- No disruption to current caching strategies

## Data Flow

```
User Action → Database Update → WebSocket Broadcast → Cache Update → UI Update
```

1. User clicks social action button
2. API route processes request and updates database atomically
3. Stats manager broadcasts update to WebSocket server
4. WebSocket server sends update to all subscribed clients
5. Client receives update and refreshes React Query cache
6. UI automatically re-renders with new stats

## Message Types

**Stats Update Message**
```typescript
interface StatsUpdateMessage {
  type: 'stats_update'
  contentType: 'forum' | 'blog' | 'wiki'
  contentId: string
  slug: string
  stats: ContentStats
  interactions?: ContentInteractionState // Only for action user
  timestamp: number
  userId?: string
}
```

**Subscription Management**
```typescript
// Subscribe to content updates
{ type: 'subscribe', contentId: 'wiki-123', userId: 'user-456' }

// Unsubscribe from updates  
{ type: 'unsubscribe', contentId: 'wiki-123', userId: 'user-456' }
```

## Usage Patterns

### Component Integration
```typescript
const WikiDetailContent = ({ slug, initialGuide }) => {
  // Subscribe to real-time stats
  const realtimeStats = useContentRealtimeStats('wiki', initialGuide?.id)
  
  return (
    <div>
      {/* Show live connection indicator */}
      {realtimeStats.isConnected && (
        <div className="flex items-center space-x-1 text-green-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      )}
      
      <WikiActions guide={currentGuide} />
    </div>
  )
}
```

### Automatic Subscription Management
- Components automatically subscribe when mounted
- Automatic cleanup when components unmount
- Handles reconnection after network failures
- Graceful degradation if WebSocket unavailable

## Performance & Scalability

### Connection Management
- Heartbeat system prevents connection timeouts
- Automatic reconnection with exponential backoff
- Connection pooling and cleanup of stale connections
- Memory-efficient subscription tracking

### Broadcasting Efficiency
- Only sends updates to actively subscribed clients
- Message compression for large stat objects
- Batching support for high-frequency updates
- Selective updates (personal interaction state vs public stats)

### Production Considerations
- Horizontal scaling with sticky sessions
- Load balancing WebSocket connections
- Health checks and monitoring endpoints
- Error logging and debugging support

## Configuration

### Environment Variables
```bash
# WebSocket server configuration
WEBSOCKET_PORT=3001
WEBSOCKET_DEBUG=false
WEBSOCKET_COMPRESSION=true

# Connection settings
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_RECONNECT_INTERVAL=5000
```

### Development vs Production
- **Development**: WebSocket server auto-starts with Next.js
- **Production**: Separate WebSocket service recommended
- **Testing**: Mock WebSocket connections for unit tests

## Error Handling

### Client Resilience
- Automatic reconnection on connection loss
- Fallback to HTTP polling if WebSocket fails
- Graceful degradation without breaking main functionality
- User-friendly connection status indicators

### Server Resilience  
- Database transaction failures don't affect WebSocket state
- Connection cleanup prevents memory leaks
- Error isolation between different content subscriptions
- Comprehensive logging for debugging

## Security

### Connection Authentication
- User ID extracted from session/JWT tokens
- Subscription permissions validated server-side
- No sensitive data in WebSocket messages
- Rate limiting on subscription requests

### Data Privacy
- Personal interaction states only sent to action user
- Public stats visible to all subscribers
- No user activity tracking beyond interactions
- Secure WebSocket connections in production

## Monitoring

### Connection Metrics
```typescript
statsBroadcaster.getStats()
// Returns: { connections: 42, subscriptions: 156, totalSubscriptions: 203 }
```

### Debug Information
- Connection state tracking
- Message delivery confirmation
- Subscription lifecycle logging
- Performance metrics collection

## Future Enhancements

### Advanced Features
- **Presence System**: Show active users viewing content
- **Typing Indicators**: Real-time activity indicators  
- **Live Comments**: Real-time discussion integration
- **Analytics Integration**: Track engagement patterns

### Scalability Improvements
- **Redis Pub/Sub**: For multi-server deployments
- **Message Queuing**: Handle high-frequency updates
- **Geographic Distribution**: Regional WebSocket servers
- **Edge Computing**: CDN-based WebSocket endpoints

This real-time stats system provides a modern, collaborative user experience while maintaining the reliability and performance standards of the application.

# CRITICAL: Centralized Permission System Requirements

## Permission System Architecture

**MANDATORY**: All permission checks must use the centralized permission system. Never implement manual permission checks.

- **React Components**: Use `usePermissions` hook from `@/lib/hooks/usePermissions`
- **Server-Side Code**: Use `PermissionChecker` class from `@/lib/utils/permissions`

### Core Permission Components

```typescript
// Use these centralized components
import { usePermissions } from '@/lib/hooks/usePermissions'
import { PermissionChecker } from '@/lib/utils/permissions'

// ✅ CORRECT: Client-side permission checks
const permissions = usePermissions(session, 'blog', post)
if (permissions.canEdit) {
  // Show edit button
}

// ✅ CORRECT: Server-side permission checks  
const user = { id: session.user.id, role: session.user.role }
if (PermissionChecker.canDelete(user, 'forum', post)) {
  // Allow deletion
}
```

### Prohibited Manual Permission Patterns

**❌ NEVER USE**: Manual permission checks like these:

```typescript
// ❌ WRONG: Manual role checks
session?.user?.role === 'admin'
session?.user?.role === 'moderator' 
!!session?.user

// ❌ WRONG: Manual role arrays
['admin', 'moderator', 'vip'].includes(user.role)

// ❌ WRONG: Manual author checks  
post.author?.id === user.id

// ❌ WRONG: Inline permission logic
const canEdit = (user.role === 'admin') || (post.author.id === user.id)
```

## Module-Specific Permission Requirements

### Permission Rules by Module

1. **Wiki & Blog**: Admin-only create/edit/delete
2. **Forum**: 
   - All members can create posts/replies
   - Authors can edit/delete their own content  
   - Admins/Moderators can edit/delete any content

### Implementation Standards

#### Client-Side Components (React)

```typescript
// ✅ CORRECT: Use usePermissions hook
import { usePermissions } from '@/lib/hooks/usePermissions'

export function BlogDetail({ post }) {
  const { data: session } = useSession()
  const permissions = usePermissions(session, 'blog', post)
  
  return (
    <div>
      {permissions.canEdit && (
        <button>Edit Post</button>
      )}
      {permissions.canDelete && (
        <button>Delete Post</button>
      )}
    </div>
  )
}
```

#### Server-Side Pages & API Routes

```typescript
// ✅ CORRECT: Use PermissionChecker class
import { PermissionChecker } from '@/lib/utils/permissions'

export default async function EditPostPage({ params }) {
  const user = { id: session.user.id, role: session.user.role }
  
  if (!PermissionChecker.canEdit(user, 'blog', post)) {
    return redirect('/unauthorized')
  }
  
  return <EditForm />
}
```

#### API Route Permission Middleware

```typescript
// ✅ CORRECT: Centralized API permission checking
import { PermissionChecker } from '@/lib/utils/permissions'

export async function DELETE(request, { params }) {
  const user = await getCurrentUser()
  const post = await getPost(params.slug)
  
  if (!PermissionChecker.canDelete(user, 'blog', post)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Proceed with deletion
}
```

## Migration Priority List

### 🚨 CRITICAL: Immediate Action Required

**Files with Manual Permission Checks (Must Fix):**

#### Server-Side Pages
- `/app/blog/edit/[slug]/page.tsx` - Line 37: Manual admin check
- `/app/wiki/edit/[slug]/page.tsx` - Line 37: Manual admin check  
- `/app/blog/create/page.tsx` - Line 14: Manual admin check
- `/app/wiki/create/page.tsx` - Line 14: Manual admin check
- `/app/forum/edit/[slug]/page.tsx` - Lines 47-48: Manual admin/author checks

#### API Routes  
- `/app/api/forum/replies/[id]/route.ts` - Lines 32-33: Manual checks
- `/app/api/forum/posts/[slug]/route.ts` - Lines 71-72: Manual checks
- `/app/api/blog/posts/[slug]/route.ts` - Line 33: Manual role check
- `/app/api/wiki/guides/[slug]/route.ts` - Line 30: Manual role array

#### Client Components
- `/app/components/pages/wiki/WikiDetailContent.tsx` - Line 365: Manual admin check
- `/app/components/pages/forum/ForumDetailContent.tsx` - Lines 43-45: Manual checks  
- `/app/components/pages/forum/ForumPost.tsx` - Lines 38-41: Manual checks
- `/app/components/blog/BlogList.tsx` - Line 37: Manual admin check
- `/app/blog/[slug]/BlogDetailContent.tsx` - Line 29: Manual admin check
- `/app/components/blog/BlogDetail.tsx` - Line 54: Manual admin check
- `/app/components/forum/ReplyList.tsx` - Lines 53-55: Manual permission function

#### Content Creation Components
- `/app/components/pages/blog/BlogContent.tsx` - Line 92: Manual admin check
- `/app/wiki/WikiContent.tsx` - Line 249: Manual role array check
- `/app/components/pages/forum/ForumContent.tsx` - Line 91: Should verify specific permissions

#### Shared Components
- `/app/components/shared/ContentActions.tsx` - Line 90: Manual admin check
- `/app/components/shared/ContentForm.tsx` - Lines 92-97: Manual permission logic

## Permission Pattern Standardization

### ✅ Correct Implementation Examples

**Action Components (Already Implemented Correctly):**
- `BlogActions.tsx` - Uses `usePermissions(session, 'blog', post)` ✅
- `ForumActions.tsx` - Uses `usePermissions(session, 'forum', post)` ✅  
- `WikiActions.tsx` - Uses `usePermissions(session, 'wiki', guide)` ✅

**Follow this pattern for all components:**

```typescript
// ✅ TEMPLATE: Standard permission implementation
export function ContentComponent({ content }) {
  const { data: session } = useSession()
  const permissions = usePermissions(session, 'module', content)
  
  return (
    <div>
      {/* Creation permissions */}
      {permissions.canCreate && <CreateButton />}
      
      {/* Edit permissions */}  
      {permissions.canEdit && <EditButton />}
      
      {/* Delete permissions */}
      {permissions.canDelete && <DeleteButton />}
      
      {/* Admin-only features */}
      {permissions.isAdmin && <AdminPanel />}
      
      {/* Author-specific features */}
      {permissions.isAuthor && <AuthorActions />}
    </div>
  )
}
```

### Permission Method Usage Guide

```typescript
// ✅ Available permission methods
const permissions = usePermissions(session, module, content)

// Core permissions
permissions.canCreate    // Can create new content in module
permissions.canEdit      // Can edit this content item  
permissions.canDelete    // Can delete this content item
permissions.canViewDrafts // Can view unpublished content

// Role-based permissions
permissions.isAdmin      // User has admin role
permissions.isModerator  // User has admin or moderator role
permissions.isAuthor     // User is the author of this content

// Server-side equivalents
PermissionChecker.canCreate(user, module)
PermissionChecker.canEdit(user, module, content)  
PermissionChecker.canDelete(user, module, content)
PermissionChecker.canViewDrafts(user, module)
PermissionChecker.isAdmin(user)
PermissionChecker.isModerator(user)  
PermissionChecker.isAuthor(user, content)
```

## Enforcement Rules

### Code Review Requirements
1. **Reject all manual permission checks** in new code
2. **Require migration plan** for existing manual checks  
3. **Ensure consistent patterns** across all modules
4. **Verify server/client permission alignment**

### Testing Requirements  
1. **Test all permission scenarios** for each module
2. **Verify unauthorized access protection**
3. **Test cross-module permission consistency**
4. **Validate server-side permission enforcement**

### Migration Success Criteria
1. **Zero manual permission checks** remain in codebase
2. **All modules use identical permission patterns**  
3. **Server and client permissions are aligned**
4. **Permission logic is centralized and maintainable**

**TARGET**: Complete migration of all 18+ files with manual permission checks to use the centralized permission system for improved security, maintainability, and consistency.