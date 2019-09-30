require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var User = require("./UserModel");
var JWT_SECRET = process.env.JWT_SECRET;

var app = express();
//Using body-parser middleware

//Parse application/x-www-form-urlencoded body from POST
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);

//Parse application/json body from POST
app.use(bodyParser.json());

// Create a user based on an email and password (already provided).
app.post("/user/createUser", function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    console.log(email, password);
    User.addUser(email, password, function(addSuccess, errMsg) {
        if (!addSuccess) return res.status(400).send({ message: errMsg });
        else {
            var token = jwt.sign({ id: email }, JWT_SECRET, {
                expiresIn: "24h",
            });
            return res.status(200).send({ token });
        }
    });
});

//Login as a user.
app.post("/user/login", function(req, res) {
    return res.status(500).send("Not Implemented");
});

//As a user, store a secret.
app.put("/user/addSecret", function(req, res) {
    return res.status(500).send("Not Implemented");
});

//Guess another user's secret text field.
app.get("/user/guessSecret", function(req, res) {
    return res.status(500).send("Not Implemented");
});

var server = app.listen(3000, function() {
    console.log("app running on port.", server.address().port);
});
