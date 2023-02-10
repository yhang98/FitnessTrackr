const express = require('express');
const router = express.Router();

const {
    getAllActivities,
    getPublicRoutinesByActivity,
    getActivityByName,
    createActivity,
    getActivityById,
    updateActivity
} = require(`../db`);
const { ActivityExistsError, ActivityNotFoundError } = require(`../errors`);
const {requireUser} = require("./utils")

// GET /api/activities/:activityId/routines
router.get('/:activityId/routines', async (req, res, next) =>{
  const { activityId, } = req.params;
  try {
    const activityName = await getActivityById(activityId);
    const allPublicRoutineActivities = await getPublicRoutinesByActivity({
      id: activityId,
    })
    if (!activityName) {
      res.send({
        error:"activiy ko exist eh",
        name:"activiy ko exist eh",
        message: ActivityNotFoundError(activityId)
      })
    } else {
      res.send(allPublicRoutineActivities)
    }
  } catch ({name, message}) {
    next({name, message})
}


})


// GET /api/activities
router.get('/', async (req, res, next) => {
    try {
        const allActivities = await getAllActivities();
        if(allActivities){
            res.send(allActivities)
        }
    } catch ({name, message}) {
        next({name, message})
    }
  });

// POST /api/activities
router.post('/', requireUser, async (req, res, next) => {
    const { name, description } = req.body;
    try {
    const activityName = await getActivityByName(name);
    const newActivity = await createActivity({ name, description });
    if(activityName){
        res.send({
            error: "activity already exists",
            name: "acvitivity already exists",
            message:ActivityExistsError(activityName.name)
        })
    } else{
        res.send(newActivity)
    }
}catch ({name, message}) {
    next({name, message})
}
})
  
  // PATCH /api/activities/:activityId
  router.patch('/:activityId', requireUser, async (req, res, next) => {
    const { activityId } = req.params;
   
   try {
    const { name, description } = req.body;
  
    const updateFields = {};
  
    if (activityId) {
      updateFields.id = activityId;
    }
  
    if (name) {
      updateFields.name = name;
    }
  
    if (description) {
      updateFields.description = description;
    }
  
    const activityById = await getActivityById(activityId);
    const activityByName = await getActivityByName(name);
  
    if (!activityById) {
      res.send({
        error: 'ActivityDoesNotExists',
        name: 'Activity does not exists',
        message: ActivityNotFoundError(activityId),
      });
    } else if (activityByName) {
      res.send({
        error: 'ActivityAlreadyExists',
        name: 'Activity already exists',
        message: ActivityExistsError(activityByName.name),
      });
    } else {
      const updateAllActivity = await updateActivity(updateFields);
      res.send(updateAllActivity);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
  
  });

module.exports = router;