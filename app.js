const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const cookieParser = require('cookie-parser');
const userModel = require('./user');
const postModel = require('./post');

app.set('view engine', "ejs");
app.set("views", path.join(__dirname, ""));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/logout", (req, res) => {
    res.clearCookie("token"); // Use clearCookie to clear cookies
    res.redirect("/login");
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;
    try {
        let user = await userModel.findOne({ email });

        if (!user) {
            return res.status(500).send("Something went wrong...");
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).send("Error comparing passwords.");
            }

            if (result) {
                let token = jwt.sign({ email: email, userid: user._id }, "shhh", { expiresIn: '1h' });
                res.cookie("token", token);
                res.status(200).redirect("/profile");
            } else {
                res.redirect("/login");
            }
        });
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.post("/register", async (req, res) => {
    let { email, password, username, age, name } = req.body;

    try {
        // Check if email is already registered
        let user = await userModel.findOne({ email });

        if (user) {
            return res.status(500).send("User already registered");
        }

        // Hash the password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                return res.status(500).send("Error generating salt");
            }

            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    return res.status(500).send("Error hashing password");
                }

                // Create new user
                let newUser = await userModel.create({
                    name,
                    username,
                    age,
                    email,
                    password: hash
                });

                // Generate a token
                let token = jwt.sign({ email: email, userid: newUser._id }, "shhh", { expiresIn: '1h' });
                res.cookie("token", token);
                res.send("Registered successfully");
            });
        });
    } catch (error) {
        res.status(500).send("Server error");
    }
});
app.post("/post",isLogged,async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    let post= await postModel.create({
        user:user._id,
        content:req.body.content
     });

     user.posts.push(post._id);
     await user.save();
     res.redirect("/profile");

})
app.get("/profile", isLogged, async(req, res) => {
 let user=  await userModel.findOne({email:req.user.email}).populate("posts");
 console.log(user);
 
    
    res.render("profile",{user});
});
app.get("/Like/:id", isLogged, async(req, res) => {
    let post=  await postModel.findOne({_id:req.params.id}).populate("user");
    post.likes.push(req.user.userid);
   await post.save();
    // console.log(user);
    
       
       res.redirect("/profile");
   });
function isLogged(req, res, next) {
    if (!req.cookies.token) {
        return res.status(401).redirect("/login");
    }

    try {
        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();
    } catch (error) {
        res.status(401).send("Invalid token");
    }
}

app.listen(5000, () => {
    console.log('Server is running on port 3000');
});
