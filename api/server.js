const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 8000;

require('dotenv').config();

app.use(express.json());

//user database
const users = [
  {
    id: 1,
    username: "john",
    password: "John0908",
    isAdmin: true
  },
  {
    id: 2,
    username: "jane",
    password: "Jane0908",
    isAdmin: false
  }
];

app.get("/", (req, res) => {
  res.send("hi")
});

//login post route
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const foundUser = users.find(user => user.username === username && user.password === password);
  if (foundUser) {
    //Generate access token
    const accessToken = jwt.sign({ id: foundUser.id, isAdmin: foundUser.isAdmin }, process.env.SECRET_KEY);

    res.json({
      username: foundUser.username,
      isAdmin: foundUser.isAdmin,
      accessToken
    });
  }  else res.status(401).json("Username/Password incorrect")
});

//middleware verify function
const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid");
      }

      req.user = user;
      next();
    })
  } else {
    return res.status(401).json("you are not authenticated");
  }
};

//pr = protected route
app.get("/api/pr", verify, (req, res) => {
  //check if user is logged in and send response
  if (req.user) {
    return res.status(200).json("You are authenticated");
  } else {
    return res.status(403).json("Not authenticated");
  }

  
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));