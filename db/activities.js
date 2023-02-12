const client = require("./client");

// database functions
async function getAllActivities() {
  try {
    const { rows } = await client.query(`
      SELECT *
      FROM activities;
    `);

    return rows;
  } catch (error) {
    console.error('error getting activities')
    throw error;
  }
}

async function getActivityById(id) {
  try {
    const { rows: [activity] } = await client.query(
      `
      SELECT * FROM activities
      WHERE id=$1;
    `,
      [id]
    );

    return activity;
  } catch (error) {
    console.error('error getting activities by id')
    throw error;
  }
}

async function getActivityByName(name) {
  try {
    const { rows:[activity] } = await client.query(
      `
      SELECT * FROM activities
      WHERE name=$1;
    `,
      [name]
    );

    return activity;
  } catch (error) {
    console.error('error getting activities by name')
    throw error;
  }
}

// select and return an array of all activities
async function attachActivitiesToRoutines(routines) {
  // no side effects
  const routinesToReturn = [...routines];
  const binds = routines.map((_, index) => `$${index + 1}`).join(", ");
  const routineIds = routines.map((routine) => routine.id);
  if (!routineIds?.length) return [];

  try {
    // get the activities, JOIN with routine_activities (so we can get a routineId), and only those that have those routine ids on the routine_activities join
    const { rows: activities } = await client.query(
      `
      SELECT activities.*, routine_activities.duration, routine_activities.count, routine_activities.id AS "routineActivityId", routine_activities."routineId"
      FROM activities 
      JOIN routine_activities ON routine_activities."activityId" = activities.id
      WHERE routine_activities."routineId" IN (${binds});
    `,
      routineIds
    );

    // loop over the routines
    for (const routine of routinesToReturn) {
      // filter the activities to only include those that have this routineId
      const activitiesToAdd = activities.filter(
        (activity) => activity.routineId === routine.id
      );
      // attach the activities to each single routine
      routine.activities = activitiesToAdd;
    }
    return routinesToReturn;
  } catch (error) {
    throw error;
  }
}

// return the new activity
async function createActivity({ name, description }) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `
      INSERT INTO activities(name, description) 
      VALUES($1, $2) 
      ON CONFLICT (name) DO NOTHING 
      RETURNING *;
    `,
      [name, description]
    );

    return activity;
  } catch (error) {
    console.error('error creating activities')
    throw error;
  }
}
/*async function attachActivitiesToRoutines(routines) {
  const routinesToReturn = {...routines};
  for(const routine of routinesToReturn ){

    const {rows: activities} = await client.query(
       `
     SELECT *
     FROM activities
     JOIN  routine_activities ON activities.id=routine_activities."activityId"
     WHERE routine_activities."routineId"=$1
     `, [routine.id]);
     routine.activities = activities;
  }
  return routinesToReturn
    
}*/

// don't try to update the id
// do update the name and description
// return the updated activity
async function updateActivity({ id, ...fields }) {
  try {
    const indexString = Object.keys(fields).map((key, index) => {
      return `"${key}"=$${index + 1}`;
    });
    const {
      rows: [activity],
    } = await client.query(
      `
      UPDATE activities
      SET ${indexString}
      WHERE id=${id}
      RETURNING *;`,
      Object.values(fields)
    );
    return activity;
  } catch (err) {
    console.error("erroro updating activities");
    throw err;
  }
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
};