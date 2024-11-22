import * as path from "path";
import * as fs from "fs";

import { getDateTimeString } from "./getDateTimeString";

export const writeOutLog = (log) => {
  const { yyyy, mm, dd, hh, mi, ss } = getDateTimeString();
  const logPath = path.join(
    __dirname,
    "..",
    "..",
    "log",
    `${yyyy}${mm}${dd}${hh}${mi}${ss}.json`
  );
  fs.appendFile(logPath, JSON.stringify(log), (err) => {
    if (err) {
      console.error(err);
      return false;
    } else {
      return true;
    }
  });
  // return result;
};
