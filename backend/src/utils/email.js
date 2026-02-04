const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(_ignoredUserEmail, otp) {
  await transporter.sendMail({
    from: `"Hospital Auth" <${process.env.SMTP_USER}>`,
    to: "rithanyaka@gmail.com", 
    subject: "Login OTP",
    text: `Your OTP is ${otp}. Valid for 2 minutes.`,
  });

  console.log("📧 OTP sent to rithanyaka@gmail.com");
}

module.exports = { sendOTPEmail };
