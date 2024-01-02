module.exports = (req, res, next) => {
  console.log(req.cookies);

  if (req.cookies.loggedIn !== undefined &&
    req.cookies.loggedIn.loggedIn === true)
    {
      console.log("in first auth");
      req.isAuthenticated = true;
      res.username = req.cookies.loggedIn.username;
      // res.role = req.cookies.loggedIn.role;
      console.log("auth true");
      console.log(req.cookies.loggedIn.username);
      next();
    } 
    else {
      // console.log("auth false");
      req.isAuthenticated = false;
      next();
    }
};