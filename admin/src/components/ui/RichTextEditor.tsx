'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
                    class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[150px] px-3 py-2',
            'aria-label': placeholder || 'Rich text editor',

      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full rounded-xl border border-[var(--kv-border)] overflow-hidden bg-[var(--kv-card)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--kv-border)] bg-[var(--kv-soft)] p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-[var(--kv-border)] ${editor.isActive('bold') ? 'bg-[var(--kv-border)] text-[var(--kv-text)]' : 'text-[var(--kv-text)]'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-[var(--kv-border)] ${editor.isActive('italic') ? 'bg-[var(--kv-border)] text-[var(--kv-text)]' : 'text-[var(--kv-text)]'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-6 bg-[var(--kv-border)] mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-[var(--kv-border)] ${editor.isActive('heading', { level: 2 }) ? 'bg-[var(--kv-border)] text-[var(--kv-text)]' : 'text-[var(--kv-text)]'}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-[var(--kv-border)] ${editor.isActive('heading', { level: 3 }) ? 'bg-[var(--kv-border)] text-[var(--kv-text)]' : 'text-[var(--kv-text)]'}`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
        <div className="w-px h-6 bg-[var(--kv-border)] mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-[var(--kv-border)] ${editor.isActive('bulletList') ? 'bg-[var(--kv-border)] text-[var(--kv-text)]' : 'text-[var(--kv-text)]'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-[var(--kv-border)] ${editor.isActive('orderedList') ? 'bg-[var(--kv-border)] text-[var(--kv-text)]' : 'text-[var(--kv-text)]'}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
