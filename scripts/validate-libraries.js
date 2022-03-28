const _ = require("lodash");

const libraries = require("../libraries.json");

const red = (str) => (process.env.CI ? `\x1b[31m${str}\x1b[0m` : str);

const assertNonEmpty = (lib, field) => {
  if (!lib[field]) {
    throw new Error(red(`"${lib.source}" doesn't have "${field}" field set.`));
  }
};

const assertExistingIds = () => {
  const libsWithNoId = [];
  for (const lib of libraries) {
    if (!lib.id) {
      libsWithNoId.push(lib);
    }
  }
  if (libsWithNoId.length) {
    throw new Error(
      red(
        `Following libraries don't have an "id" field:\n\t"${libsWithNoId
          .map((lib) => lib.name)
          .join(`"\n\t"`)}"`,
      ),
    );
  }
};

const assertUniqueIds = () => {
  const groups = _.groupBy(libraries, "id");
  const duplicateIds = [];
  for (const [id, libs] of Object.entries(groups)) {
    if (libs.length > 1) {
      duplicateIds.push(id);
    }
  }
  if (duplicateIds.length) {
    throw new Error(red(`Found duplicate ids: "${duplicateIds.join(`", "`)}"`));
  }
};

// -----------------------------------------------------------------------------

for (const lib of libraries) {
  assertNonEmpty(lib, "name");
  assertNonEmpty(lib, "description");
  assertNonEmpty(lib, "version");
  assertNonEmpty(lib, "source");
  assertNonEmpty(lib, "preview");
  assertNonEmpty(lib, "created");
  assertNonEmpty(lib, "updated");
  assertNonEmpty(lib, "authors");
}

assertExistingIds();
assertUniqueIds();
