const jwt = require("jsonwebtoken")
require("dotenv").config()

const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded JWT Payload:", decoded);
        req.user = decoded;
        next();

    } catch (error) {
    console.log("JWT Error Name:", error.name);
    console.log("JWT Error Message:", error.message);
    req.user = null;
    next();
}
};

module.exports = optionalAuth;