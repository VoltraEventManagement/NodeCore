//  general routes for user or admin

const express = require("express")
const eventRouter = express.Router()
const authenticatedUser = require("../../middlewares/userAuthentication")
const { upcomingEvents, pastEvents, getEventsByDate, registerForEvent, UnRegisterForEvent, getSingleEvent, getTotalEvents, getTotalAttendees ,verifyQr} = require("../../controllers/eventsControllers/eventController")
const { 
    eventIdValidator,
    eventDateValidator,
    registerationEventValidator,
    UnregisterEventValidator,
 } = require("../../validators/eventValidators")

const validationSchema = require("../../middlewares/validation")


eventRouter.get("/totalEvents", getTotalEvents)
eventRouter.get("/totalAttendees", getTotalAttendees)
eventRouter.get("/upcoming", upcomingEvents)
eventRouter.get("/past", pastEvents)
eventRouter.get("/date", validationSchema(eventDateValidator , "query"), getEventsByDate)   //filter events by date 
eventRouter.get("/:event_id",validationSchema(eventIdValidator , "params"), getSingleEvent)
eventRouter.post("/verify-qr", verifyQr)

eventRouter.use(authenticatedUser)

eventRouter.post("/:event_id/register", validationSchema(eventIdValidator, "params") ,validationSchema(registerationEventValidator), registerForEvent)
eventRouter.delete("/:event_id/unregister",validationSchema(eventIdValidator , "params"),validationSchema(UnregisterEventValidator), UnRegisterForEvent)




module.exports = eventRouter