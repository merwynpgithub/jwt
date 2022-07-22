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

//refresh token database
let refreshTokens = [];

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.SECRET_KEY, {
    expiresIn: "45s",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.REFRESH_KEY);
};

app.get("/", (req, res) => {
  res.send("hi")
});

//refresh token post route
app.post("/api/refresh", (req, res) => {
  //take the refresh token generated during login
  const refreshToken = req.body.token;
  console.log(refreshTokens);

  //send error if there is no token or it's invalid
  if (!refreshToken) return res.status(401).json("You are not authenticated!");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid!");
  }

  jwt.verify(refreshToken, process.env.REFRESH_KEY, (err, user) => {
    if (err) console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  })
});

//login post route
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const foundUser = users.find(user => user.username === username && user.password === password);
  if (foundUser) {
    //Generate access token
    const accessToken = generateAccessToken(foundUser);
     //Generate refresh token
     const refreshToken = generateRefreshToken(foundUser);

     //save the refreshtoken in the refresh token database
     refreshTokens.push(refreshToken);

    res.json({
      username: foundUser.username,
      isAdmin: foundUser.isAdmin,
      accessToken,
      refreshToken
    });
  }  else res.status(401).json("Username/Password incorrect")
});

//middleware verify function for protected route
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

//logout route to delete the refresh token
app.post("/api/logout", verify, (req, res) => {
  const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json("You logged out successfully.");
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));