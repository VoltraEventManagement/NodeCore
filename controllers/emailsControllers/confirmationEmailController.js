const { StatusCodes } = require("http-status-codes")
const generateQRCode = require("../../services/generateQR")
const sendConfirmationEmail = require("../../services/sendConfirmationEmail")

const confirmationEmail = async (req, res) => {
    const { user_id, email, username, event_id, title, date, checkInToken } = req.body
    if (!user_id || !email || !username || !event_id || !title || !date || !checkInToken) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({
                success: false,
                message: "Please send all fields user_id , email , username , event_id , title , date, checkInToken"
            })
    }
    try {
        const qrImage = await generateQRCode(checkInToken)
        await sendConfirmationEmail( username, email, title, date, qrImage)
        res
            .status(StatusCodes.OK)
            .json({
                success: true,
                message: "confirmation email is sent successfully ✅"
            })
    } catch (error) {
       return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
            success : false ,
            message : "Falied to send confirmation email ❌"
        })
    }

}


module.exports = confirmationEmail