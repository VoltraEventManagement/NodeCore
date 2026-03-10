const express = require('express')
const emailRouter = express.Router()
const confirmationEmail = require("../../controllers/emailsControllers/confirmationEmailController")

emailRouter.post("/sendConfEmail", confirmationEmail)

module.exports = emailRouter