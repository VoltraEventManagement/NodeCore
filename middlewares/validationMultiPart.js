const { imageSchema } = require("../validators/eventValidators")

const validateMultipart = (schema) => {

    return (req, res, next) => {

        try {

            // validate body
            const body = schema.parse(req.body)

            req.validatedBody = body

            // validate images
            if (req.files) {

                req.files.forEach(file => {

                    imageSchema.parse({
                        mimetype: file.mimetype,
                        size: file.size
                    })

                })
            }
            next()
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            })

        }

    }

}

module.exports = validateMultipart