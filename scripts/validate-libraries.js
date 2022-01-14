const librariesList = require("../libraries.json");

const red = (str) => (process.env.CI ? `\x1b[31m${str}\x1b[0m` : str);

for (const lib of librariesList) {
  if (!lib.version) {
    throw new Error(red(`"${lib.source}" doesn't have "version" field set.`));
  }
}
