import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not found in .env file.");
    return;
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log("Your wallet address:", wallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});