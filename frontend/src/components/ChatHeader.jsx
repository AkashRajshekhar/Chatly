import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { FiLogOut } from 'react-icons/fi'
import { serverUrl } from '../config.js'
import { setUserData } from '../redux/userSlice'
import UserAvatar from './UserAvatar'
import ChatlyLogo from './ChatlyLogo'

const ChatHeader = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.user.userData)
    const [loggingOut, setLoggingOut] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleLogOut = async () => {
        setErrorMessage('')
        setLoggingOut(true)

        try {
            await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
            dispatch(setUserData(null))
            navigate('/login')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to log out. Please try again.')
        } finally {
            setLoggingOut(false)
        }
    }

    const username = user?.username || user?.name || 'Your profile'

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-8">
                <ChatlyLogo iconClassName="h-8 w-8 sm:h-9 sm:w-9" textClassName="text-base sm:text-lg" className="gap-1.5 sm:gap-2.5" />

                <nav className="flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 p-1 sm:gap-1" aria-label="Main navigation">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `rounded-full px-2.5 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Inbox
                    </NavLink>
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `hidden rounded-full px-4 py-2 text-sm font-medium transition sm:block ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Profile
                    </NavLink>
                </nav>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                    <Link to="/profile" aria-label="Open your profile" title={`Profile: ${username}`} className="flex h-10 items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-indigo-50 sm:pr-3">
                        <UserAvatar user={user} size="sm" className="h-9 w-9 border-2 border-white shadow-sm" />
                        <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:inline">{username}</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogOut}
                        disabled={loggingOut}
                        className="flex h-10 items-center gap-2 rounded-full border border-slate-200 px-2.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
                        aria-label="Log out"
                    >
                        <FiLogOut size={16} />
                        <span className="hidden sm:inline">{loggingOut ? 'Logging out…' : 'Log out'}</span>
                    </button>
                </div>
            </div>
            {errorMessage && (
                <p role="alert" className="border-t border-rose-100 bg-rose-50 px-5 py-2 text-center text-sm text-rose-700">
                    {errorMessage}
                </p>
            )}
        </header>
    )
}

export default ChatHeader
