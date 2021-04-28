const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("works: dataToUpdate and jsToSql provided", function () {
    const dataToUpdate = {
      name: "ACME Corp.",
      description: "Purveyor of cartoon explosives",
      numEmployees: 1930,
      logoUrl: "https://test.com/image.jpg",
    };
    const jsToSql = { numEmployees: "num_employees", logoUrl: "logo_url" };
    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(setCols).toEqual(
      '"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4'
    );
    expect(values).toEqual([
      "ACME Corp.",
      "Purveyor of cartoon explosives",
      1930,
      "https://test.com/image.jpg",
    ]);
  });
  test("works: dataToUpdate provided, empty jsToSql", function () {
    const dataToUpdate = {
      name: "ACME Corp.",
      description: "Purveyor of cartoon explosives",
    };
    const jsToSql = {};
    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(setCols).toEqual(`"name"=$1, "description"=$2`);
    expect(values).toEqual(["ACME Corp.", "Purveyor of cartoon explosives"]);
  });
  test("should throw BadRequestError: empty dataToUpdate", function () {
    try {
      const dataToUpdate = {};
      const jsToSql = {};
      const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
