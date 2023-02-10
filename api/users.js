const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername, getPublicRoutinesByUser, getAllRoutinesByUser, getUser } = require('../db');
const { requireUser } = require('./utils');
const { JWT_SECRET = 'neverTell' } = process.env;
const { PasswordTooShortError, UserTakenError } = require('../errors');
// POST /api/users/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    next({
      name: 'MissingCredentialsError',
      message: 'Please supply both a username and password'
    });
  }

  try {
    const user = await getUser({username, password});
    if(!user) {
      next({
        name: 'IncorrectCredentialsError',
        message: 'Username or password is incorrect',
      })
    } else {
      const token = jwt.sign({id: user.id, username: user.username}, JWT_SECRET, { expiresIn: '1w' });
      res.send({ user, message: "you're logged in!", token });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/users/register
router.post('/register', async (req, res, next) => {
    const { username, password } = req.body;
  
    try {
      if (!username || !password) {
        res.send({
          error: 'MissingUsernameOrPassword',
          name: 'Missing username or password',
          message: 'Please enter a username and password',
        });
      } else if (password.length < 8) {
        res.send({
          error: 'PasswordTooShort',
          name: 'PasswordTooShort',
          message: PasswordTooShortError(),
        });
      } else {
        const _user = await getUserByUsername(username);
        if (_user) {
          res.send({
            error: 'Username already taken',
            name: 'UsernameAlreadyTaken',
            message: UserTakenError(_user.username),
          });
        } else {
          const user = await createUser({ username, password });
          if (user) {
            const token = jwt.sign(user, JWT_SECRET);
            res.send({
              name: 'RegisterSuccess',
              message: "you're logged in!",
              token,
              user,
            });
          }
        }
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  });
  

// GET /api/users/me
router.get('/me', requireUser, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error)
  }
})

// GET /api/users/:username/routines
router.get('/:username/routines', async (req, res, next) => {
  try {
    const {username} = req.params;
    const user = await getUserByUsername(username);
    if(!user) {
      next({
        name: 'NoUser',
        message: `Error looking up user ${username}`
      });
    } else if(req.user && user.id === req.user.id) {
      const routines = await getAllRoutinesByUser({username: username});
      res.send(routines);
    } else {
      const routines = await getPublicRoutinesByUser({username: username});
      res.send(routines);
    }
  } catch (error) {
    next(error)
  }
})
module.exports = router;