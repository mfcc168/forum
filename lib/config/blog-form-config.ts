import { getBlogCategoriesForFormWithTranslation, getDefaultBlogCategory } from './blog-categories'
import { useCreateBlogPost, useUpdateBlogPost } from '@/lib/hooks/useBlog'
import type { ContentFormConfig, ContentFormField } from '@/app/components/shared/ContentForm'
import type { BlogPost } from '@/lib/types'
import type { TranslationObject } from '@/lib/translations/locales/en'
import { z } from 'zod'

// Blog post validation schemas
const blogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters')
    .refine(
      (content) => {
        const textContent = content.replace(/<[^>]*>/g, '').trim()
        return textContent.length > 0
      },
      { message: 'Content must contain text, not just HTML tags' }
    ),
  excerpt: z.string()
    .min(1, 'Excerpt is required')
    .max(500, 'Excerpt must be less than 500 characters')
    .trim(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string().trim()).optional().default([]),
  status: z.enum(['published', 'draft', 'archived']).default('published')
})

const updateBlogPostSchema = blogPostSchema.partial()

// Get translated blog form fields
const getBlogFormFields = (t: TranslationObject): ContentFormField[] => [
  {
    name: 'title',
    label: t.blog.forms.create.titleLabel,
    type: 'text',
    required: true,
    maxLength: 200,
    placeholder: t.blog.forms.create.titlePlaceholder
  },
  {
    name: 'excerpt',
    label: t.blog.forms.create.excerptLabel,
    type: 'textarea',
    required: true,
    maxLength: 500,
    placeholder: t.blog.forms.create.excerptPlaceholder,
    help: t.blog.forms.create.excerptDescription,
    autoGenerate: true
  },
  {
    name: 'category',
    label: t.blog.forms.create.categoryLabel,
    type: 'select',
    required: true,
    help: t.blog.forms.create.categoryHelp
  },
  {
    name: 'tags',
    label: t.blog.forms.create.tagsLabel,
    type: 'tags',
    required: false,
    placeholder: t.blog.forms.create.tagsPlaceholder,
    help: t.blog.forms.create.tagsHelp
  },
  {
    name: 'status',
    label: t.blog.forms.create.statusLabel,
    type: 'select',
    required: true,
    options: [
      { value: 'published', label: t.blog.forms.create.statusPublished },
      { value: 'draft', label: t.blog.forms.create.statusDraft },
      { value: 'archived', label: t.blog.forms.create.statusArchived }
    ],
    help: t.blog.forms.create.statusHelp
  },
  {
    name: 'content',
    label: t.blog.forms.create.contentLabel,
    type: 'wysiwyg',
    required: true,
    placeholder: t.blog.forms.create.contentPlaceholder
  }
]

// Get blog form configuration with translations
export const getBlogFormConfig = (t: TranslationObject): ContentFormConfig<BlogPost> => ({
  fields: getBlogFormFields(t),
  
  validation: {
    create: blogPostSchema,
    update: updateBlogPostSchema
  },
  
  module: 'blog', // Use centralized permission system for blog
  
  submitText: {
    create: t.blog.forms.create.submitCreate,
    edit: t.blog.forms.create.submitEdit,
    creating: t.blog.forms.create.creating,
    editing: t.blog.forms.create.editing
  },
  
  categoryConfig: {
    getCategories: () => getBlogCategoriesForFormWithTranslation(t),
    getDefault: getDefaultBlogCategory
  },
  
  hooks: {
    useCreate: useCreateBlogPost,
    useUpdate: useUpdateBlogPost
  },
  
  routing: {
    getEditPath: (blog: BlogPost) => `/blog/edit/${blog.slug}`,
    getViewPath: (blog: BlogPost) => `/blog/${blog.slug}`
  }
})

