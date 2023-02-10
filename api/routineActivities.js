const express = require('express');
const routineActivitiesRouter = express.Router();
const {requireUser} = require('./utils')
const {getRoutineActivityById, getRoutineById, updateRoutineActivity, destroyRoutineActivity} = require('../db')

// PATCH /api/routine_activities/:routineActivityId
routineActivitiesRouter.patch('/:routineActivityId', requireUser, async(req, res, next) => {
    const {routineActivityId} = req.params;
    const {count, duration} = req.body;
    const originalRoutineActivity = await getRoutineActivityById(routineActivityId)
    const {routineId} = originalRoutineActivity
    const routine = await getRoutineById(routineId)

    try {
        if(originalRoutineActivity && routine.creatorId === req.user.id){
            const updatedRoutineActivity = await updateRoutineActivity({id: routineActivityId, count, duration});
            res.send(updatedRoutineActivity)
        } else {
            res.status(403);
            res.send({
                error: 'UnauthorizedUpdateError',
                message: `User ${req.user.username} is not allowed to update ${routine.name}`,
                name: 'UnauthorizedUpdateError'
            })
        }
    } catch ({name, message}) {
        next({name, message})
    }

})
// DELETE /api/routine_activities/:routineActivityId
routineActivitiesRouter.delete('/:routineActivityId', requireUser, async(req, res, next) => {
    const {routineActivityId} = req.params;
    const routineActivityToDelete = await getRoutineActivityById(routineActivityId);
    const {routineId} = routineActivityToDelete;
    const routine = await getRoutineById(routineId);
    
    try {
        if(routineActivityToDelete && routine.creatorId === req.user.id){
            const destroyedRoutineActivity = await destroyRoutineActivity(routineActivityId);
            res.send(destroyedRoutineActivity)
        } else{
            res.status(403);
            res.send({
                error: 'UnauthorizedUpdateError',
                message: `User ${req.user.username} is not allowed to delete ${routine.name}`,
                name: 'UnauthorizedUpdateError'
            })
        }
    } catch ({name, message}) {
        next({name, message})
    }
})
module.exports = routineActivitiesRouter;