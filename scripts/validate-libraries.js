const librariesList = require("../libraries.json");

const red = (str) => (process.env.CI ? `\x1b[31m${str}\x1b[0m` : str);

const assertNonEmpty = (lib, field) => {
  if (!lib[field]) {
    throw new Error(red(`"${lib.source}" doesn't have "${field}" field set.`));
  }
};

for (const lib of librariesList) {
  assertNonEmpty(lib, "name");
  assertNonEmpty(lib, "description");
  assertNonEmpty(lib, "version");
  assertNonEmpty(lib, "source");
  assertNonEmpty(lib, "preview");
  assertNonEmpty(lib, "created");
  assertNonEmpty(lib, "updated");
  assertNonEmpty(lib, "authors");
}
