const qr = require("qrcode");
const jwt = require("jsonwebtoken");

const jwtSecret ="4Ff8$9gH!2kLm#7pQwXzRt5vB!8yYn3b"
const generateQRCode = async (userId, eventId) => {
  try {
    const payload = { userId, eventId };
    const qrData = jwt.sign(payload, jwtSecret, { expiresIn: "1d" });

    // 2️⃣ Generate QR image from the signed token
    const qrImage = await qr.toBuffer(qrData, {
      errorCorrectionLevel: "H",
      margin: 1,
      scale: 12,
    });

    return qrImage;

  } catch (error) {
    console.error("Error: Failed to generate QR Code", error);
    throw error;
  }
};

module.exports = generateQRCode;