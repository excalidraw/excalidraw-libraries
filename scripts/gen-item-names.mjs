import { readFile, writeFile } from "fs/promises";

const PATH_LIBRARIES = "./libraries.json";

const libraries = JSON.parse(await readFile(PATH_LIBRARIES, "utf8"));

for (const lib of libraries) {
  if (lib.version === 1) {
    continue;
  }

  const libraryData = JSON.parse(
    await readFile(`libraries/` + lib.source, "utf8"),
  );
  lib.itemNames = libraryData.libraryItems.reduce((acc, item) => {
    if (item.name) {
      acc.push(item.name);
    }
    return acc;
  }, []);
}

await writeFile(PATH_LIBRARIES, JSON.stringify(libraries, null, 2));
