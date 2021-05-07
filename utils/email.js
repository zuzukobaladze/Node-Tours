const nodemailer = require('nodemailer');

const sendEmail = async options => {

    const transport = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "b29442ff4eb5b3",
          pass: "d0c83d101f8bc4"
        }
    });

    const mailOptions = {
        from: 'Admin <admin@email.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    await transport.sendMail(mailOptions);
}

module.exports = sendEmail