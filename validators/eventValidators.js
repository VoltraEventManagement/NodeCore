const { z } = require("zod")

const speakerValidator = z.object({
  name: z.string().min(1, "Speaker name is required"),
  position: z.string().min(2, "Speaker position is required"),
  linked_profile: z.url("Invalid LinkedIn profile URL"),
});


const createEventValidator = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.coerce.date({ errorMap: () => ({ message: "Invalid date format" }) }),
time: z
  .string()
  .regex(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i, {
    message: "Time must be in format H:MM AM/PM or HH:MM AM/PM (e.g. 1:30 PM or 12:05 AM)",
  }),
  city: z.string().min(2, "city is required"),
  description: z.string().min(1, "Description of event is required"),
  type: z.string().min(2, "please define type of event (online, offline"),
  target_audience: z.string().min(1, "please define your target_audience"),
  category: z.string().min(1, "please define category of event (public, private)"),
  venue: z.preprocess((val) => val === "false", z.boolean()),
  is_finished: z.preprocess((val) => val === "false", z.boolean()),
  paid: z.preprocess((val) => val === "false", z.boolean()),
  // event_speakers: z.array(speakerValidator).min(1, "At least one speaker is required"),
  event_speakers: z.string().optional()
})


const imageSchema = z.object({
  mimetype: z.enum(["image/png", "image/jpeg", "image/jpg", "image/webp"], {
    errorMap: () => ({ message: "Invalid image type. Allowed types: png, jpeg, jpg, webp" })
  }),
  size: z.number().max(5 * 1024 * 1024, {
    message: "Image size should not exceed 5MB"
  })
});


const updateEventValidator = createEventValidator.partial()
/*all fields are optional just make sure if anthing pass in req body has the same
format we define in create event 
*/

const eventIdParamValidator = z.object({
  event_id: z.coerce.number(),
});
const deleteEventValidator = z.object({
  event_id: z.coerce.number()
})

const eventIdValidator = z.object({
  event_id: z.coerce.number()
});

const eventDateValidator = z.object({
  date: z.coerce.date({ errorMap: () => ({ message: "Invalid date format" }) })
})

const registerationEventValidator = z.object({
  id: z.coerce.number(),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  track: z.string().min(1, "Please choose a track"),
  is_checked: z.boolean(),
  ALX_status: z.string().min(1, "Please choose learner, alumni, or guest"),
});

const UnregisterEventValidator = z.object({
  id: z.coerce.number(),
});


module.exports = {
  createEventValidator,
  updateEventValidator,
  deleteEventValidator,
  eventIdValidator,
  eventDateValidator,
  registerationEventValidator,
  UnregisterEventValidator,
  eventIdParamValidator,
  imageSchema
}
