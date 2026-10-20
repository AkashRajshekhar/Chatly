import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
    FiArrowLeft,
    FiMessageCircle,
    FiPaperclip,
    FiSend,
    FiSmile,
    FiX,
} from 'react-icons/fi'
import { serverUrl } from '../config.js'
import UserAvatar from './UserAvatar'

const EMOJIS = ['😀', '😂', '🥰', '😊', '😍', '😎', '😭', '👍', '❤️', '🎉', '🙏', '🔥']
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])
const ALLOWED_ATTACHMENT_EXTENSIONS = /\.(jpe?g|png|webp|pdf|txt|docx?|xlsx?|pptx?)$/i

const MessageItem = ({ message, isOwnMessage }) => {
    const attachmentUrl = message.attachment?.url
        ? `${serverUrl}${message.attachment.url}`
        : ''
    const isImage = message.attachment?.mimeType?.startsWith('image/')
    const sentTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className={`mb-2 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
                    isOwnMessage
                        ? 'rounded-tr-sm bg-indigo-100'
                        : 'rounded-tl-sm bg-white'
                }`}
            >
                {isImage && (
                    <a href={attachmentUrl} target="_blank" rel="noreferrer" className="mb-2 block">
                        <img
                            src={attachmentUrl}
                            alt={message.attachment.originalName}
                            crossOrigin="use-credentials"
                            className="max-h-64 max-w-full rounded-lg object-contain"
                        />
                    </a>
                )}

                {message.attachment && !isImage && (
                    <a
                        href={attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={message.attachment.originalName}
                        className="mb-2 block max-w-full truncate rounded-lg border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-white"
                    >
                        📎 {message.attachment.originalName}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                            {Math.max(1, Math.round(message.attachment.size / 1024))} KB
                        </span>
                    </a>
                )}

                {message.text && (
                    <p className="whitespace-pre-wrap wrap-break-words text-sm leading-5 text-[#303b36]">
                        {message.text}
                    </p>
                )}
                <p className="mt-1 text-right text-[10px] text-slate-400">{sentTime}</p>
            </div>
        </div>
    )
}

const MessageList = ({ messages, loading, currentUserId, contactName, endOfMessagesRef }) => {
    if (loading) {
        return <p className="py-10 text-center text-sm text-slate-500">Loading messages…</p>
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-indigo-600">
                    <FiMessageCircle size={28} />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">Say hello to {contactName}</p>
                <p className="mt-1 text-xs text-slate-500">Your messages will appear here.</p>
            </div>
        )
    }

    return (
        <>
            {messages.map((message) => (
                <MessageItem
                    key={message._id}
                    message={message}
                    isOwnMessage={String(message.sender) === currentUserId}
                />
            ))}
            <div ref={endOfMessagesRef} />
        </>
    )
}

const MessageComposer = ({
    draft,
    onDraftChange,
    attachment,
    onAttachmentChange,
    onSend,
    sending,
    onError,
}) => {
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
    const attachmentInputRef = useRef(null)

    const selectAttachment = (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        const hasAllowedType = ALLOWED_ATTACHMENT_TYPES.has(file.type)
        const hasAllowedExtension = ALLOWED_ATTACHMENT_EXTENSIONS.test(file.name)
        if (!hasAllowedType && !hasAllowedExtension) {
            onError('Choose an image, PDF, or common Office/text document.')
            return
        }
        if (file.size > MAX_ATTACHMENT_SIZE) {
            onError('Attachments must be 10 MB or smaller.')
            return
        }

        onAttachmentChange(file)
        onError('')
    }

    return (
        <div className="relative">
            {emojiPickerOpen && (
                <div
                    role="dialog"
                    aria-label="Choose an emoji"
                    className="absolute bottom-full left-3 z-10 mb-2 grid grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:left-5"
                >
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                                onDraftChange((current) => `${current}${emoji}`)
                                setEmojiPickerOpen(false)
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl transition hover:bg-indigo-50"
                            aria-label={`Insert ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {attachment && (
                <div className="flex items-center justify-between gap-3 border-t border-indigo-100 bg-indigo-50 px-4 py-2 text-xs text-indigo-800">
                    <span className="min-w-0 truncate">📎 {attachment.name}</span>
                    <button
                        type="button"
                        onClick={() => onAttachmentChange(null)}
                        aria-label="Remove attachment"
                        className="shrink-0 rounded-full p-1 hover:bg-indigo-100"
                    >
                        <FiX size={15} />
                    </button>
                </div>
            )}

            <form onSubmit={onSend} className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-3 sm:gap-3 sm:px-5">
                <button
                    type="button"
                    onClick={() => setEmojiPickerOpen((open) => !open)}
                    aria-label="Add emoji"
                    aria-expanded={emojiPickerOpen}
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-indigo-600"
                >
                    <FiSmile size={21} />
                </button>

                <input
                    ref={attachmentInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={selectAttachment}
                    className="sr-only"
                    aria-label="Choose a file to attach"
                />
                <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    aria-label="Attach a file"
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-indigo-600"
                >
                    <FiPaperclip size={20} />
                </button>

                <input
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    placeholder="Type a message"
                    maxLength={4000}
                    className="h-11 min-w-0 flex-1 rounded-lg bg-white px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                    aria-label="Message"
                />
                <button
                    type="submit"
                    disabled={(!draft.trim() && !attachment) || sending}
                    aria-label="Send message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FiSend size={17} />
                </button>
            </form>
        </div>
    )
}

const ConversationPanel = ({
    contact,
    isOnline,
    connectionState,
    messages,
    loading,
    currentUserId,
    onBack,
    onMessageSent,
    onError,
}) => {
    const [draft, setDraft] = useState('')
    const [attachment, setAttachment] = useState(null)
    const [sending, setSending] = useState(false)
    const endOfMessagesRef = useRef(null)
    const contactName = contact.name || contact.username

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (event) => {
        event.preventDefault()
        const text = draft.trim()
        if ((!text && !attachment) || sending) return

        setSending(true)
        onError('')

        try {
            let payload = { recipientId: contact._id, text }
            if (attachment) {
                payload = new FormData()
                payload.append('recipientId', contact._id)
                payload.append('text', text)
                payload.append('attachment', attachment)
            }

            const response = await axios.post(`${serverUrl}/api/messages`, payload, {
                withCredentials: true,
            })
            onMessageSent(response.data.message)
            setDraft('')
            setAttachment(null)
        } catch (error) {
            onError(error.response?.data?.message || 'Message could not be sent. Please try again.')
        } finally {
            setSending(false)
        }
    }

    return (
        <section className="flex min-h-0 flex-col bg-[#f1f2f9]">
            <header className="flex items-center gap-3 border-b border-[#e9edef] bg-[#f0f2f5] px-3 py-3 sm:px-5">
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-full p-2 text-slate-600 hover:bg-white md:hidden"
                    aria-label="Back to chats"
                >
                    <FiArrowLeft size={18} />
                </button>
                <UserAvatar user={contact} size="sm" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{contactName}</p>
                    <p className={`mt-0.5 text-xs ${isOnline ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {isOnline ? 'online' : 'offline'}
                    </p>
                </div>
                <span className={`hidden items-center gap-1.5 text-xs sm:flex ${connectionState === 'connected' ? 'text-indigo-600' : 'text-amber-700'}`}>
                    <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                    {connectionState === 'connected' ? 'Live chat' : 'Reconnecting'}
                </span>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-8 sm:py-7">
                <div className="mx-auto mb-5 w-fit rounded-lg bg-[#fdf4d8] px-3 py-2 text-center text-[11px] leading-5 text-[#6b6354] shadow-sm">
                    Messages are stored in your Chatly conversation.
                </div>
                <MessageList
                    messages={messages}
                    loading={loading}
                    currentUserId={currentUserId}
                    contactName={contactName}
                    endOfMessagesRef={endOfMessagesRef}
                />
            </div>

            <MessageComposer
                draft={draft}
                onDraftChange={setDraft}
                attachment={attachment}
                onAttachmentChange={setAttachment}
                onSend={sendMessage}
                sending={sending}
                onError={onError}
            />
        </section>
    )
}

export default ConversationPanel
