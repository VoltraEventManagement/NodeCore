const { StatusCodes } = require("http-status-codes")
const pool = require("../../DB/connectPostgresql")
const generateQRCode = require("../../services/generateQR")
const sendConfirmationEmail = require("../../services/sendConfirmationEmail")

const upcomingEvents = async (req, res) => {
    try {
        const eventsResult = await pool.query(`
            SELECT *
            FROM "event_event"
            WHERE date >= CURRENT_DATE
            ORDER BY date ASC;
        `);
        const events = eventsResult.rows;
        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "No upcoming events found",
                totalEvents: 0,
                data: []
            });
        }

        const enhancedEvents = await Promise.all(events.map(async (event) => {
            const event_id = event.event_id;

            const speakersResult = await pool.query(`
                SELECT s.speaker_id, s.name, s.position
                FROM "event_speaker" s
                JOIN "event_event_event_speakers" j
                ON s.speaker_id = j.speaker_id
                WHERE j.event_id = $1
            `, [event_id]);

            const photosResult = await pool.query(`
                SELECT photo
                FROM "event_photo"
                WHERE event_id_id = $1
            `, [event_id]);

            const photos = photosResult.rows.map(p => p.photo); // أو لو Cloudinary: p.photo

            return {
                ...event,
                event_speakers: speakersResult.rows,
                photos: photos
            };
        }));

        console.log("Upcoming Events ✅");

        res.status(StatusCodes.OK).json({
            success: true,
            totalEvents: events.length,
            data: enhancedEvents
        });

    } catch (error) {
        console.error("Upcoming Events Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get upcoming events",
            error: error.message
        });
    }
};





const pastEvents = async (req, res) => {
    try {
        // 1️⃣ Get all past events
        const eventsResult = await pool.query(`
            SELECT *
            FROM "event_event"
            WHERE date < CURRENT_DATE
            ORDER BY date DESC;
        `);

        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "No past events are found",
                totalEvents: 0,
                data: []
            });
        }

        // 2️⃣ Fetch photos and speakers for each event
        const enhancedEvents = await Promise.all(events.map(async (event) => {
            const event_id = event.event_id;

            // Get speakers
            const speakersResult = await pool.query(`
                SELECT s.speaker_id, s.name, s.position
                FROM "event_speaker" s
                JOIN "event_event_event_speakers" j
                ON s.speaker_id = j.speaker_id
                WHERE j.event_id = $1
            `, [event_id]);

            // Get photos
            const photosResult = await pool.query(`
                SELECT photo
                FROM "event_photo"
                WHERE event_id_id = $1
            `, [event_id]);

            const photos = photosResult.rows.map(p => p.photo); // لو Cloudinary, استخدمي result.secure_url

            // Count attendees
            const attendeesResult = await pool.query(`
                SELECT COUNT(*) AS num_attendees
                FROM "event_eventuser"
                WHERE event_id_id = $1
            `, [event_id]);

            const num_attendees = parseInt(attendeesResult.rows[0].num_attendees, 10);

            return {
                ...event,
                event_speakers: speakersResult.rows,
                photos: photos,
                num_attendees: num_attendees
            };
        }));

        console.log(`Past Events ✅ Total: ${enhancedEvents.length}`);

        res.status(StatusCodes.OK).json({
            success: true,
            totalEvents: enhancedEvents.length,
            data: enhancedEvents
        });

    } catch (error) {
        console.error("Past Events Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get past events",
            error: error.message
        });
    }
};



const getEventsByDate = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required in format YYYY-MM-DD"
            });
        }

        // 1️⃣ Get events on that date
        const eventsResult = await pool.query(
            `SELECT * FROM "event_event" WHERE DATE(date) = $1 ORDER BY date ASC`,
            [date]
        );

        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: false,
                message: `No events found on ${date}`,
                totalEvents: 0,
                data: []
            });
        }

        // 2️⃣ Enhance events with speakers and photos
        const enhancedEvents = await Promise.all(events.map(async (event) => {
            const event_id = event.event_id;

            // Speakers
            const speakersResult = await pool.query(`
                SELECT s.speaker_id, s.name, s.position
                FROM "event_speaker" s
                JOIN "event_event_event_speakers" j ON s.speaker_id = j.speaker_id
                WHERE j.event_id = $1
            `, [event_id]);

            // Photos only for past events
            const today = new Date().toISOString().split("T")[0];
            let photos = [];
            if (event.date < today) {
                const photosResult = await pool.query(`
                    SELECT photo
                    FROM "event_photo"
                    WHERE event_id_id = $1
                `, [event_id]);
                photos = photosResult.rows.map(p => p.photo);
            }

            // Count attendees
            const attendeesResult = await pool.query(`
                SELECT COUNT(*) AS num_attendees
                FROM "event_eventuser"
                WHERE event_id_id = $1
            `, [event_id]);

            const num_attendees = parseInt(attendeesResult.rows[0].num_attendees, 10);

            return {
                ...event,
                event_speakers: speakersResult.rows,
                photos,
                num_attendees
            };
        }));

        res.status(StatusCodes.OK).json({
            success: true,
            totalEvents: enhancedEvents.length,
            data: enhancedEvents
        });

    } catch (error) {
        console.error("getEventsByDate Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get events for the selected date",
            error: error.message
        });
    }
};


const getTotalEvents = async (req, res) => {
    try {
        console.log("Getting total events count... ✅");

        const eventsResult = await pool.query(`SELECT * FROM "event_event" ORDER BY date ASC`);
        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "No events are found",
                totalEvents: 0,
                data: []
            });
        }

        const enhancedEvents = await Promise.all(events.map(async (event) => {
            const event_id = event.event_id;

            const speakersResult = await pool.query(`
                SELECT s.speaker_id, s.name, s.position
                FROM "event_speaker" s
                JOIN "event_event_event_speakers" j ON s.speaker_id = j.speaker_id
                WHERE j.event_id = $1
            `, [event_id]);

            
            const photosResult = await pool.query(`
                SELECT photo
                FROM "event_photo"
                WHERE event_id_id = $1
            `, [event_id]);

            const attendeesResult = await pool.query(`
                SELECT COUNT(*) AS num_attendees
                FROM "event_eventuser"
                WHERE event_id_id = $1
            `, [event_id]);

            return {
                ...event,
                event_speakers: speakersResult.rows,
                photos: photosResult.rows.map(p => p.photo),
                num_attendees: parseInt(attendeesResult.rows[0].num_attendees, 10)
            };
        }));

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Total events: ${enhancedEvents.length}`,
            totalEvents: enhancedEvents.length,
            data: enhancedEvents
        });

    } catch (error) {
        console.error("Get Total Events Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get total events",
            error: error.message
        });
    }
};





const getTotalAttendees = async (req, res) => {
    try {
        const selectQuery = `
            SELECT COUNT(*) AS total_attendees
            FROM "event_eventuser"
        `
        const result = await pool.query(selectQuery)
        return res.status(StatusCodes.OK).json({
            success: true,
            totalAttendees: parseInt(result.rows[0].total_attendees, 10),
            message: `The total number of attendees is ${result.rows[0].total_attendees} attendees`
        })

    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "ERROR: Failed to get total attendees",
            error: error.message
        })
    }
}




const getSingleEvent = async (req, res) => {
    const { event_id } = req.params;
    try {
        const checkQuery = `SELECT * FROM "event_event" WHERE event_id = $1`;
        const foundEvent = await pool.query(checkQuery, [event_id]);

        if (foundEvent.rows.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: `This event with ID ${event_id} Not Found`
            });
        }
        const event = foundEvent.rows[0];
        const speakerQuery = `
            SELECT s.speaker_id, s.name, s.position
            FROM "event_event_event_speakers" es
            JOIN event_speaker s ON es.speaker_id = s.speaker_id
            WHERE es.event_id = $1
        `;
        const speakersResult = await pool.query(speakerQuery, [event_id]);
        const speakers = speakersResult.rows;
        const photoQuery = `SELECT photo FROM "event_photo" WHERE event_id_id = $1`;
        const photosResult = await pool.query(photoQuery, [event_id]);
        const photos = photosResult.rows.map(p => 
            `${req.protocol}://${req.get("host")}/uploads/${p.photo}`
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                ...event,
                speakers,
                photos
            }
        });
    } catch (error) {
        console.error(`Error: Failed to get this event with ID ${event_id}`, error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Error: Failed to get this event with ID ${event_id}`,
            error: error.message
        });
    }
};




const registerForEvent = async (req, res) => {
    const { event_id } = req.params
    const { id, username, email, track, is_checked ,ALX_status } = req.body
    const check = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'event_eventuser'`, [])
    console.log(check.rows)
    console.log(`Registering user ${username}  && ${ALX_status}(ID: ${id}) for event ID ${event_id}... ✅`)
  
    try {
        const eventQuery = `SELECT title, date FROM "event_event" WHERE event_id = $1`
        const eventResult = await pool.query(eventQuery, [event_id])

        if (eventResult.rows.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found"
            })
        }

        const { title, date } = eventResult.rows[0]

        const checkQuery = `SELECT * FROM "event_eventuser" WHERE user_id_id = $1 AND event_id_id = $2`
        const checkResult = await pool.query(checkQuery, [id, event_id])

        if (checkResult.rows.length > 0) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: `User already registered for ${title}`
            })
        }
        // const checkInToken = uuidv4().slice(0, 16)
        const insertQuery = `INSERT INTO "event_eventuser" (user_id_id, event_id_id, track, is_checked ) VALUES ($1, $2, $3, false) `
        await pool.query(insertQuery, [id, event_id, track])

        const qrImage = await generateQRCode(id, event_id)
        await sendConfirmationEmail(username, email, title, date, qrImage)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Registered successfully and confirmation email sent ✅"
        })

    } catch (error) {
        console.error("Registration Error:", error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to register for event"
        })
    }
}




const UnRegisterForEvent = async (req, res) => {
    const { event_id } = req.params
    const { id } = req.body
    try {
        const checkQuery = `SELECT * FROM "event_eventuser" WHERE user_id_id = $1 AND event_id_id = $2`
        const result = await pool.query(checkQuery, [id, event_id])

        if (result.rows.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "You are not registered for this event"
            })
        }

        const deleteQuery = `DELETE FROM "event_eventuser" WHERE user_id_id = $1 AND event_id_id = $2`
        await pool.query(deleteQuery, [id, event_id])

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Registration cancelled successfully"
        })

    } catch (error) {
        console.error("Cancel Registration Error:", error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to cancel registration"
        })
    }
}



const verifyQr = async (req, res) => {
    const { qrData } = req.body
    try {
        const { id, event_id } = JSON.parse(qrData)
        const checkQuery = `SELECT * FROM "event_eventuser" WHERE user_id_id = $1 AND event_id_id = $2`
        const result = await pool.query(checkQuery, [id, event_id])
        if (result.rows.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid QR code or user not registered for this event"
            })
        }
        const isChecked = result.rows[0].is_checked
        if (isChecked) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,     
                message: "User already checked in for this event"
            })
        }
        const updateQuery = `UPDATE "event_eventuser" SET is_checked = true WHERE user_id_id = $1 AND event_id_id = $2`
        await pool.query(updateQuery, [id, event_id])

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "QR code verified successfully, user checked in"
        })    
    } catch (error) {
        console.error("QR Verification Error:", error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to verify QR code"
        })
        }
    }


module.exports = {
    upcomingEvents,
    pastEvents,
    getEventsByDate,
    registerForEvent,
    UnRegisterForEvent,
    getSingleEvent,
    getTotalEvents,
    getTotalAttendees,
    verifyQr
}