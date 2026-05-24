/**
 * RichTextEditor.jsx
 *
 * Full-featured rich text editor built on TipTap v3.
 * Uses lucide-react icons throughout — no window.prompt, no Tabler icons.
 * Link and YouTube embeds use inline input rows instead of dialogs.
 * Images are uploaded to Firebase Storage and inserted as public URLs.
 *
 * Props:
 *   content  {string}  Initial HTML content
 *   onChange {fn}      Called with updated HTML on every keystroke
 *   clubId   {string}  Used as Storage upload path prefix (optional)
 *   placeholder {string}
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useRef, useState, useCallback } from 'react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../services/firebase'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link2, Link2Off, ImageIcon, Youtube as YoutubeIcon,
  Undo2, Redo2, Code2, Quote, X, Check, Loader,
} from 'lucide-react'
import './RichTextEditor.css'

// ── Toolbar primitives ────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-slate-700 mx-0.5 shrink-0" />
}

function ToolBtn({ active, disabled, title, onMouseDown, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown?.() }}
      className={`p-1.5 rounded-lg transition-all select-none shrink-0 ${
        active
          ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/25'
          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      } disabled:opacity-25 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function BlockSelect({ editor }) {
  const getType = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1'
    if (editor.isActive('heading', { level: 2 })) return 'h2'
    if (editor.isActive('heading', { level: 3 })) return 'h3'
    if (editor.isActive('blockquote'))            return 'bq'
    if (editor.isActive('codeBlock'))             return 'cb'
    return 'p'
  }

  function apply(val) {
    const c = editor.chain().focus()
    if      (val === 'p')  c.setParagraph().run()
    else if (val === 'h1') c.toggleHeading({ level: 1 }).run()
    else if (val === 'h2') c.toggleHeading({ level: 2 }).run()
    else if (val === 'h3') c.toggleHeading({ level: 3 }).run()
    else if (val === 'bq') c.toggleBlockquote().run()
    else if (val === 'cb') c.toggleCodeBlock().run()
  }

  return (
    <select
      value={getType()}
      onChange={(e) => apply(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-yellow-400 cursor-pointer h-7 shrink-0"
    >
      <option value="p">Odstavec</option>
      <option value="h1">Nadpis 1</option>
      <option value="h2">Nadpis 2</option>
      <option value="h3">Nadpis 3</option>
      <option value="bq">Citát</option>
      <option value="cb">Kód</option>
    </select>
  )
}

// ── Inline input row (link / YouTube) ─────────────────────────────────────

function InlineInput({ icon: Icon, placeholder, defaultValue = '', onConfirm, onCancel, confirmLabel = 'Pridať' }) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 border-b border-slate-700/60">
      <Icon size={13} className="text-slate-500 shrink-0" />
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) onConfirm(val.trim()) }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        autoFocus
        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); if (val.trim()) onConfirm(val.trim()) }}
        disabled={!val.trim()}
        className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-xs font-black hover:bg-green-500/25 disabled:opacity-40 transition-colors"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onCancel() }}
        className="p-1 rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function RichTextEditor({ content = '', onChange, clubId, placeholder = 'Začnite písať…' }) {
  const [linkOpen, setLinkOpen]     = useState(false)
  const [ytOpen,   setYtOpen]       = useState(false)
  const [imgUploading, setImgUploading] = useState(false)
  const fileInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'code-block' } } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
    ],
    content,
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
  })

  // ── Link helpers ────────────────────────────────────────────────────────
  function openLinkInput() {
    setYtOpen(false)
    setLinkOpen(true)
  }
  function applyLink(url) {
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
    editor.chain().focus().setLink({ href }).run()
    setLinkOpen(false)
  }
  function removeLink() {
    editor.chain().focus().unsetLink().run()
    setLinkOpen(false)
  }

  // ── YouTube helper ──────────────────────────────────────────────────────
  function openYtInput() {
    setLinkOpen(false)
    setYtOpen(true)
  }
  function applyYoutube(url) {
    editor.commands.setYoutubeVideo({ src: url })
    setYtOpen(false)
  }

  // ── Image upload ────────────────────────────────────────────────────────
  const handleImageFile = useCallback(async (file) => {
    if (!file) return
    setImgUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `clubs/${clubId ?? 'global'}/page_images/${Date.now()}.${ext}`
      const ref  = storageRef(storage, path)
      await uploadBytes(ref, file)
      const url  = await getDownloadURL(ref)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch {
      // silently ignore — user can retry
    } finally {
      setImgUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [editor, clubId])

  if (!editor) return null

  const linkActive = editor.isActive('link')

  return (
    <div className="flex flex-col border border-slate-700 rounded-2xl overflow-hidden bg-slate-900">

      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700/60">
        <div className="flex items-center flex-wrap gap-0.5 px-3 py-2">

          {/* History */}
          <ToolBtn title="Späť" disabled={!editor.can().undo()} onMouseDown={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></ToolBtn>
          <ToolBtn title="Dopredu" disabled={!editor.can().redo()} onMouseDown={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></ToolBtn>

          <Divider />

          {/* Block type */}
          <BlockSelect editor={editor} />

          <Divider />

          {/* Marks */}
          <ToolBtn active={editor.isActive('bold')}          title="Tučné (⌘B)"     onMouseDown={() => editor.chain().focus().toggleBold().run()}><Bold         size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive('italic')}        title="Kurzíva (⌘I)"   onMouseDown={() => editor.chain().focus().toggleItalic().run()}><Italic       size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive('underline')}     title="Podčiarknutie"  onMouseDown={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive('strike')}        title="Preškrtnuté"    onMouseDown={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive('code')}          title="Inline kód"     onMouseDown={() => editor.chain().focus().toggleCode().run()}><Code2         size={14} /></ToolBtn>

          <Divider />

          {/* Alignment */}
          <ToolBtn active={editor.isActive({ textAlign: 'left' })}   title="Zarovnať vľavo"  onMouseDown={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft   size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'center' })} title="Na stred"        onMouseDown={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'right' })}  title="Zarovnať vpravo" onMouseDown={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight  size={14} /></ToolBtn>

          <Divider />

          {/* Lists */}
          <ToolBtn active={editor.isActive('bulletList')}  title="Odrážkový zoznam" onMouseDown={() => editor.chain().focus().toggleBulletList().run()}><List        size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive('orderedList')} title="Číslovaný zoznam" onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolBtn>
          <ToolBtn active={editor.isActive('blockquote')}  title="Citát"            onMouseDown={() => editor.chain().focus().toggleBlockquote().run()}><Quote       size={14} /></ToolBtn>

          <Divider />

          {/* Media */}
          <ToolBtn
            active={linkOpen || linkActive}
            title={linkActive ? 'Upraviť / odstrániť odkaz' : 'Pridať odkaz'}
            onMouseDown={openLinkInput}
          >
            <Link2 size={14} />
          </ToolBtn>

          {linkActive && (
            <ToolBtn title="Odstrániť odkaz" onMouseDown={removeLink}>
              <Link2Off size={14} />
            </ToolBtn>
          )}

          <ToolBtn
            active={ytOpen}
            title="Vložiť YouTube video"
            onMouseDown={openYtInput}
          >
            <YoutubeIcon size={14} />
          </ToolBtn>

          <ToolBtn
            title="Nahrať obrázok"
            disabled={imgUploading}
            onMouseDown={() => fileInputRef.current?.click()}
          >
            {imgUploading ? <Loader size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          </ToolBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => handleImageFile(e.target.files?.[0])}
          />
        </div>

        {/* Inline link input */}
        {linkOpen && (
          <InlineInput
            icon={Link2}
            placeholder="https://example.com"
            defaultValue={editor.getAttributes('link').href ?? ''}
            onConfirm={applyLink}
            onCancel={() => setLinkOpen(false)}
            confirmLabel="Použiť"
          />
        )}

        {/* Inline YouTube input */}
        {ytOpen && (
          <InlineInput
            icon={YoutubeIcon}
            placeholder="https://www.youtube.com/watch?v=…"
            onConfirm={applyYoutube}
            onCancel={() => setYtOpen(false)}
            confirmLabel="Vložiť"
          />
        )}
      </div>

      {/* ── Content area ── */}
      <div className="rte-content flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
