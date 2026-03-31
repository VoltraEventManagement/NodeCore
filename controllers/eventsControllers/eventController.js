const { StatusCodes } = require("http-status-codes")
const pool = require("../../DB/connectPostgresql")
const generateQRCode = require("../../services/generateQR")
const sendConfirmationEmail = require("../../services/sendConfirmationEmail")
const jwt = require("jsonwebtoken")
const jwtSecret ="4Ff8$9gH!2kLm#7pQwXzRt5vB!8yYn3b"
 


const upcomingEvents = async (req, res) => {
    try {
        const user = req.user;
        const allowedRolesForPrivate = ["learner", "alumni"];
        const canSeePrivate = user && allowedRolesForPrivate.includes(user.user_status);  // private member

        let query = `
            SELECT *
            FROM "event_event"
            WHERE date >= CURRENT_DATE
        `;

        if (!canSeePrivate) {
            query += ` AND category = 'public'`;
        }
        query += ` ORDER BY date ASC`;

        const eventsResult = await pool.query(query);
        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "No upcoming events found",
                totalEvents: 0,
                data: []
            });
        }

        const enhancedEvents = await Promise.all(
            events.map(async (event) => {
                const event_id = event.event_id;

                const [speakersResult, photosResult] = await Promise.all([
                    pool.query(
                        `
                        SELECT s.speaker_id, s.name, s.position, s.linked_profile
                        FROM "event_speaker" s
                        JOIN "event_event_event_speakers" j
                        ON s.speaker_id = j.speaker_id
                        WHERE j.event_id = $1
                        `,
                        [event_id]
                    ),

                    pool.query(
                        `
                        SELECT photo
                        FROM "event_photo"
                        WHERE event_id_id = $1
                        `,
                        [event_id]
                    )
                ]);

                return {
                    ...event,
                    event_speakers: speakersResult.rows,
                    photos: photosResult.rows.map((p) => p.photo)
                };
            })
        );

        console.log("Upcoming Events ✅");

        return res.status(StatusCodes.OK).json({
            success: true,
            totalEvents: enhancedEvents.length,
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
        const user = req.user;

        const allowedRolesForPrivate = ["learner", "alumni"];
        const canSeePrivate =
            user && allowedRolesForPrivate.includes(user.user_status);

        let query = `
            SELECT *
            FROM "event_event"
            WHERE date < CURRENT_DATE
        `;

        if (!canSeePrivate) {
            query += ` AND category = 'public'`;
        }

        query += ` ORDER BY date DESC`;

        const eventsResult = await pool.query(query);
        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "No past events are found",
                totalEvents: 0,
                data: []
            });
        }

        const enhancedEvents = await Promise.all(
            events.map(async (event) => {
                const event_id = event.event_id;

                const [speakersResult, photosResult] = await Promise.all([
                    pool.query(
                        `
                        SELECT s.speaker_id, s.name, s.position, s.linked_profile
                        FROM "event_speaker" s
                        JOIN "event_event_event_speakers" j
                        ON s.speaker_id = j.speaker_id
                        WHERE j.event_id = $1
                        `,
                        [event_id]
                    ),
                    pool.query(
                        `
                        SELECT photo
                        FROM "event_photo"
                        WHERE event_id_id = $1
                        `,
                        [event_id]
                    )
                ]);

                return {
                    ...event,
                    event_speakers: speakersResult.rows,
                    photos: photosResult.rows.map((p) => p.photo)
                };
            })
        );

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


const getTotalEvents = async (req, res) => {
    try {
        console.log("Getting total events count... ✅");

        const user = req.user;

        const allowedRolesForPrivate = ["learner", "alumni"];
        const canSeePrivate =
            user && allowedRolesForPrivate.includes(user.user_status);

        let query = `
            SELECT *
            FROM "event_event"
        `;

        if (!canSeePrivate) {
            query += ` WHERE category = 'public'`;
        }

        query += ` ORDER BY date ASC`;

        const eventsResult = await pool.query(query);
        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "No events are found",
                totalEvents: 0,
                data: []
            });
        }

        const enhancedEvents = await Promise.all(
            events.map(async (event) => {
                const event_id = event.event_id;

                const [speakersResult, photosResult] = await Promise.all([
                    pool.query(
                        `
                        SELECT s.speaker_id, s.name, s.position, s.linked_profile
                        FROM "event_speaker" s
                        JOIN "event_event_event_speakers" j 
                        ON s.speaker_id = j.speaker_id
                        WHERE j.event_id = $1
                        `,
                        [event_id]
                    ),
                    pool.query(
                        `
                        SELECT photo
                        FROM "event_photo"
                        WHERE event_id_id = $1
                        `,
                        [event_id]
                    )
                ]);

                return {
                    ...event,
                    event_speakers: speakersResult.rows,
                    photos: photosResult.rows.map((p) => p.photo)
                };
            })
        );

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
            SELECT s.speaker_id, s.name, s.position ,s.linked_profile
            FROM "event_event_event_speakers" es
            JOIN event_speaker s ON es.speaker_id = s.speaker_id
            WHERE es.event_id = $1
        `;
        const speakersResult = await pool.query(speakerQuery, [event_id]);
        const speakers = speakersResult.rows;
        const photoQuery = `SELECT photo FROM "event_photo" WHERE event_id_id = $1`;
        const photosResult = await pool.query(photoQuery, [event_id]);
        const photos = photosResult.rows.map(p => p.photo)
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


const getEventsByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const user = req.user;
        const allowedRolesForPrivate = ["learner", "alumni"];
        const canSeePrivate = user && allowedRolesForPrivate.includes(user.user_status);

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required in format YYYY-MM-DD"
            });
        }

        let query = `SELECT * FROM "event_event" WHERE DATE(date) = $1`;
        const queryParams = [date];

        if (!canSeePrivate) {
            query += ` AND category = 'public'`;
        }

        query += ` ORDER BY date ASC`;

        const eventsResult = await pool.query(query, queryParams);
        const events = eventsResult.rows;

        if (events.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: `No events found on ${date}`,
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

            return {
                ...event,
                event_speakers: speakersResult.rows,
                photos,
            };
        }));

        return res.status(StatusCodes.OK).json({
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




const registerForEvent = async (req, res) => {
    const { event_id } = req.params;
    const user = req.user;

    console.log(`User ${user?.user_id} is attempting to register for event ID: ${event_id}`);

    if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "You must be logged in"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Get event
        const eventResult = await client.query(
            `SELECT title, date, category, time 
             FROM "event_event" 
             WHERE event_id = $1`,
            [event_id]
        );

        if (eventResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found"
            });
        }

        const { title, date, category, time } = eventResult.rows[0];
        const formattedDate = date.toISOString().split("T")[0];

        // 2. Authorization check
        const allowedRolesForPrivate = ["learner", "alumni"];
        const canAccessPrivate =
            category === "public" ||
            allowedRolesForPrivate.includes(user.user_status);

        if (!canAccessPrivate) {
            await client.query("ROLLBACK");
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You are not allowed to register for this event"
            });
        }

        console.log(`User ${user.user_id} is trying to register for event: ${title}`);

        // 3. Check if already registered
        const checkResult = await client.query(
            `SELECT 1 FROM "event_eventuser" 
             WHERE user_id_id = $1 AND event_id_id = $2`,
            [user.user_id, event_id]
        );

        if (checkResult.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: `Already registered for ${title}`
            });
        }

        // 4. Insert registration
        await client.query(
            `INSERT INTO "event_eventuser" 
             (user_id_id, event_id_id, is_checked) 
             VALUES ($1, $2, false)`,
            [user.user_id, event_id]
        );

        // ✅ Commit BEFORE email/QR
        await client.query("COMMIT");

        // 5. Send response FIRST (important)
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Registered successfully ✅",
            data: { title, date: formattedDate, category, time }
        });
        console.log("Generating QR...");
        const qrImage = await generateQRCode(user.user_id, event_id);

        console.log("Sending email...");
        await sendConfirmationEmail(
            user.username,
            user.email,
            title,
            formattedDate,
            time,
            qrImage
        );
        console.log("Email sent successfully ✅");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Registration Error:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to register for event"
        });
    } finally {
        client.release();
    }
};


const UnRegisterForEvent = async (req, res) => {
    const { event_id } = req.params;
    const user = req.user;

    if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "You must be logged in to cancel registration"
        });
    }
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const eventResult = await client.query(
            `SELECT title FROM "event_event" WHERE event_id = $1`,
            [event_id]
        );

        if (eventResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found"
            });
        }

        const { title } = eventResult.rows[0];

        const checkResult = await client.query(
            `SELECT 1 FROM "event_eventuser" 
             WHERE user_id_id = $1 AND event_id_id = $2`,
            [user.user_id, event_id]
        );

        if (checkResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "You are not registered for this event"
            });
        }

        await client.query(
            `DELETE FROM "event_eventuser" 
             WHERE user_id_id = $1 AND event_id_id = $2`,
            [user.user_id, event_id]
        );

        await client.query("COMMIT");

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Registration cancelled for ${title} ✅`
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Cancel Registration Error:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to cancel registration"
        });
    } finally {
        client.release();
    }
};




const upcomingEventsApp = async (req, res) => {
    try {
        const query = `
            SELECT event_id, title, date, category, time
            FROM "event_event"
            WHERE date >= CURRENT_DATE
            ORDER BY date ASC
        `;
        const result = await pool.query(query);
        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                data: [],
                message: "No upcoming events found for Mobile App"
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("Upcoming Events for App Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get upcoming events for Mobile App"
        });
    }
}
        


const verifyQr = async (req, res) => {
    const { qrData } = req.body;

    if (!qrData) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "QR data is required"
        });
    }

    try {
        const decoded = jwt.verify(qrData,jwtSecret);
        const { userId, eventId } = decoded;

        const checkQuery = `
      SELECT * FROM "event_eventuser"
      WHERE user_id_id = $1 AND event_id_id = $2
    `;
        const result = await pool.query(checkQuery, [userId, eventId]);

        if (result.rows.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid QR code or user not registered for this event"
            });
        }

        const isChecked = result.rows[0].is_checked;
        if (isChecked) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "User already checked in for this event"
            });
        }

        const updateQuery = `
      UPDATE "event_eventuser"
      SET is_checked = true
      WHERE user_id_id = $1 AND event_id_id = $2
    `;
        await pool.query(updateQuery, [userId, eventId]);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "QR code verified successfully ✅ user checked in"
        });

    } catch (error) {
        console.error("QR Verification Error:", error);

        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid or expired QR code"
            });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to verify QR code",
            error: error.message
        });
    }
};





module.exports = {
    upcomingEvents,
    pastEvents,
    getEventsByDate,
    registerForEvent,
    UnRegisterForEvent,
    getSingleEvent,
    getTotalEvents,
    getTotalAttendees,
    upcomingEventsApp,
    verifyQr
}