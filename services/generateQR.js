const qr = require("qrcode");
const jwt = require("jsonwebtoken");

const generateQRCode = async (userId, eventId) => {
  try {
    const payload = { userId, eventId };
    const qrData = jwt.sign(payload, process.env.QR_SECRET, { expiresIn: "1d" });

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