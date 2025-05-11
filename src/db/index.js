function runDB(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err, result) {
      if (err) {
        console.error("Error running SQL:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function getDB(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, result) {
      if (err) {
        console.error("Error running SQL:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function allDB(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, result) {
      if (err) {
        console.error("Error running SQL:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = {
  runDB,
  getDB,
  allDB,
};