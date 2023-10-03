const express = require("express");
require("./db/connect");
require('dotenv').config()
const User = require("./module/User");
const Blog = require("./module/blog");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());
const secretkey = process.env.Secret_key ||"mynameisrandhirpratapsinghwebdeveloper";

app.use(cors());
app.use(bodyParser.json());

const multer = require("multer");
const storage = multer.diskStorage({
    destination: './uploads/', // Destination folder for storing uploaded files
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalname = file.originalname;
        const fileExtension = originalname.split('.').pop(); // Get the file extension
        const newFilename = uniqueSuffix + '.' + fileExtension; // Generate a unique filename
        cb(null, newFilename);
    },
  });
  
  const upload = multer({ storage });


// ############################ register user #########################
app.post("/register", async (req, res, next) => {
  try {
    if (
        !req.body ||
        !req.body.username ||
        !req.body.email ||
        !req.body.password
      ) {
        return res.status(400).json({ message: "Invalid request data" });
      }
  
      const { username, email, password } = req.body;
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      const result = await user.save();
      console.log(result);
    jwt.sign({ user }, secretkey,  async (err, token) => {
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
           // Create a user object with username, email, and token
      const userObject = {
        username: user.username,
        email: user.email,
        token,
      };

      // Serialize the user object to JSON
      const userObjectJSON = JSON.stringify(userObject);

      // Set a single cookie with the user data
      res.cookie('user', userObjectJSON);
          res.status(201).json({ message: "User registered successfully",token });
    })

    
  } catch (error) {
    next(error);
  }
});

// ############################ Login user #########################

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Authentication failed" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    // Generate JWT token
    jwt.sign({ user }, secretkey, (err, token) => {
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
         // Create a user object with username, email, and token
      const userObject = {
        username: user.username,
        email: user.email,
        token,
      };

      // Serialize the user object to JSON
      const userObjectJSON = JSON.stringify(userObject);

      // Set a single cookie with the user data
      res.cookie('user', userObjectJSON);
    
          // Respond with the token or any other data as needed
          res.json({
            token,
          });
    });
  } catch (err) {
    next(err);
  }
});

// ############################ Blog Post #########################

app.post("/blog-post", verifyTokenFromCookie, upload.single("image"), async (req, res, next) => {
    try {
      const { title, content } = req.body;
      const imagePath = req.file ? req.file.path : ""; // Get the path to the uploaded image
  
      // You can access the authenticated user data (username, email, etc.) from req.user
      console.log("Authenticated User Data:", req.user);
  
      const blog = new Blog({ title, content, imagePath });
      const result = await blog.save();
      // console.log(result);
      res.status(201).json({ message: "Blog post successfully" });
    } catch (err) {
      next(err);
    }
  });

// ############################ Get Blog  #########################

app.get("/blogs", async (req, res, next) => {
  try {
    const blog = await Blog.find();

    res.status(200).json({ blog });
  } catch (err) {
    next(err);
  }
});




// ############################ Logout api code  #########################

app.post("/logout", (req, res) => {
    // Clear the 'user' cookie
    res.clearCookie('user');
    
    // Respond with a message indicating successful logout
    res.json({ message: 'User logged out successfully' });
  });
  



// ############################ JWT Token Verification code  #########################

// Middleware to verify the JWT token from cookies
function verifyTokenFromCookie(req, res, next) {
    const userCookie = req.cookies.user; // Retrieve the 'user' cookie
  
    if (userCookie) {
      const userObject = JSON.parse(userCookie);
  
      if (userObject && userObject.token) {
        const token = userObject.token;
  
        // Verify the token
        jwt.verify(token, secretkey, (err, authData) => {
          if (err) {
            return res.status(403).json({ error: "Invalid token" });
          }
          
          // Store the authenticated user data in req.user for later use
          req.user = userObject;
          next();
        });
      } else {
        return res.status(403).json({ error: "Token not found in cookie" });
      }
    } else {
      return res.status(403).json({ error: "Cookie not found" });
    }
  }



// ################################# Run on port8080 #################################
const port = process.env.PORT || 8080;
app.listen(port, (req, res) => {
  console.log(`Server started on port ${port}`);
});
