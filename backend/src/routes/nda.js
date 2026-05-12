const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/request', async (req, res) => {
  try {
    const { fullName, organization, role, email, country, intendedUse } = req.body;

    if (!fullName || !organization || !email) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"UCH NDA Request" <${process.env.SMTP_USER}>`,
      to: "ayman@teosegypt.com",
      subject: "New NDA Request — Unity Care Hospital",
      html: `
        <h2>New NDA Request</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Intended Use:</strong> ${intendedUse}</p>
      `
    });

    res.status(200).json({ message: "NDA request submitted successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
