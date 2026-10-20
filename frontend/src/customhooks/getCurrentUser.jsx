import { useEffect } from "react"
import axios from "axios"
import {serverUrl} from "../config.js"
import { useDispatch, useSelector } from "react-redux"
import { setUserData } from "../redux/userSlice"


const useCurrentUser = () => {
    const dispatch = useDispatch()
    const userData = useSelector((state) => state.user.userData)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
                dispatch(setUserData(result.data.user))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error('Unable to fetch the current user:', error)
                }
            }
        }

        if (!userData) {
            fetchUser()
        }
    }, [dispatch, userData])
}

export default useCurrentUser