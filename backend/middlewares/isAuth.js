import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "Token is not found"
            });
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)
        const userId = verifyToken.id || verifyToken.userId

        if (!userId) {
            return res.status(401).json({ message: "Token does not contain a user id" })
        }

        req.userId = userId

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Invalid or expired token" })
        }

        return res.status(500).json({ message: `Authentication error: ${error.message}` })
    }
}


export default isAuth;