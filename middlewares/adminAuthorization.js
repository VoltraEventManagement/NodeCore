const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authorizedAdmin = (...roles) => {
  return (req, res, next) => {
    try {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }
    next();
}catch (error) {
    console.error("Authorization error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred during authorization",
    });
  }
  };
};

module.exports = authorizedAdmin;