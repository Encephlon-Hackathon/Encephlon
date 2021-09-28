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
    password: String
});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema); //user as a collection name

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//***************************Routing*****************************************

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/home", (req, res) => {
    res.render("home")
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