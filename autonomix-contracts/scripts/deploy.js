import pkg from "hardhat";
const { ethers } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const validatorEnvPath = path.resolve(__dirname, "../../.env.validator");
  const validatorEnv = fs.readFileSync(validatorEnvPath, "utf8");
  const validatorKeys = validatorEnv.split('\n').filter(line => line.startsWith("PRIVATE_KEY_")).map(line => line.split('=')[1].trim());

  const AutoxToken = await ethers.getContractFactory("AUTOXToken");
  const autoxToken = await AutoxToken.deploy(ethers.parseEther("1000000")); // Deploy with initial supply
  await autoxToken.waitForDeployment();
  console.log("AUTOXToken deployed to:", await autoxToken.getAddress());

  const AutonomixDPoS = await ethers.getContractFactory("AutonomixDPoS");
  const dposContract = await AutonomixDPoS.deploy(await autoxToken.getAddress(), "0x0000000000000000000000000000000000000001"); // Deploy with AUTOXToken address and a dummy treasury address
  await dposContract.waitForDeployment();
  console.log("AutonomixDPoS deployed to:", await dposContract.getAddress());

  // Save contract addresses to a JSON file
  const contractAddresses = {
    AUTOXToken: await autoxToken.getAddress(),
    AutonomixDPoS: await dposContract.getAddress(),
  };
  const contractsDir = './contracts';
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  fs.writeFileSync(
    contractsDir + '/contractAddress.json',
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("Contract addresses saved to contractAddress.json");

  // Distribute tokens to validators
  const initialTokenSupply = ethers.parseEther("1000000");
  const tokensPerValidator = ethers.parseEther("100");

  // Mint tokens to the deployer first (if not already done by initial deployment)
  // This step might be redundant if the constructor already mints to deployer, but ensures deployer has tokens
  // await autoxToken.mint(deployer.address, initialTokenSupply);

  for (let i = 0; i < validatorKeys.length; i++) {
    const wallet = new ethers.Wallet(validatorKeys[i], ethers.provider);
    // Ensure the deployer has enough tokens to transfer
    await autoxToken.transfer(wallet.address, tokensPerValidator);
    console.log(`Transferred ${ethers.formatEther(tokensPerValidator)} AUTOX to validator ${wallet.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
