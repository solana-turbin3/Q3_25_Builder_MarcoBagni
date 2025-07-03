import { PublicKey } from "@solana/web3.js";
import { Idl, Program } from "@coral-xyz/anchor";
import idlJson from "../idls/turbin3-idl.json";

export const IDL: any = idlJson;

export const PROGRAM_ID = new PublicKey(
  "TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM"
);
export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export type Turbin3Prereq = typeof IDL;
