const { StatusCodes } = require("http-status-codes")
const sendReminderEmails = require("../../services/sendReminderEmails")

const reminderEmail = async (req, res) => {
    const { event_id, title, date, users } = req.body
    if (!event_id || !title || !date || !Array.isArray(users) || users.length === 0) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({
                succuss: false,
                mesaage: "Missing required fields or users list"
            })
    }
    try {
      const result = await sendReminderEmails(title, date , users)
      if(result.succuss){
          return res.status(StatusCodes.OK).json({succuss: true , message :  `reminder emails are sent successfully for ${users.length} users ✅`})
      }
      else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to send reminder emails ❌",
        error: result.error,
      });
    }
    }
    catch (error) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({
                success: false,
                message: "Unexpected error occurred while sending reminder emails 🛠️❌ ",
                error :error.mesaage
            })
    }

}

module.exports = reminderEmail