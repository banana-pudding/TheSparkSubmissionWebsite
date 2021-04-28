var numPerPage = 10;
var printRequestModel = require("../app/models/newPrintRequest");

module.exports = function (app) {
    app.get("/prints/new", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $lt: [
                                        "$$item.timestampPaymentRequested",
                                        new Date("1980"),
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR now
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //prints
                    dbdata: data,
                    printPage: "newSub",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });
    app.get("/prints/pendpay", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $or: [
                                                {
                                                    $eq: [
                                                        "$$item.isPendingPayment",
                                                        true,
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        "$$item.isPendingWaive",
                                                        true,
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            $ne: [
                                                "$$item.isStaleOnPayment",
                                                true,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //prints
                    dbdata: data,
                    printPage: "pendpay",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show pending payment prints
    app.get("/prints/pendpaystale", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isStaleOnPayment", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //prints
                    dbdata: data,
                    printPage: "pendpaystale",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-------------READY TO PRINT------------------------

    //show pready to print all locations
    app.get("/prints/ready", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
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
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "ready",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show ready to print at willis
    app.get("/prints/readywillis", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isReadyToPrint",
                                                true,
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.printLocation",
                                                "Willis Library",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "ready",
                    location: "Willis Library",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show ready to print at dp
    app.get("/prints/readydp", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isReadyToPrint",
                                                true,
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.printLocation",
                                                "Discovery Park",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "ready",
                    location: "Discovery Park",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/printing", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: { $eq: ["$$item.isPrinting", true] },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "printing",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/printingwillis", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isPrintingWillis", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "printing",
                    location: "Willis Library",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/printingdp", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isPrintingDP", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "printing",
                    location: "Discovery Park",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/intransit", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isInTransit", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "inTransit",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/pickup", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isWaitingForPickup", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "pickup",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/pickupwillis", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isWaitingForPickup",
                                                true,
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.pickupLocation",
                                                "Willis Library",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "pickup",
                    location: "Willis Library",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/pickupdp", isLoggedIn, function (req, res) {
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isWaitingForPickup",
                                                true,
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.pickupLocation",
                                                "Discovery Park",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "pickup",
                    location: "Discovery Park",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/completed", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isPickedUp", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
                { $sort: { timestampSubmitted: -1 } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "completed",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-----------------------REJECTED-----------------------
    app.get("/prints/rejected", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isRejected", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
                { $sort: { timestampSubmitted: -1 } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/printList/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "rejected",
                    location: "willis",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-----------------------ALL-----------------------
    app.get("/prints/all", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages

        printRequestModel.find({}, function (err, data) {
            //loading every single top level request FOR NOW
            res.render("pages/printList/allPrints", {
                pgnum: 4, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "all",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin,
            });
        });
    });

    app.get("/prints/allp", isLoggedIn, async function (req, res) {
        //load the submission page and flash any messages
        var page = req.query.page;
        var skip = (page - 1) * numPerPage;
        var submissions = await printRequestModel
            .find({})
            .skip(skip)
            .limit(numPerPage);

        res.render("pages/printList/allPrints", {
            pgnum: 4, //tells the navbar what page to highlight
            dbdata: submissions,
            printPage: "all",
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
        });
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
