import { serverUrl } from '../config.js'

const UserAvatar = ({ user, size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-10 w-10 text-sm',
        md: 'h-12 w-12 text-base',
        lg: 'h-28 w-28 text-3xl',
    }
    const name = user?.name || user?.username || 'User'
    const profileImage = user?.profileImg
        ? user.profileImg.startsWith('/')
            ? `${serverUrl}${user.profileImg}`
            : user.profileImg
        : null

    return profileImage ? (
        <img
            src={profileImage}
            alt={`${name}'s profile`}
            crossOrigin={profileImage.startsWith(`${serverUrl}/api/`) ? 'use-credentials' : undefined}
            className={`shrink-0 rounded-full object-cover ${sizes[size]} ${className}`}
        />
    ) : (
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${sizes[size]} ${className}`}>
            {name.charAt(0).toUpperCase()}
        </span>
    )
}

export default UserAvatar
