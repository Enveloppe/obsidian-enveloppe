import { readFileSync, writeFileSync } from "fs";

// read minAppVersion from manifest.json and bump version to target version
let packageFile = JSON.parse(readFileSync("package.json", "utf8"));
console.log('Package version : ' + packageFile.version);
let manifest = JSON.parse(readFileSync("manifest-beta.json", "utf8"));
console.log('Manifest version : ' + manifest.version);
const targetVersion = packageFile.version;
manifest.version = targetVersion;
console.log('Updating manifest-beta with version : ' + manifest.version);
writeFileSync("manifest-beta.json", JSON.stringify(manifest, null, "\t"));
