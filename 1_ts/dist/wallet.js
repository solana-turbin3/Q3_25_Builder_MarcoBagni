import * as fs from "fs";
import { homedir } from "os";
//import * as os from "os";
//import * as path from "path";
const walletPath = `${homedir()}/.config/solana/d1x.json`; // alternative
//const walletPath = path.join(os.homedir(), ".config", "solana", "d1x.json");
const wallet = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
export default wallet;
