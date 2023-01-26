//jshint esversion:6

require("dotenv").config();
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
const session = require('express-session'); //express-session is required
const passport = require("passport"); //passport is require
const passportLocalMongoose = require("passport-local-mongoose"); //passport-local-mongoose is require
const {
    initialize
} = require("passport");





const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// initialize session package
app.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));
//initialize passportpackage
app.use(passport.initialize());
app.use(passport.session()); //users passport to call session in passport obj or package
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
    useNewUrlParser: true
});
//TODO
const userSchema = new mongoose.Schema({
    email: String,
    password: String

});

//enables passportLocalMongoose
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);
//used passport to createstragey and to serialize and deserialize
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render("home");
});
app.get('/login', (req, res) => {
    res.render("login");
});
app.get('/register', (req, res) => {
    res.render("register");
});
app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }

});
app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);

        } else {
            res.redirect("/");
        }
    });

});
app.post('/register', (req, res) => {
    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});
app.post('/login', function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    //this method comes from passport
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});
app.listen(3000, () => {
    console.log("server started on port 3000");
});