const express = require("express")
const adminRouter = express.Router()
const authenticatedUser = require("../../middlewares/userAuthentication")
const authorizedAdmin = require("../../middlewares/adminAuthorization")
const {createEvent , updateEvent, deleteEvent , downloadMonthlyReportExcel } = require("../../controllers/eventsControllers/adminController")
const upload = require("../../middlewares/uploadFile")
const validationSchema = require("../../middlewares/validation")
const validationSchemaMultipart = require("../../middlewares/validationMultiPart")
const {createEventValidator, updateEventValidator, deleteEventValidator, eventIdParamValidator} = require("../../validators/eventValidators")

adminRouter.use(authenticatedUser)
adminRouter.post("/createEvent",authorizedAdmin("admin"), upload.array("photos",3),validationSchemaMultipart(createEventValidator, "body")  ,createEvent)
adminRouter.patch("/:event_id",authorizedAdmin("admin"),upload.array("photos",3),validationSchema(eventIdParamValidator, "params"),validationSchemaMultipart(updateEventValidator, "body"),updateEvent)
adminRouter.delete("/:event_id",authorizedAdmin("admin"),validationSchema(eventIdParamValidator, "params"),deleteEvent)

adminRouter.get("/downloadMonthlyReportExcel/:month", downloadMonthlyReportExcel)




module.exports =adminRouter