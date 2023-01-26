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

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");




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
    password: String,
    googleId: String,
    secret: String

});

//enables passportLocalMongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);
//used passport to createstragey and to serialize and deserialize
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));
app.get('/', (req, res) => {
    res.render("home");
});
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ["profile"]
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });


app.get('/login', (req, res) => {
    res.render("login");
});
app.get('/register', (req, res) => {
    res.render("register");
});
app.get("/secrets", function (req, res) {
    User.find({
        "secret": {
            $ne: null
        }
    }, function (err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {
                    usersWithSecrets: foundUsers
                });
            }
        }
    });

});
app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
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
app.post('/submit', function (req, res) {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    });


});
app.listen(3000, () => {
    console.log("server started on port 3000");
});