import { readFile } from "fs/promises";

const lib = await JSON.parse(await readFile("./libraries.json"));

console.log(Object.values(lib).length);
