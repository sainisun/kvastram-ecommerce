'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useState } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'editor-image',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'editor-link',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
            },
        },
    });

    // Update editor content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Cleanup editor on unmount (fix memory leak)
    useEffect(() => {
        return () => {
            if (editor) {
                console.log('[RichTextEditor] Destroying editor instance');
                editor.destroy();
            }
        };
    }, [editor]);

    const addImage = useCallback(() => {
        const url = window.prompt('Enter image URL:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!isMounted || !editor) {
        return (
            <div className="rich-text-editor">
                <div className="editor-toolbar" style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Loading editor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="rich-text-editor">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'is-active' : ''}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'is-active' : ''}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={editor.isActive('strike') ? 'is-active' : ''}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                        title="Heading 3"
                    >
                        H3
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'is-active' : ''}
                        title="Bullet List"
                    >
                        • List
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={editor.isActive('orderedList') ? 'is-active' : ''}
                        title="Numbered List"
                    >
                        1. List
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={editor.isActive('blockquote') ? 'is-active' : ''}
                        title="Quote"
                    >
                        " Quote
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={setLink}
                        className={editor.isActive('link') ? 'is-active' : ''}
                        title="Add Link"
                    >
                        🔗 Link
                    </button>
                    <button
                        type="button"
                        onClick={addImage}
                        title="Add Image"
                    >
                        🖼️ Image
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={editor.isActive('codeBlock') ? 'is-active' : ''}
                        title="Code Block"
                    >
                        &lt;/&gt; Code
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Line"
                    >
                        ― Line
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo (Ctrl+Z)"
                    >
                        ↶ Undo
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo (Ctrl+Y)"
                    >
                        ↷ Redo
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="editor-content-wrapper">
                <EditorContent editor={editor} />
            </div>

            {/* Character Count */}
            <div className="editor-footer">
                <span className="character-count">
                    {editor.storage.characterCount?.characters() || editor.getText().length} characters
                </span>
                <span className="word-count">
                    {editor.getText().split(/\s+/).filter(word => word.length > 0).length} words
                </span>
            </div>
        </div>
    );
}
