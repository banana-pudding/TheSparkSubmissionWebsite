var mongoose = require("mongoose");
require("./recordData.js");

var dailyRecordSchema = mongoose.Schema({
    thisDate: { type: Date, unique: true, required: true },
    lastModified: Date,
    dataRecord: mongoose.model("recordData").schema,
});

module.exports = mongoose.model("dailyRecord", dailyRecordSchema);