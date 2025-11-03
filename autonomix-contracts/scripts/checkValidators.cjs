const { ethers } = require("hardhat");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.validator') });

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Checking validators with the account:", deployer.address);

  const contractAddress = require(path.resolve(__dirname, '../../autonomix_trial/src/contracts/contractAddress.json'));
  const dposAddress = contractAddress.AutonomixDPoS;

  const AutonomixDPoS = await ethers.getContractFactory("AutonomixDPoS");
  const dpos = await AutonomixDPoS.attach(dposAddress);

  const currentValidators = await dpos.getcurrentValidators();
  console.log("Validators from contract:", currentValidators);

  if (currentValidators.length === 0) {
    console.log("No validators found on the contract.");
  } else {
    console.log(`Found ${currentValidators.length} validators:`);
    for (let i = 0; i < currentValidators.length; i++) {
      const validatorAddress = currentValidators[i];
      const validatorInfo = await dpos.getValidatorInfo(validatorAddress);
      console.log(`Validator ${i + 1}:`);
      console.log(`  Address: ${validatorAddress}`);
      console.log(`  Stake: ${ethers.formatEther(validatorInfo.stake)} AUTOX`);
      console.log(`  Is Active: ${validatorInfo.isActive}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });