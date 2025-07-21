import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { setAuthority, AuthorityType } from "@solana/spl-token";
import wallet from "../wallet.ts";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const mint = new PublicKey("9DQhaRJtV1zR5B4Y97khTWMu8WbJZYAL7tKJkT7pQPcC");
const newAuthority = new PublicKey(
  "d1x4XoJobBcJAzWoNK2p5AB4aYkmnibdifkReiQi8rT"
);

(async () => {
  try {
    const tx = await setAuthority(
      connection,
      keypair, // must be the current mint authority (PDA, so this will fail unless run from the program)
      mint,
      keypair.publicKey,
      AuthorityType.MintTokens,
      newAuthority
    );
    console.log("✅ Mint authority transferred! TX:", tx);
  } catch (e) {
    console.error("❌ Failed to transfer mint authority:", e);
  }
})();
