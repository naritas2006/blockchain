const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const address = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  const VehicleEventLogger = await hre.ethers.getContractFactory("VehicleEventLogger");
  const contract = VehicleEventLogger.attach(address);

  // ✅ Success: log an event
  let tx = await contract.logEvent("CAR123", "CollisionDetected", "QmHash123");
  await tx.wait();
  console.log("✅ Event logged successfully");

  // ✅ Read back the first event
  const event0 = await contract.getEvent(0);
  console.log("Event[0]:", event0);

  // ❌ Failure: invalid index
  try {
    await contract.getEvent(99);
  } catch (err) {
    console.log("❌ Failed: Event does not exist");
  }

  // ✅ Check counter
  const count = await contract.totalEvents();
  console.log("Total events:", count.toString());
}

main();
