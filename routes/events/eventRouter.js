//  general routes for user or admin

const express = require("express")
const eventRouter = express.Router()
const authenticatedUser = require("../../middlewares/userAuthentication")
const { upcomingEvents, pastEvents, getEventsByDate, registerForEvent, UnRegisterForEvent, getSingleEvent, getTotalEvents, getTotalAttendees ,verifyQr, upcomingEventsApp} = require("../../controllers/eventsControllers/eventController")
const { 
    eventIdValidator,
    eventDateValidator,
    registerationEventValidator,
    UnregisterEventValidator,
 } = require("../../validators/eventValidators")

const validationSchema = require("../../middlewares/validation")
const optionalAuth = require("../../middlewares/optinalAuth")   


eventRouter.get("/totalEvents", optionalAuth, getTotalEvents)
eventRouter.get("/totalAttendees", optionalAuth, getTotalAttendees)
eventRouter.get("/upcoming", optionalAuth, upcomingEvents)
eventRouter.get("/past", optionalAuth, pastEvents)

eventRouter.post("/verify-qr", verifyQr)
eventRouter.get("/upcomingEventsApp",upcomingEventsApp)
eventRouter.get("/date", validationSchema(eventDateValidator , "query"), getEventsByDate) 
eventRouter.get("/:event_id",validationSchema(eventIdValidator , "params"), getSingleEvent)

eventRouter.use(authenticatedUser)

eventRouter.post("/:event_id/register", validationSchema(eventIdValidator, "params") ,registerForEvent)
eventRouter.delete("/:event_id/unregister",validationSchema(eventIdValidator , "params"),UnRegisterForEvent)




module.exports = eventRouter