const hre = require("hardhat");
require("dotenv").config();
const { ethers } = hre;
const DPoSArtifact = require("../artifacts/contracts/AutonomixDPoS.sol/AutonomixDPoS.json");
const TokenArtifact = require("../artifacts/contracts/AUTOXToken.sol/AUTOXToken.json");

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
  const dposAddress = "0xACA9492685809C431995e9591364165001A59583"; // your deployed contract
  const tokenAddress = "0x693cf8cb08d57C19139C96D59e7DbC28460FD2A6"; // replace this with deployed token address

  const DPoS = new ethers.Contract(dposAddress, DPoSArtifact.abi, provider);
  const AUTOX = new ethers.Contract(tokenAddress, TokenArtifact.abi, provider);

  const validatorKeys = [
    process.env.PRIVATE_KEY_1,
    process.env.PRIVATE_KEY_2,
    process.env.PRIVATE_KEY_3,
    process.env.PRIVATE_KEY_4,
    process.env.PRIVATE_KEY_5,
  ];

  const stakeAmount = ethers.parseEther("5");

  for (let i = 0; i < validatorKeys.length; i++) {
    const wallet = new ethers.Wallet(validatorKeys[i], provider);
    console.log(`\n🔹 Registering validator ${i + 1}: ${wallet.address}`);

    // Step 1: Approve DPoS to use tokens
    const tokenWithSigner = AUTOX.connect(wallet);
    const approveTx = await tokenWithSigner.approve(dposAddress, stakeAmount);
    await approveTx.wait();
    console.log(`✅ Approved ${ethers.formatEther(stakeAmount)} AUTOX tokens`);

    // Step 2: Stake tokens (each validator stakes for itself)
    const dposWithSigner = DPoS.connect(wallet);
    const tx = await dposWithSigner.stake(wallet.address, stakeAmount);
    await tx.wait();

    console.log(`✅ Validator ${wallet.address} staked successfully.`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exitCode = 1;
});
