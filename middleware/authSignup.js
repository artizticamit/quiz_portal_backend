module.exports = (req, res, next) => {
    console.log(req.cookies);
  
    if (
      req.cookies.signedUp !== undefined &&
      req.cookies.signedUp.signedUp === true
    ) {
      console.log("in first auth");
      req.isSignedUp = true;
      res.signedUpUser = req.cookies.signedUp.username;
      // res.role = req.cookies.loggedIn.role;
      console.log("auth true");
      console.log(req.cookies.signedUp.signedUpUser);
      next();
    } else {
      console.log("auth false");
      req.isSignedUp = false;
      next();
    }
  };