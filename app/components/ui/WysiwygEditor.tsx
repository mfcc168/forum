'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/app/components/ui/Button'
import { Icon } from '@/app/components/ui/Icon'
import { WysiwygEditorProps } from '@/lib/types'
import { useTranslation } from '@/lib/contexts/LanguageContext'

export function WysiwygEditor({ value, content, onChange, placeholder = 'Start writing...', className = '' }: WysiwygEditorProps) {
  const { t } = useTranslation()
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude the built-in link extension since we're configuring our own
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-600 hover:text-emerald-700 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-3',
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && (value || content) && editor.getHTML() !== (value || content)) {
      editor.commands.setContent(value || content || '')
    }
  }, [editor, value, content])

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt(t.editor.prompts.enterUrl)
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt(t.editor.prompts.enterImageUrl)
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className={`border border-slate-300 rounded-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-slate-200' : ''}
        >
          <Icon name="bold" className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-slate-200' : ''}
        >
          <Icon name="italic" className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-slate-200' : ''}
        >
          <Icon name="strikethrough" className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-slate-200' : ''}
        >
          H2
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-slate-200' : ''}
        >
          H3
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}
        >
          <Icon name="listBullet" className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-slate-200' : ''}
        >
          <Icon name="listNumbered" className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-slate-200' : ''}
        >
          <Icon name="quote" className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-slate-200' : ''}
        >
          <Icon name="codeBlock" className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
        >
          <Icon name="link" className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImage}
        >
          <Icon name="image" className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}