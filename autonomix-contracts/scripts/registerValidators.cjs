const hre = require("hardhat");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.validator") });
const { ethers } = hre;

const DPoSArtifact = require("../artifacts/contracts/AutonomixDPoS.sol/AutonomixDPoS.json");
const TokenArtifact = require("../artifacts/contracts/AUTOXToken.sol/AUTOXToken.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
  const contractAddresses = require(path.resolve(__dirname, "../contracts/contractAddress.json"));
  const dposAddress = contractAddresses.AutonomixDPoS;
  const tokenAddress = contractAddresses.AUTOXToken;

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
    const stakeTx = await dposWithSigner.stake(wallet.address, stakeAmount);
    await stakeTx.wait();
    console.log(`✅ Validator ${wallet.address} staked successfully.`);
  }

    const dposWithDeployer = DPoS.connect(deployer);

    console.log("owner:", await DPoS.owner());

    console.log("\nChecking registered delegates' stake...");
    const regs = await DPoS.getRegisteredDelegates();
    for (const a of regs) {
        console.log(a, "staked:", (await DPoS.getDelegateTotalStaked(a)).toString());
    }

    console.log("\nChecking current validators before election:", (await DPoS.getCurrentValidators()).length);

    console.log("⚙️ Electing validators...");
    const electTx = await dposWithDeployer.electValidators();
    const receipt = await electTx.wait();
    console.log("Election transaction status:", receipt.status === 1 ? "Success" : "Reverted");
    console.log("Election transaction hash:", electTx.hash);
    console.log("✅ Validators elected successfully!");
    console.log("👥 Current validators after election:", (await DPoS.getCurrentValidators()).length);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exitCode = 1;
});
