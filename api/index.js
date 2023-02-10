const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
const { JWT_SECRET = 'neverTell'} = process.env;
const routineActivitiesRouter = require('./routineActivities');
const routinesRouter = require('./routines');
const activitiesRouter = require('./activities');
const usersRouter = require('./users');

router.get('/health', async (req, res, next) => {
    res.status(200).json({
      uptime: process.uptime(),
      message: 'All is well',
      timestamp: Date.now()
    });
    next()
});


router.use(async (req, res, next) => {
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');
  
  if (!auth) {
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);
    
    try {
      const newToken = jwt.verify(token, JWT_SECRET);
      
      const id = newToken && newToken.id
      if (id) {
        req.user = await getUserById(id);
        next();
      }
    } catch (error) {
      next(error);
    }
  } else {
    next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${ prefix }`
    });
  }
});

router.use((req, res, next) => {
  if (req.user) {
    console.log("req.user W");
  }
  next();
});

router.use('/users', usersRouter);
router.use('/activities', activitiesRouter);
router.use('/routines', routinesRouter);
router.use('/routine_activities', routineActivitiesRouter);

router.get('*', function(req, res){
    res.status(404);
    res.send({
        message: "404 page not found"
    })
})


module.exports = router;