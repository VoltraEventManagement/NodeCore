require("dotenv").config()
const express = require("express")
const app = express()
const Port = process.env.PORT || 5000
const pool = require("./DB/connectPostgresql")
const eventRouter = require("./routes/events/eventRouter")
const adminRouter = require("./routes/events/adminRouter")
const errorHandler = require("./middlewares/errorHandler")
const cors = require("cors")


app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000",
        "https://alx-voltra.vercel.app/",
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))


// routes 
app.use("/api/events", eventRouter)
app.use("/api/admin/events", adminRouter)


app.use(errorHandler)

const start = async () => {
    try {
        await pool.query("SELECT 1 ")
        console.log('✅ PostgreSQL Connected Successfully');
        app.listen(Port, () => {
            console.log(`Server is running on Port ${Port}`)
        })
    } catch (error) {
        console.log("Falied to Start Server", error)
        process.exit(1)
    }
}

start() 