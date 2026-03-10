const qr = require("qrcode")

const generateQRCode = async (id, event_id )=> {
   try {
    const qrData  = JSON.stringify({id : id, event_id : event_id})
    const qrImage = await qr.toBuffer(qrData, {
        errorCorrectionLevel :"H",
        margin :1,
        scale :12,
    })
    return qrImage
   }catch(error){
    console.log("Error : Failed to generate QR Code" , error)
   }
    
}

module.exports = generateQRCode 