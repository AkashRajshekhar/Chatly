import User from "../models/user.model.js"
import mongoose from "mongoose"
import { unlink } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { basename, join } from "node:path"

const profileImageDirectory = fileURLToPath(new URL("../uploads/profile-images/", import.meta.url))

const removeUploadedFile = async (file) => {
    if (!file) return

    try {
        await unlink(file.path)
    } catch (error) {
        if (error.code !== "ENOENT") throw error
    }
}

export const getCurrentUser = async(req, res)=>{ 
    try {
        let userId = req.userId
        let user =await User.findById(userId).select("-password")
        if(!user){ 
            return res.status(400).json({message:"user not found"})

        }

        return res.status(200).json({ user })

    } catch (error) {
        return res.status(500).json({message:`current user error ${error}`})
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.userId } })
            .select("username name profileImg createdAt")
            .sort({ username: 1 })
            .lean()

        return res.status(200).json({ users })
    } catch (error) {
        return res.status(500).json({ message: `Unable to load people: ${error.message}` })
    }
}

export const updateCurrentUser = async (req, res) => {
    try {
        const updates = {}

        if (Object.hasOwn(req.body || {}, "name")) {
            const name = typeof req.body.name === "string" ? req.body.name.trim() : ""
            if (name.length > 60) {
                await removeUploadedFile(req.file)
                return res.status(400).json({ message: "Name must be 60 characters or fewer" })
            }
            updates.name = name
        }

        if (Object.hasOwn(req.body || {}, "username")) {
            const username = typeof req.body.username === "string" ? req.body.username.trim() : ""
            if (!/^[a-zA-Z0-9_.]{3,24}$/.test(username)) {
                await removeUploadedFile(req.file)
                return res.status(400).json({ message: "Username must be 3–24 characters and use letters, numbers, dots, or underscores" })
            }

            const existingUser = await User.findOne({
                username,
                _id: { $ne: new mongoose.Types.ObjectId(req.userId) },
            })
            if (existingUser) {
                await removeUploadedFile(req.file)
                return res.status(409).json({ message: "That username is already taken" })
            }
            updates.username = username
        }

        if (req.file) {
            updates.profileImg = `/uploads/profile-images/${req.file.filename}`
        } else if (Object.hasOwn(req.body || {}, "profileImg")) {
            const profileImg = typeof req.body.profileImg === "string" ? req.body.profileImg.trim() : ""
            if (profileImg) {
                try {
                    const imageUrl = new URL(profileImg)
                    if (!["http:", "https:"].includes(imageUrl.protocol)) {
                        await removeUploadedFile(req.file)
                        return res.status(400).json({ message: "Profile image must use an HTTP or HTTPS URL" })
                    }
                } catch {
                    await removeUploadedFile(req.file)
                    return res.status(400).json({ message: "Enter a valid profile image URL" })
                }
            }
            updates.profileImg = profileImg
        }

        if (Object.keys(updates).length === 0) {
            await removeUploadedFile(req.file)
            return res.status(400).json({ message: "No profile details were provided" })
        }

        const previousUser = Object.hasOwn(updates, "profileImg")
            ? await User.findById(req.userId).select("profileImg")
            : null
        const user = await User.findByIdAndUpdate(req.userId, updates, {
            new: true,
            runValidators: true,
        }).select("-password")

        if (!user) {
            await removeUploadedFile(req.file)
            return res.status(404).json({ message: "User not found" })
        }

        const previousImage = previousUser?.profileImg
        if (previousImage?.startsWith("/uploads/profile-images/") && previousImage !== user.profileImg) {
            const previousImagePath = join(profileImageDirectory, basename(previousImage))
            try {
                await unlink(previousImagePath)
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error("Unable to remove previous profile image:", error)
                }
            }
        }

        return res.status(200).json({ user })
    } catch (error) {
        try {
            await removeUploadedFile(req.file)
        } catch (cleanupError) {
            console.error("Unable to clean up uploaded profile image:", cleanupError)
        }
        if (error.code === 11000 && error.keyPattern?.username) {
            return res.status(409).json({ message: "That username is already taken" })
        }
        return res.status(500).json({ message: `Unable to update profile: ${error.message}` })
    }
}

export default getCurrentUser