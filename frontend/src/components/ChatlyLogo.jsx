import { Link } from 'react-router-dom'

const ChatlyLogo = ({ to = '/', inverse = false, className = '', iconClassName = 'h-10 w-10', textClassName = 'text-xl' }) => (
    <Link
        to={to}
        aria-label="Chatly home"
        className={`inline-flex w-fit shrink-0 items-center gap-2.5 ${className}`}
    >
        <svg
            aria-hidden="true"
            viewBox="0 0 64 64"
            className={`${iconClassName} shrink-0`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M32 4C18.745 4 8 14.745 8 28c0 6.41 2.514 12.233 6.61 16.54L7 58h22.62C43.04 59.25 56 47.86 56 32 56 16.536 45.464 4 32 4Z"
                fill="#0866FF"
            />
            <path
                d="M32 16.5c1.9 7.05 5.45 10.6 12.5 12.5-7.05 1.9-10.6 5.45-12.5 12.5-1.9-7.05-5.45-10.6-12.5-12.5 7.05-1.9 10.6-5.45 12.5-12.5Z"
                fill="white"
                stroke="white"
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
        </svg>
        <span className={`${textClassName} font-bold tracking-tight ${inverse ? 'text-white' : 'text-slate-950'}`}>
            Chatly
        </span>
    </Link>
)

export default ChatlyLogo
