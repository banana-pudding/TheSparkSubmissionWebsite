const formidable = require('formidable');
const moment = require('moment');
const constants = require('../config/constants');
var payment = require('../config/payment.js');
var emailer = require('../config/email.js');
var fs = require('fs');
var path = require('path');
var printRequestModel = require('../app/models/printRequest');

module.exports = {
    //function receives the input from filled out request form and saves to the database
    addPrint: function (fields, prints) {

        var request = new printRequestModel(); //new instance of a request
        //fill the patron details
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        }

        request.dateSubmitted = prints[7]; //always the date submitted
        request.numFiles = prints[8]; //always the number of files

        //set intitial parameters of the printRequest schema
        request.allFilesReviewed = false;
        request.hasStaleOnPayment = false;
        request.hasStaleOnPickup = false;
        request.isPendingDelete = false;

        //loop through the arrays of file details possibly more than one file
        for (let i = 0; i < prints[0].length; i++) {
            request.files.push({
                fileName: prints[0][i],
                material: prints[1][i],
                infill: prints[2][i],
                color: prints[3][i],
                copies: prints[4][i],
                notes: prints[6][i],
                printLocation: prints[5][i],
                pickupLocation: prints[5][i],
                isNewSubmission: true,
                isReviewed: false,
                isRejected: false,
                isPendingPayment: false,
                isPendingWaive: false,
                isPaid: false,
                isReadyToPrint: false,
                isPrinted: false,
                isPickedUp: false,
                dateSubmitted: prints[7], //always holds the date submitted
                dateReviewed: "Never",
                datePaid: "Never",
                datePrinted: "Never",
                datePickedUp: "Never",
                isPendingDelete: false,
                canBeReviewed: true
            });
        }

        //save the top level submission and low level files to the database

        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            }
        });

    },




    //handles the data for a new top level print request with possibly multiple low level file submissions
    handleSubmission: function (req) {
        const form = formidable({
            maxFileSize: 1024 * 1024 * 1024
        });
        //arrays of each files specifications (will only hold one entry each if patron submits only one file)
        var filenames = [],
            materials = [],
            infills = [],
            colors = [],
            copies = [],
            notes = [],
            pickups = [],
            prints = [],
            patron = [],
            numFiles = 0,
            time = moment(),
            unique = 1;
        //get the incoming form data
        form.parse(req, function (err, fields, files) {
            patron = fields; //put the fields data into the patron container to send to the database function
            // add all our lists to one list to pass to the submission handler
            prints.push(filenames);
            prints.push(materials);
            prints.push(infills);
            prints.push(colors);
            prints.push(copies);
            prints.push(pickups);
            prints.push(notes);
            prints.push(time.format(constants.format));
            prints.push(numFiles);
            module.exports.addPrint(patron, prints);
        });
        form.on('field', function (name, field) { //when a new field comes through
            //handling duplicate input names cause for some reason formidable doesnt do it yet...
            //makes arrays of all the duplicate form names
            if (name == 'material') {
                materials.push(field);
            } else if (name == 'infill') {
                infills.push(field);
            } else if (name == 'color') {
                colors.push(field);
            } else if (name == 'copies') {
                copies.push(field);
            } else if (name == 'pickup') {
                pickups.push(field);
            } else if (name == 'notes') {
                notes.push(field);
            }
        });
        form.on('fileBegin', (name, file) => { //when a new file comes through
            file.name = file.name.split(" ").join(""); //remove spaces from file names
            file.name = time.unix() + unique + constants.delim + file.name; //add special separater so we can get just the filename later
            //yes this is a dumb way to keep track of the original filename but I dont care
            unique += 1; //increment unique so every file is not the same name
            file.path = path.join(__dirname, '../app/uploads/', file.name);
        });
        form.on('file', (name, file) => { //when a file finishes coming through
            filenames.push(file.path); //add this files path to the list of filenames
            numFiles++; //increment the number of files this top level submission is holding
        });
    },




    //this function handles when a technician is reviewing a print file within a top level submission
    updateSingle: function (req, callback) {
        const form = formidable({
            maxFileSize: 1024 * 1024 * 1024
        });
        var gcode;
        var time = moment();
        var shouldUpload = true;
        //get the incoming form data
        form.parse(req, function (err, fields, files) {
            printRequestModel.findOne({
                'files._id': fields.fileID
            }, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (result.files.id(fields.fileID).gcodeName != null) {
                        //delete gcode from disk if it exists
                        console.log("Submission had old GCODE file! deleting...");
                        fs.unlink(result.files.id(fields.fileID).gcodeName, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                }
            });
            //update the low level print according to the form data
            if (fields.decision == 'accepted') { //if the technician accepted the print, update accordingly
                printRequestModel.findOneAndUpdate({
                    'files._id': fields.fileID
                }, {
                    "$set": {
                        "files.$.gcodeName": gcode,
                        "files.$.slicedPrinter": fields.printer,
                        "files.$.slicedMaterial": fields.material,
                        "files.$.timeHours": fields.hours,
                        "files.$.timeMinutes": fields.minutes,
                        "files.$.grams": fields.grams,
                        "files.$.patronNotes": fields.patronNotes,
                        "files.$.techNotes": fields.technotes,
                        "files.$.printLocation": fields.printLocation,
                        "files.$.isReviewed": true,
                        "files.$.isRejected": false,
                        "files.$.dateReviewed": time.format(constants.format),
                    }
                }, {
                    new: true
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                });
            } else { //the tecnicican rejected the print, so update differently
                printRequestModel.findOneAndUpdate({
                    'files._id': fields.fileID
                }, {
                    "$set": {
                        "files.$.isReviewed": true,
                        "files.$.isRejected": true,
                        "files.$.isPendingPayment": false,
                        "files.$.dateReviewed": time.format(constants.format),
                        "files.$.patronNotes": fields.patronNotes,
                    }
                }, {
                    new: true
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                });
            }

            //now find the fully updated top level submission so we can check if all the files have been reviewed
            module.exports.setFlags(fields.fileID);

            if (typeof callback == 'function') {
                callback(); //running the callback specified in calling function (in routes.js)
            }

        });
        form.on('field', (name, field) => { //if we should be looking for a file uploaded for GCODE
            if (name == "decision") {
                if (field == "accepted") {
                    shouldUpload = true;
                } else {
                    shouldUpload = false;
                }
            }
        });
        form.on('fileBegin', (name, file) => { //handle uploading a file if needed
            if (shouldUpload) {
                file.name = time.unix() + constants.delim + file.name; //add special separater so we can get just the filename later
                file.path = path.join(__dirname, '../app/uploads/gcode/', file.name);
            } else {}
        });
        form.on('file', (name, file) => { //when a file finishes coming through
            if (shouldUpload) {
                gcode = file.path;
            }
        });

    },





    //------------------------Add new technician notes without a full file review------------------------
    appendNotes: function (req) {
        printRequestModel.findOne({
            'files._id': req.body.fileID
        }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                if (req.body.newNotes != '') {
                    result.files.id(req.body.fileID).techNotes += '\n';
                    result.files.id(req.body.fileID).techNotes += req.body.euid;
                    result.files.id(req.body.fileID).techNotes += ': ';
                    result.files.id(req.body.fileID).techNotes += req.body.newNotes;
                    result.save();
                }
            }
        });
    },





    //this function fires when a tech says a submission is ready to be sent to the pendpay queue
    requestPayment: function (submissionID, callback) {
        var time = moment();
        printRequestModel.findOne({
            "_id": submissionID
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {

                //found the submission in the database, now calc payment and send the link to the email

                var acceptedFiles = [],
                    rejectedFiles = [],
                    acceptedMessages = [],
                    rejectedMessages = [];

                var email = result.patron.email;

                //calculate paumet amount
                var amount = 0.0;
                for (var i = 0; i < result.files.length; i++) {

                    result.files[i].canBeReviewed = false;
                    result.files[i].isNewSubmission = false;
                    
                    if (result.files[i].isRejected == false && result.files[i].isReviewed == true) { //print is accepted
                        result.files[i].isPendingPayment = true;
                        if (result.files[i].timeHours <= 0) { //if its less than an hour, just charge one dollar
                            amount += 1;
                        } else { //charge hours plus minutes out of 60 in cents
                            amount += result.files[i].timeHours;
                            amount += (result.files[i].timeMinutes / 60);
                        }
                        acceptedFiles.push(result.files[i].fileName.substring(result.files[i].fileName.lastIndexOf(constants.delim) + 10));
                        acceptedMessages.push(result.files[i].patronNotes);
                    } else {
                        rejectedFiles.push(result.files[i].fileName.substring(result.files[i].fileName.lastIndexOf(constants.delim) + 10));
                        rejectedMessages.push(result.files[i].patronNotes);
                    }
                }
                amount = Math.round((amount + Number.EPSILON) * 100) / 100; //make it a normal 2 decimal place charge
                amount = amount.toFixed(2); //correct formatting

                //if the submission had any accepted files, we will ask for payment
                if (acceptedFiles.length > 0) {
                    result.datePaymentRequested = time.format(constants.format);

                    //calc full name of patron
                    var nameString = "";
                    nameString = nameString.concat(result.patron.fname, " ", result.patron.lname);

                    //hand it to the payment handler to generate the url for the patron
                    payment.generatePaymentURL(nameString, email, acceptedFiles, acceptedMessages, rejectedFiles, rejectedMessages, amount, result._id); //generate the URL

                } else { //dont ask for payment, just move to the rejected queue
                    //none of the prints were accepted
                    result.datePaymentRequested = time.format(constants.format); //still capture review time
                    emailer.fullyRejected(email, rejectedFiles, rejectedMessages); //send a completely rejected email
                }

                //save result to the database with updated flags
                result.save();

                if (typeof callback == 'function') {
                    callback();
                }
            }
        });

    },





    //should fire when a user pays for a submission
    //pushes print from the pendpy queue to the paid and ready queue
    recievePayment: function (submissionID, wasWaived, callback) {
        var time = moment();
        printRequestModel.findOne({
            "_id": submissionID
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < result.files.length; i++) {
                    result.files[i].isPendingPayment = false;
                    if (result.files[i].isRejected == false) {
                        result.files[i].isPaid = true;
                        result.files[i].isReadyToPrint = true;
                        result.files[i].isPendingWaive = false;
                    }
                }
                result.datePaid = time.format(constants.format);
                result.save(); //save the db entry
                if (typeof callback == 'function') {
                    callback();
                }

                if (wasWaived) {
                    emailer.paymentWaived(result.patron.email);
                } else {
                    emailer.readyToPrint(result.patron.email);
                }
            }
        });

    },

    markCompleted: function (fileID) {
        var time = moment();
        printRequestModel.findOneAndUpdate({
            'files._id': fileID
        }, {
            "$set": {
                "files.$.isPrinted": true,
                "files.$.datePrinted": time.format(constants.format),
                "files.$.isReadyToPrint": false
            }
        }, {
            new: true
        }, function (err, result) {
            if (err) {
                console.log(err);
            }
            module.exports.setFlags(fileID);
            emailer.readyForPickup(result.patron.email, result.files.id(fileID).fileName.substring( result.files.id(fileID).fileName.lastIndexOf(constants.delim) + 10));
        });
    },





    //set appropriate flags for top level submission
    setFlags: function (submissionID) {
        printRequestModel.findOne({
            'files._id': submissionID
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                var numFiles = result.numFiles;
                var numReviewed = 0;

                //count number of reviewed files and see if any are rejected
                for (var i = 0; i < result.files.length; i++) {
                    if (result.files[i].isReviewed == true) {
                        numReviewed += 1;
                    }
                }

                //if they are the same we can allow the top level submission to be processed
                if (numReviewed == numFiles) {
                    result.allFilesReviewed = true;
                }

                result.save();
            }
        });
    },





    deleteFile: function (fileID) {
        printRequestModel.findOne({ //find top level print request by single file ID
            'files._id': fileID
        }, function (err, result) {
            //delete stl from disk
            fs.unlink(result.files.id(fileID).fileName, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            if (result.files.id(fileID).isRejected == false) {
                //delete gcode from disk if it exists
                if (result.files.id(fileID).gcodeName != null) {
                    fs.unlink(result.files.id(fileID).gcodeName, function (err) {
                        if (err) {
                            console.log("gcode delete error:", err);
                        }
                    });
                }
            }
            result.files.id(fileID).remove(); //remove the single file from the top level print submission
            result.numFiles -= 1; //decrement number of files associated with this print request
            if (result.numFiles < 1) { //if no more files in this request delete the request itself
                printRequestModel.deleteOne({
                    '_id': result._id
                }, function (err) { //delete top level request
                    if (err) console.log(err);
                });
            } else { //else save the top level with one less file
                result.save(function (err) { //save top level request db entry
                    if (err) console.log(err);
                });
                module.exports.setFlags(result.files[0]._id); //now set all the flags of the updated top level submission
            }

        });
    }
}