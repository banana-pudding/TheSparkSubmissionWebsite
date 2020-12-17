const Email = require("email-templates");
var nodemailer = require("nodemailer");
const path = require("path");

var smtpserver = "mailhost.unt.edu";
var sender = '"SparkOrders" <no-reply.sparkorders@unt.edu>';
var portNum = 25;

var transporter = nodemailer.createTransport({
    host: smtpserver,
    port: portNum,
    secure: false,
    tls: {
        rejectUnauthorized: false,
    },
});

const email = new Email({
    message: {
        from: sender,
    },
    send: true,
    transport: transporter,
});

module.exports = {
    newSubmission: function () {
        email
            .send({
                template: path.join(__dirname, "emails", "test"),
                message: {
                    to: "hanna.flores@unt.edu",
                },
                locals: {
                    name: "Elon",
                },
            })
            .then(console.log)
            .catch(console.error);
    },
};
