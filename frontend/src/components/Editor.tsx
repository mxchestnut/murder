import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Quote, Undo, Redo, Heading1, Heading2, Heading3,
  CheckSquare, Highlighter, AlignLeft, AlignCenter, AlignRight, Share2
} from 'lucide-react';
import { useEffect } from 'react';

interface EditorProps {
  document: any;
  onSave: (content: string) => void;
  onShare?: (document: any) => void;
}

export default function Editor({ document, onSave, onShare }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we're configuring separately
        link: false,
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Subscript,
      Superscript
    ],
    content: document?.content || '',
    onUpdate: ({ editor }) => {
      onSave(editor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && document) {
      editor.commands.setContent(document.content || '');
    }
  }, [document?.id, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ onClick, active, children }: any) => (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem',
        border: 'none',
        background: active ? 'var(--accent-color)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-primary)',
        cursor: 'pointer',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '0.5rem',
        borderBottom: `1px solid var(--border-color)`,
        background: 'var(--bg-secondary)',
        display: 'flex',
        gap: '0.25rem',
        flexWrap: 'wrap'
      }}>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold size={18} />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <Code size={18} />
        </MenuButton>

        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 size={18} />
        </MenuButton>

        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
        >
          <CheckSquare size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote size={18} />
        </MenuButton>

        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
        >
          <Highlighter size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
        >
          <AlignLeft size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
        >
          <AlignCenter size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
        >
          <AlignRight size={18} />
        </MenuButton>

        <div style={{ width: '1px', background: '#4a4a4a', margin: '0 0.25rem' }} />

        <MenuButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={18} />
        </MenuButton>

        <MenuButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={18} />
        </MenuButton>

        {onShare && (
          <>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
            <button
              onClick={() => onShare(document)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: 'var(--accent-color)',
                color: 'var(--accent-text)',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              <Share2 size={18} />
              Share
            </button>
          </>
        )}
      </div>

      {/* Editor Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg-primary)',
        padding: '1rem',
        color: 'var(--text-primary)'
      }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
