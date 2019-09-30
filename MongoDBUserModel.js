const mongoose = require("mongoose")
const validator = require("validator")

const { Schema } = mongoose

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        maxlength: 100,
    },
    secret: String,
})

const User = mongoose.model("User", UserSchema)

const UserModel = {}

// Adds a user with email and password, and passes success/failure to callback.
UserModel.addUser = function(email, password, callback) {
    if (!email || !validator.isEmail(email)) {
        callback(false, "Email is ill-formed")
    } else {
        User.findOne({ email }, function(err, result) {
            if (result) {
                callback(false, "Email already exists")
            } else {
                const user = new User({ email, password })
                user.save(function(err) {
                    if (!err) {
                        callback(true)
                    } else {
                        callback(false, "Could not save the user")
                    }
                })
            }
        })
    }
}

// Finds a user by email, and passes success/failure as well as the hash to callback.
UserModel.findUser = function(email, callback) {
    if (!email || !validator.isEmail(email)) {
        callback(false, "Email is ill-formed")
    } else {
        User.findOne({ email }, function(err, result) {
            if (err) {
                callback(false, "Could not find the user")
            } else {
                callback(true, null, result)
            }
        })
    }
}

UserModel.updateSecret = function(email, secret, callback) {
    User.findOne({ email }, function(err, result) {
        if (err) {
            callback(false, "Could not find the user")
        } else {
            User.updateOne(
                { email },
                { $set: { secret } },
                { upsert: true }, // add document with req.body._id if not exists
                function(err, doc) {
                    if (err) {
                        callback(false, "Could not update the user's secret")
                    } else {
                        callback(true)
                    }
                },
            )
        }
    })
}

module.exports = UserModel
