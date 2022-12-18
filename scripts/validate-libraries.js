const librariesList = require("../libraries.json");

const red = (str) => (process.env.CI ? `\x1b[31m${str}\x1b[0m` : str);

const assertNonEmpty = (lib, field) => {
  if (!lib[field]) {
    throw new Error(red(`"${lib.source}" doesn't have "${field}" field set.`));
  }
};

const assertUniqueIds = () => {
  const ids = new Set();
  const duplicateIds = [];
  for (const lib of librariesList) {
    if (!lib.id) {
      continue;
    }
    if (ids.has(lib.id)) {
      duplicateIds.push(lib.id);
    }
    ids.add(lib.id);
  }
  if (duplicateIds.length) {
    throw new Error(red(`Found duplicate ids: "${duplicateIds.join(`", "`)}"`));
  }
};

// -----------------------------------------------------------------------------

for (const lib of librariesList) {
  assertNonEmpty(lib, "name");
  assertNonEmpty(lib, "description");
  assertNonEmpty(lib, "version");
  assertNonEmpty(lib, "source");
  assertNonEmpty(lib, "preview");
  assertNonEmpty(lib, "created");
  assertNonEmpty(lib, "updated");
  assertNonEmpty(lib, "authors");
  // TODO re-enable once we add missing item names for old libs
  // assertNonEmpty(lib, "itemNames");
}

assertUniqueIds();
