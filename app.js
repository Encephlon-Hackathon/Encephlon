require('dotenv').config()
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 2000;
const bodyParser = require('body-parser')
const encrypt = require('mongoose-encryption')


// const requestPromise = require('request-promise')

// const requests = require('requests');


//using body parser in the app
app.use(bodyParser.urlencoded({
    extended: true
}));


//Public static path
const static_path = path.join(__dirname, "/public");
const template_path = path.join(__dirname, "/templates/views");
const partials_path = path.join(__dirname, "/templates/partials");


app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.use(express.static(static_path));

//mongoose (database)
mongoose.connect(process.env.MONGODB_ID)

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"]
});

const User = new mongoose.model("User", userSchema); //user as a collection name



//Routing
app.get("/", (req, res) => {
    res.render("index");
})

app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})

// app.get("*", (req, res) => {
//     res.render("404error", {
//         errorMsg: 'Opps! Page Not Found'
//     });
// })




//post section from register and login

app.post("/register", function (req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save(function (err) {
        if (err) {
            console.log(err)
        } else {
            res.render("index")
        }
    })
})

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("index")
                }
            }
        }
    })
})

// listening to port
app.listen(port, () => {
    console.log(`listening to port at ${port}`)
})