import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { serverUrl } from '../config.js'
import axios from "axios"
import { setUserData } from '../redux/userSlice'
import { useDispatch } from 'react-redux'
import ChatlyLogo from '../components/ChatlyLogo'

const Login = () => {

    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("") 
    let dispatch = useDispatch()

  
    const handleLogIn = async (e) => {
        e.preventDefault();
        console.log("1. Login function called");


        setErrorMessage("")
        setLoading(true)

        try {
            const result = await axios.post(`${serverUrl}/api/auth/login`, {

                email, password

            }, { withCredentials: true })
 
             dispatch(setUserData(result.data.user))

            console.log("Login response:", result.data);
            console.log("Login successful");


            setEmail("")
            setPassword("")
        } catch (error) {



            console.log("Login failed:", error.response?.data || error.message);
        }
        finally {
            setLoading(false)
        }
    }


    return (
        <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
            <section className="relative hidden overflow-hidden bg-indigo-600 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/60" />
                <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-violet-500/40" />

                <ChatlyLogo to="/signup" inverse className="relative" />

                <div className="relative max-w-lg">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">Good conversations start here</p>
                    <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                        Your people, just a message away.
                    </h1>
                    <p className="mt-5 max-w-md text-lg leading-8 text-indigo-100">
                        Catch up, share a laugh, and stay close — wherever the day takes you.
                    </p>

                    <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-sm font-semibold text-amber-950">M</span>
                            <div>
                                <p className="font-medium">Maya</p>
                                <p className="text-xs text-indigo-200">online now</p>
                            </div>
                            <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-300" />
                        </div>
                        <div className="mt-5 space-y-3 text-sm">
                            <p className="w-fit rounded-2xl rounded-tl-sm bg-white/15 px-4 py-3">Hey! Are we still on for coffee? ☕</p>
                            <p className="ml-auto w-fit rounded-2xl rounded-tr-sm bg-white px-4 py-3 text-slate-700">Wouldn’t miss it 😊</p>
                        </div>
                    </div>
                </div>

                <p className="relative text-sm text-indigo-200">A little closer, every day.</p>
            </section>

            <section className="flex min-h-dvh items-center justify-center px-6 py-10">
                <div className="mx-auto w-full max-w-sm">
                    <div className="mb-8 flex justify-center lg:hidden">
                        <ChatlyLogo to="/signup" />
                    </div>

                    <p className="text-center text-sm font-semibold text-indigo-600">LET’S GET YOU STARTED</p>
                    <h2 className="mt-2 text-center text-3xl font-semibold text-slate-900">Welcome back</h2>
                    <p className="mt-2 text-center text-slate-500">Log in to continue your conversations.</p>

                    <form className="mt-8 space-y-5" onSubmit={handleLogIn} >
                        {errorMessage && (
                            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                {errorMessage}
                            </p>
                        )}

                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="Sky@gmail.com"
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setErrorMessage("")
                                }}
                                value={email}

                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Password at least 6 character"
                                    minLength={6}
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"

                                    onChange={(e) => {

                                        setPassword(e.target.value)
                                        setErrorMessage("")

                                    }}
                                    value={password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-indigo-600"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >

                            {loading ? "Loading..." : "Log In"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-500">
                        Dont have an account Create Now{''}
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Create new Account
                        </button>
                    </p>
                </div>
            </section>
        </main>
    )
}

export default Login
