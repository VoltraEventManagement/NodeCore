const { StatusCodes } = require("http-status-codes")

const validationSchema = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source])   // source to handle (body , query , params not single one)
    // invalid inputs inside req body  
    if (!result.success) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({
                success: false,
                errors: result.error.flatten(),
            })
    }

    req[source] = result.data
    next()
}
module.exports = validationSchema