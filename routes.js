require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const User = require("./MongoDBUserModel")
const JWT_SECRET = process.env.JWT_SECRET
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const saltRounds = 10

const middlewares = require("./middlewares")

mongoose.connect("mongodb://localhost/hackuci", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
const db = mongoose.connection
db.on("error", function() {
    console.error("could not connect to mongodb")
    // Here we can decide whether we want to stop the server entirely.
})
db.once("open", console.log)

const app = express()

app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
)

// Parse application/json body from POST.
app.use(bodyParser.json())

// Create a user based on an email and password (already provided).
app.post("/user/createUser", function(req, res) {
    const { email, password } = req.body
    if (!password) {
        // Since we added `bcrypt`, we can't validate within `UserModel`.
        return res.status(400).send({ message: "Password is ill-formed" })
    }
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            return res.status(500).send("Internal Server Error") // Don't mention hashing
        } else {
            // Store hash in your password DB.
            User.addUser(email, hash, function(addSuccess, errMsg) {
                if (!addSuccess)
                    return res.status(400).send({ message: errMsg })
                else {
                    const token = jwt.sign({ id: email }, JWT_SECRET, {
                        expiresIn: "24h",
                    })
                    return res.status(200).send({ token })
                }
            })
        }
    })
})

// Login as a user.
app.post("/user/login", function(req, res) {
    const { email, password } = req.body
    if (!password) {
        // Since we added `bcrypt`, we can't validate within `UserModel`.
        return res.status(403).send({ message: "Password is ill-formed" })
    }
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            return res.status(500).send("Internal Server Error") // Don't mention hashing
        } else {
            User.findUser(email, function(loginSuccess, errMsg, user) {
                if (!loginSuccess)
                    return res.status(403).send({ message: errMsg })
                else {
                    bcrypt.compare(password, user.password, function(
                        err,
                        isSamePassword,
                    ) {
                        if (err) {
                            return res.status(403).send("Invalid password") // Not really
                        }
                        if (isSamePassword) {
                            const token = jwt.sign({ id: email }, JWT_SECRET, {
                                expiresIn: "24h",
                            })
                            return res.status(200).send({ token })
                        } else {
                            return res.status(403).send("Invalid password")
                        }
                    })
                }
            })
        }
    })
})

// As a user, store a secret.
app.put("/user/addSecret", middlewares.checkToken, function(req, res) {
    const { secret } = req.body
    User.updateSecret(req.decoded.id, secret, function(updateSuccess, errMsg) {
        if (!updateSuccess) {
            return res.status(403).send({ message: errMsg })
        } else {
            return res.status(200).send("OK")
        }
    })
})

// Guess another user's secret text field.
app.get("/user/guessSecret", middlewares.checkToken, function(req, res) {
    const { email, secret } = req.body
    User.getSecret(email, secret, function(
        getSecretSuccess,
        errMsg,
        successMsg,
    ) {
        if (getSecretSuccess) {
            return res.status(200).send(successMsg)
        } else {
            return res.status(404).send({ message: errMsg })
        }
    })
})

var server = app.listen(3000, function() {
    console.log("app running on port.", server.address().port)
})
