var multer = require("multer");
var path = require("path");
var numPerPage = 10;
var gcodePath = path.join(__dirname, "..", "..", "Uploads", "Gcode");
var stlPath = path.join(__dirname, "..", "..", "Uploads", "STLs");
var printRequestModel = require("../app/models/newPrintRequest");
var attemptModel = require("../app/models/attempt");
var printHandler = require("../handlers/printHandler.js");
var adminRequestHandler = require("../handlers/adminRequestHandler.js");
var fullServicePrinterModel = require("../app/models/fullServicePrinter");
var selfServicePrinterModel = require("../app/models/selfServicePrinter");
var payment = require("../app/payment.js");
const archiver = require("archiver");
var fs = require("fs");

module.exports = function (app) {
    app.get("/printers/jobs", isLoggedIn, async function (req, res) {
        var allSelf = await selfServicePrinterModel
            .find({})
            .sort({ printerBarcode: 1 });
        var willisFull = await fullServicePrinterModel.aggregate([
            { $match: { printerLocation: "Willis Library" } },
            {
                $lookup: {
                    from: "attempts",
                    localField: "runningJobID",
                    foreignField: "_id",
                    as: "printJob",
                },
            },
        ]);
        var dpFull = await fullServicePrinterModel.aggregate([
            { $match: { printerLocation: "Discovery Park" } },
            {
                $lookup: {
                    from: "attempts",
                    localField: "runningJobID",
                    foreignField: "_id",
                    as: "printJob",
                },
            },
        ]);
        var readyPrints = await printRequestModel.aggregate([
            {
                $set: {
                    files: {
                        $filter: {
                            input: "$files",
                            as: "item",
                            cond: {
                                $eq: ["$$item.isReadyToPrint", true],
                            },
                        },
                    },
                },
            },
            { $match: { "files.0": { $exists: true } } },
        ]);
        res.render("pages/printjobs", {
            pgnum: 7, //printers'
            selfService: allSelf,
            willisFull: willisFull,
            dpFull: dpFull,
            readyPrints: readyPrints,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
            userID: req.user._id,
        });
    });

    app.post("/attempts/start", isLoggedIn, async function (req, res) {
        /**
         * printerID, printerName, printerLocation, rollID, startWeight, selectedFileIDs, selectedFileNames
         */
        var selectedFiles = req.body.selectedFileIDs.split(",");
        var selectedFileNames = req.body.selectedFileNames.split(",");
        var newAttempt = new attemptModel({
            timestampStarted: new Date(),
            location: req.body.printerLocation,
            printerName: req.body.printerName,
            printerID: req.body.printerID,
            rollID: req.body.rollID,
            startWeight: req.body.startWeight,
            technicianID: req.user.id,
            fileIDs: selectedFiles,
            fileNames: selectedFileNames,
        });
        await newAttempt.save();

        var thisPrinter = await fullServicePrinterModel.findOne({
            _id: req.body.printerID,
        });
        thisPrinter.runningJobID = newAttempt._id;
        await thisPrinter.save();

        for await (var thisFileID of selectedFiles) {
            var thisSubmission = await printRequestModel.findOne({
                "files._id": thisFileID,
            });
            var thisFile = thisSubmission.files.id(thisFileID);
            thisFile.isReadyToPrint = false;
            thisFile.isPrinting = true;
            thisFile.isPrintingWillis =
                req.body.printerLocation == "Willis Library" ? true : false;
            thisFile.isPrintingDP =
                req.body.printerLocation == "Discovery Park" ? true : false;
            await thisSubmission.save();
        }

        res.redirect("/printers/jobs");
    });
};
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
