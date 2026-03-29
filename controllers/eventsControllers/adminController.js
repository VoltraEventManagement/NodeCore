const { StatusCodes } = require("http-status-codes")
const pool = require("../../DB/connectPostgresql")
const cloudinary = require("../../DB/cloudinary")
const ExcelJS = require("exceljs")


const createEvent = async (req, res) => {
    const {
        title,
        date,
        city,
        description,
        type,
        target_audience,
        category,
        venue,
        is_finished,
        paid,
        event_speakers,
    } = req.body;

    try {
        let speakerIds = [];
        let speakers = event_speakers;

        if (typeof speakers === "string") {
            speakers = JSON.parse(speakers);
        }
        if (speakers && Array.isArray(speakers)) {
            const insertSpeakerQuery = `
        INSERT INTO "event_speaker" (name, position, linked_profile)
        VALUES ($1, $2, $3)
        RETURNING speaker_id
    `;
            const speakerPromises = speakers.map(async (speaker) => {
                const { name, position, linked_profile } = speaker;
                const result = await pool.query(insertSpeakerQuery, [
                    name,
                    position || null,
                    linked_profile || null,
                ]);
                return result.rows[0].speaker_id;
            });
            speakerIds = await Promise.all(speakerPromises);
        }

        const insertEventQuery = `
      INSERT INTO "event_event"
      (title, date, city, description, type, target_audience, category, venue, is_finished, paid)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;

        const eventResult = await pool.query(insertEventQuery, [
            title,
            date,
            city,
            description,
            type,
            target_audience,
            category,
            venue,
            is_finished,
            paid
        ]);

        const event_id = eventResult.rows[0].event_id;

        if (speakerIds.length > 0) {

            const insertJunctionQuery = `
        INSERT INTO "event_event_event_speakers" (event_id, speaker_id)
        VALUES ($1, $2)
      `;

            const junctionPromises = speakerIds.map((speakerId) =>
                pool.query(insertJunctionQuery, [event_id, speakerId])
            );

            await Promise.all(junctionPromises);
        }
        let photos = []

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result = await cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
                    {
                        folder: "events"
                    }
                )

                await pool.query(
                    `INSERT INTO event_photo (event_id_id, photo) VALUES ($1,$2)`,
                    [event_id, result.secure_url]
                )

                photos.push(result.secure_url)
            }
        }
        const speakersResult = await pool.query(`
    SELECT s.speaker_id, s.name, s.position, s.linked_profile
    FROM "event_speaker" s
    JOIN "event_event_event_speakers" j
    ON s.speaker_id = j.speaker_id
    WHERE j.event_id = $1
`, [event_id])
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: `${title} event created successfully`,
            event: {
                ...eventResult.rows[0],
                speakers: speakersResult.rows,
                photos: photos,
            },
        });

    } catch (error) {
        console.error("Create Event Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create event",
            error: error.message,
        });
    }
};


const updateEvent = async (req, res) => {
    const { event_id } = req.params;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const existingEvent = await client.query(
            `SELECT * FROM "event_event" WHERE event_id = $1`,
            [event_id]
        );

        if (!existingEvent.rows.length) {
            await client.query("ROLLBACK");
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: `Event with ID ${event_id} not found`
            });
        }

        const { date } = req.body;

        if (date) {
            const dateConflict = await client.query(
                `SELECT * FROM "event_event" WHERE date = $1 AND event_id != $2`,
                [date, event_id]
            );

            if (dateConflict.rows.length > 0) {
                await client.query("ROLLBACK");
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `This date ${date} is already reserved by another event`
                });
            }
        }

        const allowedFields = [
            "title",
            "date",
            "city",
            "description",
            "type",
            "target_audience",
            "category",
            "venue",
            "is_finished",
            "paid"
        ];

        const fields = [];
        const values = [];
        let idx = 1;

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                fields.push(`"${field}" = $${idx++}`);
                values.push(req.body[field]);
            }
        });

        let eventResult = existingEvent;

        if (fields.length > 0) {
            values.push(event_id);
            const updateQuery = `
                UPDATE "event_event"
                SET ${fields.join(", ")}
                WHERE event_id = $${idx}
                RETURNING *
            `;
            eventResult = await client.query(updateQuery, values);
        }

        const speakersResult = await client.query(`
            SELECT s.speaker_id, s.name, s.position, s.linked_profile
            FROM "event_speaker" s
            JOIN "event_event_event_speakers" j
            ON s.speaker_id = j.speaker_id
            WHERE j.event_id = $1
        `, [event_id]);

      let photos = []

if (req.files && req.files.length > 0) {

    for (const file of req.files) {

        const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            {
                folder: "events"
            }
        )

        await client.query(
            `INSERT INTO event_photo (event_id_id, photo) VALUES ($1,$2)`,
            [event_id, result.secure_url]
        )

        photos.push(result.secure_url)
    }
}

const photosResult = await client.query(
    `SELECT photo FROM event_photo WHERE event_id_id = $1`,
    [event_id]
)

photos = photosResult.rows.map(p => p.photo)

        await client.query("COMMIT");

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `${eventResult.rows[0].title} event updated successfully`,
            event: {
                ...eventResult.rows[0],
                event_speakers: speakersResult.rows,
                photos: photos
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred while updating the event",
            error: error.message
        });
    } finally {
        client.release();
    }
};




const deleteEvent = async (req, res) => {
    const { event_id } = req.params
    const client = await pool.connect()

    try {
        await client.query("BEGIN")
        const event = await client.query(
            `SELECT * FROM "event_event" WHERE event_id=$1`,
            [event_id]
        )

        if (!event.rows.length) {
            await client.query("ROLLBACK")
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found"
            })
        }
        const photosResult = await client.query(
            `SELECT photo FROM "event_photo" WHERE event_id_id=$1`,
            [event_id]
        )

        for (let row of photosResult.rows) {
            const urlParts = row.photo.split("/")
            const fileName = urlParts[urlParts.length - 1].split(".")[0]  // get file name without extension
            const publicId = `events/${fileName}`  // match folder in Cloudinary

            await cloudinary.uploader.destroy(publicId)
        }

await client.query(`DELETE FROM "event_photo" WHERE event_id_id=$1`, [event_id])

await client.query(`DELETE FROM "event_event_event_speakers" WHERE event_id=$1`, [event_id])

await client.query(`DELETE FROM "event_eventuser" WHERE event_id_id=$1`, [event_id])

await client.query(`DELETE FROM "event_event" WHERE event_id=$1`, [event_id])

        await client.query("COMMIT")

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Event deleted successfully"
        })

    } catch (error) {
        await client.query("ROLLBACK")
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete event",
            error: error.message
        })
    } finally {
        client.release()
    }
}






const downloadMonthlyReportExcel = async (req, res) => {
    try {
        const { month } = req.params

        if (!month) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Month is required in format YYYY-MM"
            })
        }

        // Total Events
        const totalEventsQuery = `
            SELECT COUNT(*) AS total_events
            FROM "event_event"
            WHERE TO_CHAR(date, 'YYYY-MM') = $1
        `

        // Total Attendees
        const totalAttendeesQuery = `
            SELECT COUNT(*) AS total_attendees
            FROM "event_eventuser" ue
            JOIN "event_event" e ON e.event_id = ue.event_id_id
            WHERE TO_CHAR(e.date, 'YYYY-MM') = $1
        `

        // Successful Check-ins
        const successQuery = `
            SELECT COUNT(*) AS success_count
            FROM "event_eventuser" ue
            JOIN "event_event" e ON e.event_id = ue.event_id_id
            WHERE TO_CHAR(e.date, 'YYYY-MM') = $1
            AND ue.is_checked = true
        `

        // Event Details + Users
        const detailsQuery = `
            SELECT 
                e.event_id,
                e.title,
                e.date,
                e.city,
                e.type,
                e.category,
                u.id AS user_id,
                u.username AS user_name,
                u.email,
                ue.is_checked
            FROM "event_event" e
            LEFT JOIN "event_eventuser" ue ON ue.event_id_id = e.event_id
            LEFT JOIN "user_user" u ON u.id = ue.user_id_id
            WHERE TO_CHAR(e.date, 'YYYY-MM') = $1
            ORDER BY e.date ASC
        `

        const totalEventsResult = await pool.query(totalEventsQuery, [month])
        const totalAttendeesResult = await pool.query(totalAttendeesQuery, [month])
        const successResult = await pool.query(successQuery, [month])

        const totalEvents = parseInt(totalEventsResult.rows[0].total_events)
        const totalAttendees = parseInt(totalAttendeesResult.rows[0].total_attendees)
        const successCount = parseInt(successResult.rows[0].success_count)

        const { rows } = await pool.query(detailsQuery, [month])

        const successRate = totalAttendees > 0
            ? ((successCount / totalAttendees) * 100).toFixed(2)
            : 0

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet("Monthly Report")

        // Summary
        sheet.addRow(["MONTHLY SUMMARY"])
        sheet.getRow(1).font = { size: 14, bold: true }

        sheet.addRow([])
        sheet.addRow(["Total Events", totalEvents])
        sheet.addRow(["Total Attendees", totalAttendees])
        sheet.addRow(["Success Rate (%)", successRate])

        sheet.addRow([])
        sheet.addRow([])

        // Table Header
        const headerRow = sheet.addRow([
            "Event ID",
            "Title",
            "Date",
            "City",
            "Type",
            "Category",
            "User ID",
            "User Name",
            "Email",
            "Checked In"
        ])

        headerRow.font = { bold: true }

        // Insert Data
        rows.forEach(row => {
            sheet.addRow([
                row.event_id,
                row.title,
                row.date,
                row.city,
                row.type,
                row.category,
                row.user_id,
                row.user_name,
                row.email,
                row.is_checked ? "Yes" : "No"
            ])
        })

        // Column Width
        sheet.columns.forEach(column => {
            column.width = 18
        })

        // Response Headers
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=monthly_report_${month}.xlsx`
        )

        await workbook.xlsx.write(res)
        res.end()

    } catch (error) {
        console.error("Excel Report Error:", error)

        res.status(500).json({
            success: false,
            message: "Failed to generate Excel report",
            error: error.message
        })
    }
}


























const adminUpdateUser = async (req, res) => {
  const admin = req.user; // from auth middleware
  const { id } = req.params;
  const { username, email, track, user_status } = req.body;

  try {
    // 1️⃣ Check if admin
    if (!admin || admin.role !== "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    // 2️⃣ Check if user exists
    const userCheck = await pool.query(
      `SELECT * FROM "user_user" WHERE id = $1`,
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    // 3️⃣ Build dynamic update query
    const fields = [];
    const values = [];
    let index = 1;

    if (username) {
      fields.push(`username = $${index++}`);
      values.push(username);
    }

    if (email) {
      fields.push(`email = $${index++}`);
      values.push(email);
    }

    if (track) {
      fields.push(`track = $${index++}`);
      values.push(track);
    }

    if (user_status) {
      fields.push(`user_status = $${index++}`);
      values.push(user_status);
    }

    if (fields.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No data provided to update"
      });
    }

    // Add user_id as last param
    values.push(id);

    const updateQuery = `
      UPDATE "user_user"
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, username, email, track, user_status
    `;

    const updatedUser = await pool.query(updateQuery, values);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User updated successfully ✅",
      data: updatedUser.rows[0]
    });

  } catch (error) {
    console.error("Admin Update User Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
};












module.exports = {
    createEvent,
    updateEvent,
    deleteEvent,
    downloadMonthlyReportExcel, 
    adminUpdateUser
}