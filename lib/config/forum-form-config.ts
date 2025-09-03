import { getDefaultForumCategory, getForumCategoriesForFormWithTranslation } from './forum-categories'
import { useCreateForumPost, useUpdateForumPost } from '@/lib/hooks/useForum'
import { createForumPostSchema, updateForumPostSchema } from '@/lib/schemas/forum'
import type { ContentFormConfig, ContentFormField } from '@/app/components/shared/ContentForm'
import type { ForumPost, ForumCategory } from '@/lib/types'
import type { TranslationObject } from '@/lib/translations/locales/en'

// Get translated forum form fields
const getForumFormFields = (t: TranslationObject): ContentFormField[] => [
  {
    name: 'title',
    label: t.forum.forms.createPost.titleLabel,
    type: 'text',
    required: true,
    maxLength: 200,
    placeholder: t.forum.forms.createPost.titlePlaceholder
  },
  {
    name: 'category',
    label: t.forum.forms.createPost.categoryLabel,
    type: 'select',
    required: true,
    help: t.forum.forms.createPost.categoryHelp
  },
  {
    name: 'tags',
    label: t.forum.forms.createPost.tagsLabel,
    type: 'tags',
    required: false,
    placeholder: t.forum.forms.createPost.tagsPlaceholder,
    help: t.forum.forms.createPost.tagsHelp
  },
  {
    name: 'content',
    label: t.forum.forms.createPost.contentLabel,
    type: 'wysiwyg',
    required: true,
    placeholder: t.forum.forms.createPost.contentPlaceholder
  }
]

// Category translation helper
const translateCategoryName = (categoryName: string, categories: ForumCategory[] = []) => {
  // This would ideally use the translation context, but we'll keep it simple for now
  const category = categories.find(cat => cat.name === categoryName || cat.slug === categoryName)
  return category?.name || categoryName
}

// Get forum form configuration with translations
export const getForumFormConfig = (t: TranslationObject): ContentFormConfig<ForumPost> => ({
  fields: getForumFormFields(t),
  
  validation: {
    create: createForumPostSchema,
    update: updateForumPostSchema
  },
  
  module: 'forum', // Use centralized permission system for forum
  
  submitText: {
    create: t.forum.forms.createPost.submitCreate,
    edit: t.forum.forms.createPost.submitEdit,
    creating: t.forum.forms.createPost.creating,
    editing: t.forum.forms.createPost.editing
  },
  
  categoryConfig: {
    getCategories: () => getForumCategoriesForFormWithTranslation(t),
    getDefault: getDefaultForumCategory,
    translateName: translateCategoryName
  },
  
  hooks: {
    useCreate: useCreateForumPost,
    useUpdate: useUpdateForumPost
  },
  
  routing: {
    getEditPath: (post: ForumPost) => `/forum/edit/${post.slug}`,
    getViewPath: (post: ForumPost) => `/forum/${post.slug}`
  }
})

