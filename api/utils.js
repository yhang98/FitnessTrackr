function requireUser( req, res, next,) {
    if (!req.user) {
        res.status(401);
        res.send({
          error: "Not logged in",
          name: "MissingUserError",
          message: "You must be logged in to perform this action",
        });
      }
      next();
    }

module.exports  = { requireUser };