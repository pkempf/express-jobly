"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job Title",
    salary: 10000,
    equity: "0",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(
      expect.objectContaining({ id: expect.any(Number), ...newJob })
    );

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New Job Title'`
    );
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: "New Job Title",
        salary: 10000,
        equity: "0",
        company_handle: "c1",
      })
    );
  });

  // allows duplicates, so no need to test duplicate behavior
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "Title1",
        salary: 10000,
        equity: null,
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: 2,
        title: "Title2",
        salary: 20000,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: 3,
        title: "Title3",
        salary: 30000,
        equity: "0.05",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
});

/************************************** findByCriteria */

describe("findByCriteria", function () {
  test("works: all filters", async function () {
    let filters = { title: "Title", minSalary: 20000, hasEquity: true };
    let jobs = await Job.findByCriteria(filters);
    expect(jobs).toEqual([
      {
        id: 3,
        title: "Title3",
        salary: 30000,
        equity: "0.05",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: not all filters", async function () {
    let filters = { minSalary: 29999 };
    let jobs = await Job.findByCriteria(filters);
    expect(jobs).toEqual([
      {
        id: 3,
        title: "Title3",
        salary: 30000,
        equity: "0.05",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: filters empty", async function () {
    let filters = {};
    let jobs = await Job.findByCriteria(filters);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "Title1",
        salary: 10000,
        equity: null,
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: 2,
        title: "Title2",
        salary: 20000,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: 3,
        title: "Title3",
        salary: 30000,
        equity: "0.05",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(2);
    expect(job).toEqual({
      id: 2,
      title: "Title2",
      salary: 20000,
      equity: "0",
      company: {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      },
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "NewTitle",
    salary: 35000,
    equity: "0.01",
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        id: 1,
        title: "NewTitle",
        salary: 35000,
        equity: "0.01",
        company_handle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "NewTitle",
      salary: null,
      equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        id: 1,
        title: "NewTitle",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query("SELECT title FROM jobs WHERE id = 1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job id", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
