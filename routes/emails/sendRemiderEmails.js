const express = require("express")
const reminderEmailRouter = express.Router()
const reminderEmail = require("../../controllers/emailsControllers/reminderEmailController")

reminderEmailRouter.post("/sendReminderEmail", reminderEmail)

module.exports = reminderEmailRouter