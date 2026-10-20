import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'
import { FiMessageCircle, FiSearch } from 'react-icons/fi'
import { serverUrl } from '../config.js'
import ChatHeader from '../components/ChatHeader'
import ConversationPanel from '../components/ConversationPanel'
import UserAvatar from '../components/UserAvatar'

const Home = () => {
    const user = useSelector((state) => state.user.userData)
    const [contacts, setContacts] = useState([])
    const [selectedContact, setSelectedContact] = useState(null)
    const [messages, setMessages] = useState([])
    const [lastMessages, setLastMessages] = useState({})
    const [unreadCounts, setUnreadCounts] = useState({})
    const [onlineUsers, setOnlineUsers] = useState([])
    const [search, setSearch] = useState('')
    const [loadingContacts, setLoadingContacts] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [connectionState, setConnectionState] = useState('connecting')
    const [errorMessage, setErrorMessage] = useState('')
    const selectedContactRef = useRef(null)
    const conversationRequestRef = useRef(0)
    const currentUserId = String(user?._id || '')

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const response = await axios.get(`${serverUrl}/api/user`, { withCredentials: true })
                setContacts(response.data.users)
            } catch (error) {
                setErrorMessage(error.response?.data?.message || 'Unable to load people. Please try again.')
            } finally {
                setLoadingContacts(false)
            }
        }

        loadContacts()
    }, [])

    useEffect(() => {
        const loadInbox = async () => {
            try {
                const response = await axios.get(`${serverUrl}/api/messages/inbox`, { withCredentials: true })
                const conversations = response.data.conversations
                const activeContactId = selectedContactRef.current
                setLastMessages((current) => {
                    const latest = { ...current }
                    conversations.forEach(({ userId, lastMessage }) => {
                        const existing = latest[userId]
                        if (!existing || new Date(lastMessage.createdAt) > new Date(existing.createdAt)) {
                            latest[userId] = lastMessage
                        }
                    })
                    return latest
                })
                const unread = {}
                conversations.forEach(({ userId, unreadCount }) => {
                    if (unreadCount) unread[userId] = unreadCount
                })
                setUnreadCounts((current) => {
                    const latest = { ...current }
                    conversations.forEach(({ userId }) => {
                        latest[userId] = userId === activeContactId
                            ? 0
                            : Math.max(latest[userId] || 0, unread[userId] || 0)
                    })
                    return latest
                })
            } catch (error) {
                setErrorMessage(error.response?.data?.message || 'Unable to load your conversations.')
            }
        }

        loadInbox()
    }, [])

    useEffect(() => {
        const socket = io(serverUrl, { withCredentials: true })

        socket.on('connect', () => setConnectionState('connected'))
        socket.on('disconnect', () => setConnectionState('disconnected'))
        socket.on('connect_error', () => setConnectionState('disconnected'))
        socket.on('presence:update', (users) => setOnlineUsers(users.map(String)))
        socket.on('message:new', (message) => {
            const senderId = String(message.sender)
            setLastMessages((current) => {
                const latest = current[senderId]
                return latest && new Date(latest.createdAt) > new Date(message.createdAt)
                    ? current
                    : { ...current, [senderId]: message }
            })
            if (String(selectedContactRef.current) === senderId) {
                setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message])
                axios.patch(`${serverUrl}/api/messages/${senderId}/read`, {}, { withCredentials: true })
                    .catch((error) => setErrorMessage(error.response?.data?.message || 'Unable to mark messages as read.'))
            } else {
                setUnreadCounts((current) => ({ ...current, [senderId]: (current[senderId] || 0) + 1 }))
            }
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    const filteredContacts = useMemo(() => {
        const query = search.trim().toLowerCase()
        return contacts
            .filter((contact) => `${contact.name || ''} ${contact.username || ''}`.toLowerCase().includes(query))
            .sort((a, b) => {
                const aTime = new Date(lastMessages[a._id]?.createdAt || 0).getTime()
                const bTime = new Date(lastMessages[b._id]?.createdAt || 0).getTime()
                return bTime - aTime || (a.username || '').localeCompare(b.username || '')
            })
    }, [contacts, lastMessages, search])

    const openConversation = async (contact) => {
        const requestId = ++conversationRequestRef.current
        selectedContactRef.current = contact._id
        setSelectedContact(contact)
        setMessages([])
        setErrorMessage('')
        setLoadingMessages(true)

        try {
            const response = await axios.get(`${serverUrl}/api/messages/${contact._id}`, { withCredentials: true })
            if (conversationRequestRef.current === requestId) {
                setUnreadCounts((current) => ({ ...current, [contact._id]: 0 }))
                setMessages((current) => {
                    const byId = new Map(response.data.messages.map((message) => [message._id, message]))
                    current.forEach((message) => byId.set(message._id, message))
                    return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                })
            }
            if (response.data.messages.length) {
                const lastMessage = response.data.messages.at(-1)
                setLastMessages((current) => {
                    const latest = current[contact._id]
                    return latest && new Date(latest.createdAt) > new Date(lastMessage.createdAt)
                        ? current
                        : { ...current, [contact._id]: lastMessage }
                })
            }
        } catch (error) {
            if (conversationRequestRef.current === requestId) {
                setErrorMessage(error.response?.data?.message || 'Unable to load this conversation.')
            }
        } finally {
            if (conversationRequestRef.current === requestId) {
                setLoadingMessages(false)
            }
        }
    }

    const isOnline = (contactId) => onlineUsers.includes(String(contactId))
    const onlineContacts = contacts.filter((contact) => isOnline(contact._id))

    const getPreview = (contact) => {
        const message = lastMessages[contact._id]
        if (!message) return 'Say hello to start chatting'
        const preview = message.text || `📎 ${message.attachment?.originalName || 'Attachment'}`
        return `${String(message.sender) === currentUserId ? 'You: ' : ''}${preview}`
    }

    const handleMessageSent = (message) => {
        if (selectedContactRef.current === String(message.recipient)) {
            setMessages((current) => current.some((item) => item._id === message._id)
                ? current
                : [...current, message])
        }

        const recipientId = String(message.recipient)
        setLastMessages((current) => {
            const latest = current[recipientId]
            return latest && new Date(latest.createdAt) > new Date(message.createdAt)
                ? current
                : { ...current, [recipientId]: message }
        })
    }

    const closeConversation = () => {
        conversationRequestRef.current += 1
        selectedContactRef.current = null
        setSelectedContact(null)
    }

    return (
        <div className="min-h-screen bg-[#e9edef] text-slate-900">
            <ChatHeader />

            <main className="mx-auto w-full max-w-1440px p-3 sm:p-6">
                {errorMessage && (
                    <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errorMessage}
                    </div>
                )}
                <section className="grid h-[calc(100dvh-96px)] min-h-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_36px_rgba(49,46,129,0.12)] sm:h-[calc(100dvh-120px)] md:grid-cols-[350px_minmax(0,1fr)] lg:grid-cols-[390px_minmax(0,1fr)]">
                    <aside className={`${selectedContact ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-[#e9edef]`}>
                        <div className="flex items-center justify-between bg-[#f0f2f5] px-4 py-4">
                            <h1 className="text-xl font-semibold tracking-tight">Chats</h1>
                            <span className={`flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-medium ${connectionState === 'connected' ? 'text-indigo-600' : 'text-amber-700'}`}>
                                <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                                {connectionState === 'connected' ? 'Live' : 'Connecting'}
                            </span>
                        </div>
                        <div className="border-b border-[#e9edef] px-3 py-3">
                            <label className="flex h-10 items-center gap-3 rounded-lg bg-[#f0f2f5] px-3 text-slate-400">
                                <FiSearch size={16} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search or start a new chat"
                                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                    aria-label="Search people"
                                />
                            </label>
                        </div>
                        <div className="border-b border-[#e9edef] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active now</h2>
                                <span className="text-[11px] font-medium text-indigo-600">
                                    {onlineContacts.length} online
                                </span>
                            </div>
                            {onlineContacts.length ? (
                                <div aria-label="Active users" className="mt-3 flex gap-3 overflow-x-auto pb-1">
                                    {onlineContacts.map((contact) => (
                                        <button
                                            type="button"
                                            key={contact._id}
                                            onClick={() => openConversation(contact)}
                                            title={`Chat with ${contact.name || contact.username}`}
                                            className="flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-lg p-1 transition hover:bg-[#f5f6f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        >
                                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 p-0.5">
                                                <span className="flex h-full w-full items-center justify-center rounded-full bg-white p-0.5">
                                                    <UserAvatar user={contact} size="sm" className="h-10 w-10" />
                                                </span>
                                            </span>
                                            <span className="w-full truncate text-center text-[10px] font-medium text-slate-600">
                                                {contact.name || contact.username}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-3 text-xs text-slate-400">
                                    {connectionState === 'connected' ? 'No one is online right now' : 'Connecting to live presence…'}
                                </p>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loadingContacts ? (
                                <p className="px-5 py-8 text-center text-sm text-slate-500">Finding your people…</p>
                            ) : filteredContacts.length ? filteredContacts.map((contact) => (
                                <button
                                    type="button"
                                    key={contact._id}
                                    onClick={() => openConversation(contact)}
                                    className={`flex w-full items-center gap-3 border-b border-[#f0f2f5] px-4 py-3 text-left transition hover:bg-[#f5f6f6] ${selectedContact?._id === contact._id ? 'bg-[#f0f2f5]' : 'bg-white'}`}
                                >
                                    <span className="relative">
                                        <UserAvatar user={contact} size="md" />
                                        {isOnline(contact._id) && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-violet-500" />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="truncate text-[15px] font-medium text-slate-800">{contact.name || contact.username}</span>
                                            <span className="flex shrink-0 flex-col items-end gap-1">
                                                <span className="text-[10px] text-slate-400">
                                                    {lastMessages[contact._id] ? new Date(lastMessages[contact._id].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                                {unreadCounts[contact._id] > 0 && (
                                                    <span aria-label={`${unreadCounts[contact._id]} unread messages`} className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold leading-4 text-white">
                                                        {unreadCounts[contact._id]} {unreadCounts[contact._id] === 1 ? 'msg' : 'msgs'}
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                        <span className="mt-1 flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 rounded-full ${isOnline(contact._id) ? 'bg-violet-500' : 'bg-slate-300'}`} />
                                            <span className="truncate text-xs text-slate-500">
                                                {isOnline(contact._id) ? 'online' : getPreview(contact)}
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            )) : (
                                <div className="px-6 py-12 text-center">
                                    <FiMessageCircle className="mx-auto text-[#9aaba4]" size={30} />
                                    <p className="mt-3 text-sm font-medium text-slate-700">{search ? 'No people found' : 'No one is here yet'}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{search ? 'Try another name or username.' : 'New Chatly users will show up here.'}</p>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-[#e9edef] bg-[#f8f9fa] px-4 py-3 text-xs text-slate-400">
                            {contacts.length} {contacts.length === 1 ? 'person' : 'people'} on Chatly
                        </div>
                    </aside>

                    {selectedContact ? (
                        <ConversationPanel
                            key={selectedContact._id}
                            contact={selectedContact}
                            isOnline={isOnline(selectedContact._id)}
                            connectionState={connectionState}
                            messages={messages}
                            loading={loadingMessages}
                            currentUserId={currentUserId}
                            onBack={closeConversation}
                            onMessageSent={handleMessageSent}
                            onError={setErrorMessage}
                        />
                    ) : (
                        <section className="hidden min-h-0 flex-col bg-[#f1f2f9] md:flex">
                            <div className="flex flex-1 flex-col items-center justify-center border-b-[6px] border-indigo-500 px-6 text-center">
                                <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/60 text-indigo-600">
                                    <FiMessageCircle size={58} strokeWidth={1.2} />
                                </div>
                                <h2 className="text-2xl font-light tracking-tight text-[#41534b]">Chatly for everyone</h2>
                                <p className="mt-3 max-w-md text-sm leading-6 text-[#66756e]">
                                    Pick a person from your chats to start a conversation. When they’re online, you’ll see it here.
                                </p>
                                <div className="mt-8 flex items-center gap-2 text-xs text-[#829089]">
                                    <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                                    {connectionState === 'connected' ? 'Live presence connected' : 'Connecting to live presence'}
                                </div>
                            </div>
                        </section>
                    )}
                </section>
            </main>
        </div>
    )
}

export default Home
