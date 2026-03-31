require("dotenv").config()
const { StatusCodes } = require("http-status-codes")
const jwt = require("jsonwebtoken")

const authenticatedUser = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({
                    success: false,
                    message: "No token provided"
                })
        }

        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET) 
        req.user = decoded   
        next()

    } catch (error) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({
                success: false,
                message: "Invalid or expired token",
                error: error.message
            })
    }
}

module.exports = authenticatedUser