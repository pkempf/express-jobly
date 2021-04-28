const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/** Generates portions of SQL query used to partially update data.
 *
 *  Parameters:
 *  - dataToUpdate, a JS object with the new data
 *  - jsToSql, a JS object, where each key is the JS name of a variable
 *      in dataToUpdate and each value is the SQL name of that column
 *      (if different)
 *
 *  Returns:
 *  - setCols: a string of SQL column names and their placeholders, e.g.
 *      '"field_1"=$1, "field_2"=$2, "field_3"=$3, ... "field_n"=$n'
 *  - values: the values corresponding to each placeholder in setCols, e.g.
 *      [val_1, val_2, val_3, ... val_n]
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
