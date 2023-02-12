const client = require("./client");
async function attachActivitiesToRoutines(routines) {

  await Promise.all(routines.map(async (routine) => {
    const { rows: activities } = await client.query(`
    SELECT DISTINCT activities.*, ra.duration, ra.count, ra."routineId", ra.id AS "routineActivityId"
    FROM activities
    JOIN routine_activities as ra
    ON ra."activityId"=activities.id
    WHERE ra."routineId"=$1;
    `,[routine.id])
    routine.activities = activities 
  }))

  return routines;

}
async function getRoutineById(id) {
  try {
    const {
      rows: [routine],
    } = await client.query(`
    SELECT *
    FROM routines
    WHERE id=${id};
    `);
    return routine;
  } catch (error) {
    console.error("error getting routine by id");
  }
}

async function getRoutinesWithoutActivities() {
  try {
    const {
      rows: routines,
    } = await client.query(`
    SELECT *
    FROM routines;
    `);
    return routines;
  } catch (error) {
    console.error("error getting routines without activities");
  }
}

async function getAllRoutines() {
  try {
    const { rows } = await client.query(`
    SELECT routines.*, users.username AS "creatorName" 
    FROM routines
    JOIN users ON routines."creatorId" = users.id;
    `)
    

  return attachActivitiesToRoutines(rows);

  } catch (error) {
    console.error("error getting all routines");
  }
}

async function getAllRoutinesByUser({ username }) {
  try {
    const { rows } = await client.query(
      `
    SELECT routines.*, users.username AS "creatorName"
    FROM routines
    INNER JOIN users
    ON routines."creatorId"=users.id
    WHERE "creatorId" IN (SELECT id FROM users WHERE username = '${username}');
    `,);
    
  return attachActivitiesToRoutines(rows);
  } catch (error) {
    console.error("error getting all routines by user");
    throw error;
  }
}

async function getPublicRoutinesByUser({ username }) {
  try {
    const { rows } = await client.query(
      `
    SELECT routines.*, users.username AS "creatorName"
    FROM routines
    INNER JOIN users
    ON routines."creatorId"=users.id
    WHERE routines."isPublic"=true
    AND users.username=$1;
    `,
      [username]
    );
    return attachActivitiesToRoutines(rows);
  } catch (error) {
    console.error("error getting public routines by user");
    throw error;
  }
}

async function getAllPublicRoutines() {
  try {
    const { rows } = await client.query(`
    SELECT routines.*, users.username AS "creatorName" 
    FROM routines
    JOIN users ON routines."creatorId" = users.id
    WHERE "isPublic" = TRUE;  
    `);
  return attachActivitiesToRoutines(rows);
  } catch (error) {
    console.error("error getting all public routines");
  }
}

async function getPublicRoutinesByActivity({ id }) {
  try {
    const { rows } = await client.query(`
    SELECT routines.*, users.username AS "creatorName" 
    FROM routines 
    JOIN users ON routines."creatorId"=users.id
    JOIN routine_activities ON routine_activities."routineId"=routines.id
    WHERE routines."isPublic"=true
    AND routine_activities."activityId"=$1;
    `, [id]);
  return attachActivitiesToRoutines(rows);
  } catch (error) {
    console.error("error getting public routines by activity");
    throw error;
  }
}

async function createRoutine({ creatorId, isPublic, name, goal }) {
  try {
    const {
      rows: [routine],
    } = await client.query(
      `
    INSERT INTO routines("creatorId", "isPublic", name, goal)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
      [creatorId, isPublic, name, goal]
    );
    return routine;
  } catch (error) {
    console.error("error creating routine!");
    throw error;
  }
}

async function updateRoutine({ id, ...fields }) {
  const { update } = fields;
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  try {
    if (setString.length > 0) {
      await client.query(
        `
      UPDATE routines
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
      `,
        Object.values(fields)
      );
    }
    if (update === undefined) {
      return await getRoutineById(id);
    }
  } catch (error) {
    console.error("error updating routine");
    throw error;
  }
}

async function destroyRoutine(id) {
  try {
    await client.query(`
    DELETE FROM routine_activities
    WHERE "routineId"=$1
    `, [id]);
    const {rows: deletedRoutine } = await  client.query(`
    DELETE FROM routines
    WHERE id=$1
    RETURNING *;
    `, [id]);
    return deletedRoutine
  } catch (error) {
    console.error("error destroying routine");
    throw error;
  }
}

module.exports = {
  getRoutineById,
  getRoutinesWithoutActivities,
  getAllRoutines,
  getAllPublicRoutines,
  getAllRoutinesByUser,
  getPublicRoutinesByUser,
  getPublicRoutinesByActivity,
  createRoutine,
  updateRoutine,
  destroyRoutine
};