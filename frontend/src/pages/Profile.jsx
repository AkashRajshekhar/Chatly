import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    FiArrowLeft,
    FiAtSign,
    FiCalendar,
    FiCheck,
    FiEdit2,
    FiMail,
    FiSave,
    FiShield,
    FiTrash2,
    FiUpload,
    FiUser,
    FiX,
} from 'react-icons/fi'
import { serverUrl } from '../config.js'
import { setUserData } from '../redux/userSlice'
import ChatHeader from '../components/ChatHeader'
import UserAvatar from '../components/UserAvatar'

const Profile = () => {
    const dispatch = useDispatch()
    const user = useSelector((state) => state.user.userData)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [profileFile, setProfileFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [removePhoto, setRemovePhoto] = useState(false)
    const fileInputRef = useRef(null)
    const [form, setForm] = useState(() => ({
        name: user?.name || '',
        username: user?.username || '',
        profileImg: user?.profileImg || '',
    }))

    const displayName = user?.name || user?.username || 'Chatly member'
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null
    const joinedDate = createdAt && !Number.isNaN(createdAt.getTime())
        ? createdAt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : 'Recently joined'
    const hasChanges = form.name !== (user?.name || '')
        || form.username !== (user?.username || '')
        || form.profileImg !== (user?.profileImg || '')
        || Boolean(profileFile)
        || removePhoto

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
    }, [previewUrl])

    const updateField = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setErrorMessage('')
        setSuccessMessage('')
    }

    const cancelEditing = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
        setProfileFile(null)
        setRemovePhoto(false)
        setForm({
            name: user?.name || '',
            username: user?.username || '',
            profileImg: user?.profileImg || '',
        })
        setEditing(false)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const choosePhoto = (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setErrorMessage('Choose a JPEG, PNG, or WebP image.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage('Profile photos must be 5 MB or smaller.')
            return
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(file))
        setProfileFile(file)
        setRemovePhoto(false)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const clearPhoto = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
        setProfileFile(null)
        setRemovePhoto(true)
        setForm((current) => ({ ...current, profileImg: '' }))
        setErrorMessage('')
        setSuccessMessage('')
    }

    const saveProfile = async (event) => {
        event.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')

        const updates = {
            name: form.name.trim(),
            username: form.username.trim(),
        }

        if (updates.name.length > 60) {
            setErrorMessage('Display name must be 60 characters or fewer.')
            return
        }
        if (!/^[a-zA-Z0-9_.]{3,24}$/.test(updates.username)) {
            setErrorMessage('Username must be 3–24 characters and use letters, numbers, dots, or underscores.')
            return
        }

        setSaving(true)
        try {
            let payload = updates
            if (profileFile) {
                payload = new FormData()
                payload.append('name', updates.name)
                payload.append('username', updates.username)
                payload.append('profileImage', profileFile)
            } else if (removePhoto) {
                payload = { ...updates, profileImg: '' }
            }
            const response = await axios.patch(`${serverUrl}/api/user/current`, payload, {
                withCredentials: true,
            })
            dispatch(setUserData(response.data.user))
            setForm({
                name: response.data.user.name || '',
                username: response.data.user.username || '',
                profileImg: response.data.user.profileImg || '',
            })
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl('')
            setProfileFile(null)
            setRemovePhoto(false)
            setSuccessMessage('Your profile has been updated.')
            setEditing(false)
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to save your profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const avatarUser = editing
        ? { ...user, ...form, profileImg: previewUrl || (removePhoto ? '' : form.profileImg) }
        : user

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
            <ChatHeader />

            <main className="mx-auto min-w-0 w-full max-w-5xl px-3 py-5 sm:px-8 sm:py-8">
                <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
                    <FiArrowLeft size={16} /> Back to inbox
                </Link>

                <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_12px_40px_rgba(49,46,129,0.1)]">
                    <div className="relative h-32 overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 sm:h-40">
                        <div className="absolute -right-12 -top-36 h-80 w-80 rounded-full border-[42px] border-white/10" />
                        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
                        <div className="absolute bottom-5 left-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-50 sm:bottom-7 sm:left-9">
                            Your Chatly profile
                        </div>
                    </div>

                    <div className="relative z-10 -mt-10 min-w-0 px-4 pb-6 sm:-mt-12 sm:px-8 sm:pb-8">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex min-w-0 items-end gap-4">
                                <UserAvatar
                                    user={avatarUser}
                                    size="lg"
                                    className="h-20 w-20 rounded-3xl border-4 border-white text-3xl shadow-lg sm:h-24 sm:w-24"
                                />
                                <div className="min-w-0 pb-1">
                                    <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{displayName}</h1>
                                    <p className="mt-1 truncate text-sm text-slate-500">@{user?.username || 'username'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start rounded-full bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 sm:self-auto">
                                <FiShield size={14} /> Account active
                            </div>
                        </div>

                        {(errorMessage || successMessage) && (
                            <div
                                role={errorMessage ? 'alert' : 'status'}
                                className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                                    errorMessage
                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                        : 'border-indigo-200 bg-indigo-50 text-indigo-800'
                                }`}
                            >
                                {successMessage && <FiCheck className="mr-2 inline" size={16} />}
                                {errorMessage || successMessage}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Account details</h2>
                                <p className="mt-1 text-sm text-slate-500">Manage the details people see when they chat with you.</p>
                            </div>
                            {!editing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuccessMessage('')
                                        setErrorMessage('')
                                        setEditing(true)
                                    }}
                                    className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    <FiEdit2 size={15} /> Edit profile
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <form onSubmit={saveProfile} className="mt-5 min-w-0">
                                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                                    <label className="block min-w-0">
                                        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <FiUser size={14} /> Display name
                                        </span>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={updateField}
                                            maxLength={60}
                                            placeholder="How should people call you?"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                                        />
                                    </label>
                                    <label className="block min-w-0">
                                        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <FiAtSign size={14} /> Username
                                        </span>
                                        <input
                                            name="username"
                                            value={form.username}
                                            onChange={updateField}
                                            minLength={3}
                                            maxLength={24}
                                            required
                                            autoComplete="username"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                                        />
                                        <span className="mt-1.5 block text-xs text-slate-400">3–24 letters, numbers, dots, or underscores.</span>
                                    </label>
                                    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:col-span-2 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <UserAvatar user={avatarUser} size="md" className="h-14 w-14" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800">Profile photo</p>
                                                <p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP · up to 5 MB</p>
                                                {profileFile && <p className="mt-1 truncate text-xs text-indigo-700">{profileFile.name}</p>}
                                            </div>
                                        </div>
                                        <div className="flex min-w-0 flex-wrap gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={choosePhoto}
                                                className="sr-only"
                                                aria-label="Choose a profile photo"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                <FiUpload size={15} /> Upload photo
                                            </button>
                                            {(profileFile || (user?.profileImg && !removePhoto)) && (
                                                <button
                                                    type="button"
                                                    onClick={clearPhoto}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                                >
                                                    <FiTrash2 size={15} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={cancelEditing}
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        <FiX size={16} /> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || !hasChanges}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FiSave size={15} /> {saving ? 'Saving…' : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <FiUser size={14} /> Display name
                                    </div>
                                    <p className="mt-3 truncate text-sm font-medium text-slate-800">{user?.name || 'Not set'}</p>
                                </div>
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <FiAtSign size={14} /> Username
                                    </div>
                                    <p className="mt-3 truncate text-sm font-medium text-slate-800">@{user?.username || '—'}</p>
                                </div>
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <FiMail size={14} /> Email address
                                    </div>
                                    <p className="mt-3 truncate text-sm font-medium text-slate-800">{user?.email || '—'}</p>
                                    <p className="mt-1 text-xs text-slate-400">Email changes aren’t available here.</p>
                                </div>
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <FiCalendar size={14} /> Member since
                                    </div>
                                    <p className="mt-3 truncate text-sm font-medium text-slate-800">{joinedDate}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl bg-indigo-50 p-5 sm:flex-row sm:items-center sm:px-6">
                            <div>
                                <h2 className="text-sm font-semibold text-indigo-950">Ready to catch up?</h2>
                                <p className="mt-1 text-sm text-indigo-700">Head back to your inbox and see what’s waiting.</p>
                            </div>
                            <Link
                                to="/"
                                className="inline-flex w-fit items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                            >
                                Go to inbox
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Profile
