require("dotenv").config()
const nodemailer = require("nodemailer")
const sendConfirmationEmail = async (
    username,
    email,
    title,
    date,
    qrImage
) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        })
        const mailOptions = {
            from: `"Voltra Events" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Event Registration Confirmation 🎉",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${username}, 👋</h2>
          <p>Your registration for <strong>${title}</strong> has been confirmed.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p>Please present the QR code below at the event entrance for check-in:</p>
          
          <div style="margin-top:20px;">
            <img src="cid:qrimage" alt="QR Code" />
          </div>

          <p style="margin-top:20px;">We look forward to seeing you! 🚀</p>

          <p>Best regards,<br>Voltra Team</p>
        </div>
      `,
            attachments: [
                {
                    filename: "qr-code.png",
                    content: qrImage,
                    contentType: "image/png",
                    cid: "qrimage",
                },
            ],
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("confirmation email is sent successfully ✅")

        return info

    } catch (error) {
        throw new Error("nodemailer Failed to send confirmation email ❌")
    }
}

module.exports = sendConfirmationEmail