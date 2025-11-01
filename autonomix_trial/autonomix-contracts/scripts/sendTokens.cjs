const { ethers } = require("hardhat");

async function main() {
  // 🔹 Get the first signer (the deployer)
  const [deployer] = await ethers.getSigners();

  // 🔹 Replace with your deployed AUTOX token contract address
  const tokenAddress = "0x693cf8cb08d57C19139C96D59e7DbC28460FD2A6";

  // Load the token contract
  const token = await ethers.getContractAt("AUTOXToken", tokenAddress, deployer);

  // 🔹 Add your validator wallet addresses here
  const validatorAddresses = [
    "0x65c0c5869b1a04c161f0f0c0fdf84fcbcee68ffb",
    "0x0dcdb3c99a8d04f64fecc1b4425b300b332be4c5", 
    "0x6bf0f6b674b74a59b2817144114ef7992e2da652", 
    "0x177aedca7a19b000bab640e88005619583e580c3", 
    "0xa775fe6e622a19c5cb6ce7d6637c625f78f4d670" 
  ];

  // 🔹 Amount of AUTOX tokens to send (e.g., 10 AUTOX each)
  const amount = ethers.parseEther("10");

  console.log(`🚀 Sending 10 AUTOX tokens to each validator...`);

  for (const addr of validatorAddresses) {
    const tx = await token.transfer(addr, amount);
    await tx.wait();
    console.log(`✅ Sent 10 AUTOX to ${addr}`);
  }

  console.log("🎉 All tokens sent successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
