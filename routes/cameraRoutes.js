const constants = require('../config/constants');


module.exports = function (app, bookingModel, cameraHandler) {
    // =====================================
    // CAMERAS ========================
    // =====================================
    // show the bookings and such

    //page to display the calendar 
    app.get('/cameras', function (req, res) {
        var admin = false, superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render('pages/bookings/cameras', {
            pgnum: 6, //cameras
            isAdmin: admin,
            isSuperAdmin: superAdmin
        });
    });

    app.get('/book', function (req, res) {
        var admin = false, superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render('pages/bookings/book', {
            message: req.flash('submitMessage'),
            pgnum: 6, //camera
            isAdmin: admin,
            isSuperAdmin: superAdmin
        });
    });

    app.get('/bookings/new', isLoggedIn, function (req, res) {
        bookingModel.find({
            "isAccepted": false,
            "isRejected": false
        }, function (err, result) {
            res.render('pages/bookings/bookrequests', {
                pgnum: 7, //bookings
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin,
                bookings: result,
                camPage: "newSub"
            });
        });
    });

    app.get('/bookings/accepted', isLoggedIn, function (req, res) {
        bookingModel.find({
            "isAccepted": true,
            "isRejected": false
        }, function (err, result) {
            res.render('pages/bookings/bookrequests', {
                pgnum: 7, //bookings
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin,
                bookings: result,
                camPage: "accepted"
            });
        });
    });

    app.get('/bookings/rejected', isLoggedIn, function (req, res) {
        bookingModel.find({
            "isAccepted": false,
            "isRejected": true
        }, function (err, result) {
            res.render('pages/bookings/bookrequests', {
                pgnum: 7, //bookings
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin,
                bookings: result,
                camPage: "rejected"
            });
        });
    });

    app.get('/bookings/getBookingDetails', isLoggedIn, function(req, res) {
        var title = req.query.title || req.body.title;
        var start = req.query.start || req.body.start;
        var end = req.query.end || req.body.end;
        var startDate = new Date(start);
        var endDate = new Date(end);
        endDate.setDate(endDate.getDate() - 1)
        start = startDate.toISOString().substring(0, 10);
        end = endDate.toISOString().substring(0, 10);
        bookingModel.findOne({
            "calendarEvent.title": title,
            "calendarEvent.start": start,
            "calendarEvent.end": end
        }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                if (req.isAuthenticated()) {
                    res.render('partials/cameras/detailsModal', {
                        booking: result
                    });
                }
            }
        });
    });

    app.get('/bookings/barcodes', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        console.log('here')
        bookingModel.findOne({
            "_id": submissionID
        }, function (err, result) {
            var data = {
                camera: constants.barcodes.cameras[result.camera],
                lens1: constants.barcodes.lenses[result.lens1],
                lens2: constants.barcodes.lenses[result.lens2],
            }
            res.render('partials/cameras/barcodeList.ejs', {
                data: data
            });
        });
    });




    app.post('/bookings/availableon', function (req, res) {
        var startDate = req.body.startDate || req.query.startDate;
        var endDate = req.body.endDate || req.query.endDate;
        cameraHandler.findAvailableItems(startDate, endDate, function(data) {
            res.send(data)
        });
    });


    //returns all the calendar events of acceted camera booking requests to the browser to display
    app.post('/bookings', function(req, res) {
        var calendarEvents = [];
        var currentEvent, tempDate;
        bookingModel.find({
            "isAccepted": true
        }, function(err, result) {
            if (err) {
                console.log(err)
            } else {
                result.forEach(request => {
                    currentEvent = request.calendarEvent;
                    tempDate = new Date(currentEvent.end);
                    tempDate.setDate(tempDate.getDate() + 1);
                    currentEvent.end = tempDate.toISOString().substring(0, 10)
                    calendarEvents.push(request.calendarEvent);
                });
                res.json(calendarEvents);
            }
        });
    });

    app.post('/bookings/submitbooking', function (req, res) {
        cameraHandler.submitBooking(req);
        res.redirect('back');
    });

    app.post('/bookings/manualbooking', isLoggedIn, function (req, res) {
        cameraHandler.submitBooking(req)
        res.redirect('back');
    });

    app.post('/bookings/confirmbooking', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        cameraHandler.confirmBooking(submissionID);
        res.json('done');
    });

    app.post('/bookings/deletebooking', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        cameraHandler.deleteBooking(submissionID);
        res.json('done');
    })

}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    req.flash('loginMessage', 'Please log in');
    res.redirect('/login');
}