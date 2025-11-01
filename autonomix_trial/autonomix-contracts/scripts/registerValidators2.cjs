const { ethers } = require("hardhat");

async function main() {
  // 🔹 Get deployer wallet
  const [deployer] = await ethers.getSigners();

  // 🔹 Replace with your deployed AutonomixDataSharing contract address
  const dataSharingAddress = "0xaa1AbEa9ADdfa8FC58e38afD704EAd0C972CEf9B";

  // Load the deployed contract
  const dataSharing = await ethers.getContractAt("AutonomixDataSharing", dataSharingAddress, deployer);

  // 🔹 List of validator addresses
  const validatorAddresses = [
    "0x65c0c5869b1a04c161f0f0c0fdf84fcbcee68ffb",
    "0x0dcdb3c99a8d04f64fecc1b4425b300b332be4c5",
    "0x6bf0f6b674b74a59b2817144114ef7992e2da652",
    "0x177aedca7a19b000bab640e88005619583e580c3",
    "0xa775fe6e622a19c5cb6ce7d6637c625f78f4d670"
  ];

  console.log("🚀 Registering validators on AutonomixDataSharing...");

  // 🔹 Register each validator (example: calling `registerValidator` or equivalent)
  for (const addr of validatorAddresses) {
    const tx = await dataSharing.registerValidator(addr); // <-- uses new function
    await tx.wait();
    console.log(`✅ Registered validator: ${addr}`);
  }

  console.log("🎉 All validators registered successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
