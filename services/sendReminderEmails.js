require("dotenv").config()
const nodemailer = require("nodemailer")

const sendReminderEmails = async (title, date, users) => {
    try {
        const transporter = await nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
        for( const user of users){
            const { username , email } = user
            const mailOptions = {
                from: `Voltra Team ${process.env.GMAIL_USER}`,
                to: email,
                subject: `Reminder Email for ${title} event`,
                html: `
                <p>Hello <b>${username}</b>,</p>
                <p>This is a friendly reminder that you are registered for the event <b>${title}</b> on <b>${date}</b>.</p>
                <p> Dont forget your QR Code sent in confiramtion email👌 <br> We look forward to seeing you❤️!</p>
                <p>— Voltra Team</p>
                `,
            };
            await transporter.sendMail(mailOptions)
            console.log("reminder email sent successuflly ✅")
        }
        
        return {
            succuss: true,
            sent: users.length
        }
    }
     catch (error) {
        console.error(`Failed to send reminder to ${username} ❌`, error);
        return {
            succuss: false,
            error : error.message
        }
    }
}

module.exports = sendReminderEmails