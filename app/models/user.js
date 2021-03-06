var mongoose = require("mongoose");
//var bcrypt = require("bcrypt-nodejs");
const bcrypt = require("bcrypt");

// define the schema for our user model
var userSchema = mongoose.Schema({
    local: {
        euid: String,
        password: String,
    },
    email: String,
    name: String,
    isSuperAdmin: Boolean,
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model("User", userSchema);
