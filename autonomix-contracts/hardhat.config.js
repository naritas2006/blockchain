import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

console.log("SEPOLIA_RPC:", process.env.ALCHEMY_API_URL);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Loaded" : "Missing");

export default {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      accounts: {
        count: 23,
      },
    },
  },
};
