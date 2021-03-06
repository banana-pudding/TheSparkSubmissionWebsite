/** @format */

const Email = require("email-templates");
const { template, reject } = require("lodash");
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
    views: {
        options: {
            extension: "ejs", // <---- HERE
        },
    },
    // <https://github.com/Automattic/juice>
    juice: true,
    // Override juice global settings <https://github.com/Automattic/juice#juicecodeblocks>
    juiceSettings: {
        tableElements: ["TABLE"],
    },
    juiceResources: {
        preserveImportant: true,
        webResources: {
            //
            // this is the relative directory to your CSS/image assets
            // and its default path is `build/`:
            //
            // e.g. if you have the following in the `<head`> of your template:
            // `<link rel="stylesheet" href="style.css" data-inline="data-inline">`
            // then this assumes that the file `build/style.css` exists
            //
            relativeTo: path.join(__dirname, "emails", "assets"),
            //
            // but you might want to change it to something like:
            // relativeTo: path.join(__dirname, '..', 'assets')
            // (so that you can re-use CSS/images that are used in your web-app)
            //
        },
    },
});

module.exports = {
    newSubmission: function (submission) {
        var recipient = submission.patron.email;
        var files = submission.files;
        var fileNames = files.map(function (file) {
            return file.originalFileName;
        });
        email
            .send({
                template: path.join(__dirname, "emails", "newSubmission"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    fileNames: fileNames,
                },
            })
            .then(console.log("sent new submission email to", recipient))
            .catch(console.error);
    },
    allApproved: function (submission, amount, url) {
        var recipient = submission.patron.email;
        var files = submission.files;
        var inputData = files.map(function (file) {
            return {
                fileName: file.originalFileName,
                grams: file.review.slicedGrams,
                timeHours: file.review.slicedHours,
                timeMinutes: file.review.slicedMinutes,
                notes: file.review.patronNotes,
            };
        });
        email
            .send({
                template: path.join(__dirname, "emails", "allApproved"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    allFiles: inputData,
                    amount: amount,
                    url: url,
                },
            })
            .then(console.log("sent all approved email to", recipient))
            .catch(console.error);
    },
    someApproved: function (submission, amount, url) {
        var recipient = submission.patron.email;
        var files = submission.files;

        var acceptedFiles = files.reduce(function (result, file) {
            if (file.review.descision == "Accepted") {
                result.push({
                    fileName: file.originalFileName,
                    grams: file.review.slicedGrams,
                    timeHours: file.review.slicedHours,
                    timeMinutes: file.review.slicedMinutes,
                    notes: file.review.patronNotes,
                });
            }
            return result;
        }, []);

        var rejectedFiles = files.reduce(function (result, file) {
            if (file.review.descision == "Rejected") {
                result.push({
                    fileName: file.originalFileName,
                    notes: file.review.patronNotes,
                });
            }
            return result;
        }, []);

        console.log(acceptedFiles);
        console.log(rejectedFiles);

        email
            .send({
                template: path.join(__dirname, "emails", "someApproved"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    acceptedFiles: acceptedFiles,
                    rejectedFiles: rejectedFiles,
                    amount: amount,
                    url: url,
                },
            })
            .then(console.log("sent some approved email to", recipient))
            .catch(console.error);
    },
    allRejected: function (submission) {
        var recipient = submission.patron.email;
        var files = submission.files;

        var inputData = files.map(function (file) {
            return {
                fileName: file.originalFileName,
                notes: file.review.patronNotes,
            };
        });

        email
            .send({
                template: path.join(__dirname, "emails", "allRejected"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    allFiles: inputData,
                },
            })
            .then(console.log("sent all rejected email to", recipient))
            .catch(console.error);
    },
    modificationRequired: function (submission) {},
    paymentThankYou: function (submission) {},
    paymentWaived: function (submission) {
        var recipient = submission.patron.email;
        var files = submission.files;
        var fileNames = files.map(function (file) {
            return file.originalFileName;
        });

        email
            .send({
                template: path.join(__dirname, "emails", "paymentWaived"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    fileNames: fileNames,
                },
            })
            .then(console.log("sent payment waived email to", recipient))
            .catch(console.error);
    },
    inTransit: function (submission, readyFile) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "inTransit"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    readyFile: readyFile,
                },
            })
            .catch(console.error);
    },
    readyForPickup: function (submission, readyFile) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "fileReady"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    readyFile: readyFile,
                },
            })
            .catch(console.error);
    },
    allFinishedPrinting: function (submission, inTransit, atLocation) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "pickupSubmission"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    inTransit: inTransit,
                    atLocation: atLocation,
                },
            })
            .catch(console.error);
    },
    oneArrived: function (submission, arrived) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "fileArrived"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    //inTransit: inTransit,
                    atLocation: atLocation,
                },
            })
            .catch(console.error);
    },
    filesPickedUp: function (submission, fileIDs) {},
    //one week late
    stillWaiting: function (submission, one) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "firstWarning"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    allFiles: one,
                },
            })
            .catch(console.error);
    },
    //two weeks late
    finalWarning: function (submission, two) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "finalWarning"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    allFiles: two,
                },
            })
            .catch(console.error);
    },
    //three weeks late
    repoPrint: function (submission) {},
};
