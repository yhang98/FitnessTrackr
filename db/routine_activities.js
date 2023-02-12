const client = require('./client')

async function getRoutineActivityById(id){
  try {
    const { rows: [routineActivity] } = await client.query(
      `
      SELECT * FROM routine_activities
      WHERE id=$1;
    `,
      [id]
    );

    return routineActivity;
  } catch (error) {
    console.error('error getting routine activity by id')
    throw error;
  }
}

async function addActivityToRoutine({routineId, activityId, count, duration,}) {
  try{
    const {rows: [routineActivity]} = await client.query(`
    INSERT INTO routine_activities("routineId", "activityId", count, duration)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `, [routineId, activityId, count, duration]);
    return routineActivity;
  } catch(error){
    console.error("error adding activity to routine")
    throw error
  }
}

async function getRoutineActivitiesByRoutine({id}) {
  try {
    const { rows } = await client.query(
      `
      SELECT * FROM routine_activities
      WHERE "routineId"=$1;
    `,
      [id]
    );

    return rows;
  } catch (error) {
    console.error('error getting routine activities by id')
    throw error;
  }
}

async function updateRoutineActivity ({id, ...fields}) {
  try {
    const indexString = Object.keys(fields).map((key, index) => {
      return `"${key}"=$${index + 1}`;
    });
    const {
      rows: [routineActivity],
    } = await client.query(
      `
      UPDATE routine_activities
      SET ${indexString}
      WHERE id=${id}
      RETURNING *;`,
      Object.values(fields)
    );
    return routineActivity;
  } catch (error) {
    console.error("error updating routine activities");
    throw error;
  }
}

async function destroyRoutineActivity(id) {
  try{
   const {rows: [routine_activity] } = await client.query(`
    DELETE FROM routine_activities
    WHERE id=$1
    RETURNING *;
    `, [id]);
    return routine_activity  


    
  } catch(error){
    console.error("error destroying routine activity");
    throw error
  }
}

async function canEditRoutineActivity(routineActivityId, userId) {
  try{
    
    const {rows: [routine_activity] } = await client.query(`
    SELECT routine_activities.*, routines.*  
    FROM routine_activities
    JOIN routines ON routine_activities."routineId"=routines.id
    WHERE routine_activities.id=$1;
    `, [routineActivityId])
    
    if(routine_activity.creatorId === userId){
      return true
    }
    
  } catch(error){
    console.error("error figuring out if routine can be edited")
    throw error
  }
}

module.exports = {
  getRoutineActivityById,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
  updateRoutineActivity,
  destroyRoutineActivity,
  canEditRoutineActivity,
};