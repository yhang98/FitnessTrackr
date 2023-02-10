const express = require('express');
const router = express.Router();


const {getRoutineById,
    addActivityToRoutine,
    getAllPublicRoutines,
    createRoutine,
    updateRoutine,
    destroyRoutine
} = require("../db")
const {requireUser} = require("./utils")

// GET /api/routines
router.get('/', async(req, res, next) => {
    try {
        const routines = await getAllPublicRoutines();
        if(routines){
            res.send(routines)
        }
    } catch ({name, message}) {
        next({name, message})
    }
})
// POST /api/routines
router.post('/', requireUser, async (req, res, next) => {
    const {isPublic, name, goal} = req.body;
    try {
        const routine = await createRoutine({creatorId: req.user.id, isPublic, name, goal});
        res.send(routine)
       
        
    } catch ({name, message}) {
        next({name, message})    
    }
})

// PATCH /api/routines/:routineId
router.patch('/:routineId', requireUser, async (req, res, next) => {
    const {routineId} = req.params;
    const { isPublic, name, goal} = req.body;
    
    try {
        const routine = await getRoutineById(routineId);
        if(routine.creatorId === req.user.id){
            const updatedRoutine = await updateRoutine({id:routineId, isPublic, name, goal,});
            res.send(updatedRoutine)
        } else {
            
            res.status(403);
            res.send({
                name: "UnauthorizedUserError",
                message: `User ${req.user.username} is not allowed to update ${routine.name}`,
                error: "Error can't edit"
            })
        }
    } catch ({name, message}) {
        next({name, message})
    }
})
// DELETE /api/routines/:routineId
router.delete('/:routineId', requireUser, async(req, res, next) => {
    const { routineId } = req.params;
    

    try {
        const routine = await getRoutineById(routineId);

        if (routine.creatorId === req.user.id) {
            const deletedRoutine = await destroyRoutine(routineId);
            res.send(deletedRoutine[0])
        } else {
            res.status(403)
            res.send({
                error: 'user cannot delete routine',
                name: 'user cannot delete routine',
                message:`User ${req.user.username} is not allowed to delete ${routine.name}`
            })
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

// POST /api/routines/:routineId/activities
router.post('/:routineId/activities', requireUser ,  async(req, res, next) => {
    const routineId = req.params.routineId;
    const {activityId, count, duration} = req.body
    
    try {
        const routine = await getRoutineById(routineId);
        
        if (routine.creatorId === req.user.id) {
            const updatedActivity = await addActivityToRoutine({ routineId, activityId, count, duration });
            res.send(updatedActivity);
        } else {
            res.status(403);
            res.send({
                error: "error posting routine_activities",
                message: `Activity ID ${activityId} already exists in Routine ID ${routineId}`,
                name: "DuplicateRoutineActivityError"
            })
        }
    } catch ({name, message}) {
        res.send({
            error: "error posting routine_activities",
            message: `Activity ID ${activityId} already exists in Routine ID ${routineId}`,
            name: "DuplicateRoutineActivityError"
        })
    }
})
module.exports = router;