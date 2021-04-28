"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Allows duplicates, because more than one of the same position
   * may open up at any given company.
   * */

  static async create(data) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT j.id,
              j.title,
              j.salary,
              j.equity,
              j.company_handle AS "companyHandle",
              c.name AS "companyName"
           FROM jobs AS j
              LEFT JOIN companies AS c ON j.company_handle = c.handle
           ORDER BY id`
    );
    return jobsRes.rows;
  }

  /** Find jobs by criteria, designing a custom filter string
   *  depending on which criteria are given.
   *
   *  Takes filter object; not all fields required: {title, minSalary, hasEquity}
   *
   *  Returns [{ id, title, salary, equity, companyHandle }, ...]
   */

  static async findByCriteria(filters) {
    // destructure the filters object into the three criteria
    const { title, minSalary, hasEquity } = filters || {};

    // if filters was empty, just run the normal findAll()
    if (!(title || minSalary || hasEquity)) return Job.findAll();

    let filterString = "";
    let values = [];

    // building the string to put in the query in the WHERE section
    // and the parameters to send with it
    if (title) {
      filterString += "title ILIKE $1";
      values.push(`%${title}%`);
    }
    if (minSalary) {
      if (values.length > 0) {
        filterString += " AND salary >= $" + (values.length + 1);
      } else {
        filterString += "salary >= $1";
      }
      values.push(minSalary);
    }
    if (hasEquity) {
      if (values.length > 0) {
        filterString += " AND equity > 0";
      } else {
        filterString += "equity > 0";
      }
    }

    const jobsRes = await db.query(
      `SELECT j.id,
              j.title,
              j.salary, 
              j.equity,
              j.company_handle AS "companyHandle",
              c.name AS "companyName"
         FROM jobs AS j
              LEFT JOIN companies AS c ON j.company_handle = c.handle
         WHERE ${filterString}
         ORDER BY id`,
      values
    );
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) {
      throw new NotFoundError(`Job with id ${id} not found`);
    }

    const companyRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`,
      [job.companyHandle]
    );

    delete job.companyHandle;
    job.company = companyRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   * (Note that id and companyHandle should not be changed)
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job with id ${id} not found`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job with id ${id} not found`);
  }
}

module.exports = Job;
