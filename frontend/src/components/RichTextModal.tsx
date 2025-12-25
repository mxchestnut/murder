import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import { X, Save } from 'lucide-react';
import './RichTextModal.css';

interface RichTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  initialValue: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
}

export default function RichTextModal({
  isOpen,
  onClose,
  onSave,
  initialValue,
  label,
  placeholder = 'Start typing...',
  maxLength = 1024
}: RichTextModalProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class: 'rich-text-modal-editor',
      },
    },
  });

  useEffect(() => {
    if (editor && isOpen) {
      editor.commands.setContent(initialValue || '');
      // Focus editor when modal opens
      setTimeout(() => editor.commands.focus(), 100);
    }
  }, [isOpen, initialValue, editor]);

  if (!isOpen || !editor) return null;

  const characterCount = editor.storage.characterCount.characters();
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  const handleSave = () => {
    const html = editor.getHTML();
    onSave(html);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="rich-text-modal-overlay" onClick={handleClose}>
      <div className="rich-text-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rich-text-modal-header">
          <h3>{label}</h3>
          <button className="close-button" onClick={handleClose} title="Close (Esc)">
            <X size={20} />
          </button>
        </div>

        <div className="rich-text-modal-toolbar">
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
          <span className="toolbar-divider">|</span>
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
          <span className="toolbar-divider">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="Quote"
          >
            " Quote
          </button>
          <span className="toolbar-divider">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            Clear
          </button>
        </div>

        <div className="rich-text-modal-editor-wrapper">
          <EditorContent editor={editor} />
        </div>

        <div className="rich-text-modal-footer">
          <div className={`character-count ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
            {characterCount} / {maxLength} characters
            {isOverLimit && <span className="error-text"> (Over limit!)</span>}
          </div>
          <div className="modal-actions">
            <button className="cancel-button" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="save-button"
              onClick={handleSave}
              disabled={isOverLimit}
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
