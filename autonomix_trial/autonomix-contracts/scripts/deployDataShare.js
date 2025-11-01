import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  // 1️⃣ Get your DPoS contract address (the one you already deployed)
  const dposAddress = "0xACA9492685809C431995e9591364165001A59583"; // replace with your real DPoS address

  // 2️⃣ Deploy the DataShare contract, passing the DPoS address
  const DataShare = await ethers.getContractFactory("AutonomixDataSharing");
  const dataShare = await DataShare.deploy(dposAddress);
  await dataShare.waitForDeployment();

  console.log("AutonomixDataShare deployed to:", await dataShare.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
