import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const AutoxToken = await ethers.getContractFactory("AUTOXToken");
  const autoxToken = await AutoxToken.deploy(ethers.parseEther("1000000")); // Deploy with initial supply
  await autoxToken.waitForDeployment();
  console.log("AUTOXToken deployed to:", await autoxToken.getAddress());

  const AutonomixDPoS = await ethers.getContractFactory("AutonomixDPoS");
  const dposContract = await AutonomixDPoS.deploy(await autoxToken.getAddress(), "0x0000000000000000000000000000000000000001"); // Deploy with AUTOXToken address and a dummy treasury address
  await dposContract.waitForDeployment();
  console.log("AutonomixDPoS deployed to:", await dposContract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
