const {StatusCodes} = require("http-status-codes")


const errorHandler = (err, req,res, next)=>{
    console.error(err.stack)
    
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    return res
    .status(statusCode)
    .json({
        success :false , 
        message : err.message || "Internal server error",
        errors:err.errors || null
    })
}

module.exports = errorHandler