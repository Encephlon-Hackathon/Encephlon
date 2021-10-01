require('dotenv').config()
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 2000;
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const requestPromise = require('request-promise')
// const requests = require('requests');

app.use(bodyParser.urlencoded({
    extended: true
}));

//*************************Public static path**********************************************

const static_path = path.join(__dirname, "/public");
const template_path = path.join(__dirname, "/templates/views");
const partials_path = path.join(__dirname, "/templates/partials");


app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.use(express.static(static_path));


//************************Using Session****************************************** */

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,

}))

app.use(passport.initialize());
app.use(passport.session());



//*****************mongoose (database) and passport local mongoose*********************************************

mongoose.connect(process.env.MONGODB_ID)

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema); //user as a collection name

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//************************Google Authentication***************************************************/

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:2000/auth/google/encephlon",
        // This option tells the strategy to use the userinfo endpoint instead
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            username: profile.displayName,
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));


//***************************Routing*****************************************

app.get("/", (req, res) => {
    res.render("index");
})
app.get("/auth/google",
    passport.authenticate('google', {
        scope: ['profile']
    }) //google strategy
)
app.get('/auth/google/encephlon',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/home');
    });

app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/home", (req, res) => {
    res.render("home")
})
app.get("/floodMaps", (req, res) => {
    res.render("floodMaps");
})
app.get("/contact", (req, res) => {
    res.render("contact")
})
app.get("/about", (req, res) => {
    res.render("about")
})
app.get("/info", (req, res) => {
    res.render("info")
})
app.get("/beforeFlood", (req, res) => {
    res.render("beforeFlood")
})
app.get("/duringFlood", (req, res) => {
    res.render("duringFlood")
})
app.get("/afterFlood", (req, res) => {
    res.render("afterFlood")
})
app.get("/functions", (req, res) => {
    res.render("functions")
})

// app.get("*", (req, res) => {
//     res.render("404error", {
//         errorMsg: 'Opps! Page Not Found'
//     });
// })


app.get("/index", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("index")
    } else {
        res.redirect("/register")
    }
})

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/")
})



//***post section with (passport local mongoose)&(passport.js) ********************************

app.post("/register", function (req, res) {

    User.register({
            username: req.body.username
        }, req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register')
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/home")
                })
            }
        })

})

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/home")
            })
        }
    })
})

// listening to port
app.listen(port, () => {
    console.log(`listening to port at ${port}`)
})