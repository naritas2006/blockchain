const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper to move blockchain time forward
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("Autonomix DPoS System", function () {
  let owner, treasury, signers;
  let autoxToken, dposContract;

  beforeEach(async function () {
    [owner, treasury, ...signers] = await ethers.getSigners();

    // Deploy AUTOX token
    autoxToken = await ethers.deployContract("AUTOXToken", [
      ethers.parseEther("1000000"),
    ]);

    // Deploy DPoS contract (token + treasury)
    dposContract = await ethers.deployContract("AutonomixDPoS", [
      autoxToken.target,
      treasury.address,
    ]);

    // Stake setup
    const numValidators = Math.min(signers.length, 22);
    for (let i = 0; i < numValidators; i++) {
      const validator = signers[i];
      const stakeAmount = ethers.parseEther("2000");

      // Transfer AUTOX to validator
      await autoxToken.transfer(validator.address, stakeAmount);

      // Approve & Stake
      await autoxToken.connect(validator).approve(dposContract.target, stakeAmount);
      await dposContract.connect(validator).stake(validator.address, stakeAmount);
    }
  });

  // 🧩 TEST 1: Top 21 election
  it("should elect top 21 delegates based on total stake", async function () {
    for (let i = 0; i < 5; i++) {
      const validator = signers[i];
      const extraStake = ethers.parseEther((100 * (i + 1)).toString());

      // 💰 Give extra tokens before staking again
      await autoxToken.transfer(validator.address, extraStake);

      await autoxToken.connect(validator).approve(dposContract.target, extraStake);
      await dposContract.connect(validator).stake(validator.address, extraStake);
    }

    // 🕒 Get election period dynamically
    const electionPeriod = await dposContract.ELECTION_PERIOD_SECONDS();
    const period = Number(electionPeriod.toString());

    // ⏳ Move forward in time
    await ethers.provider.send("evm_increaseTime", [period]);
    await ethers.provider.send("evm_mine");

    await dposContract.connect(owner).electValidators();

    const currentValidators = await dposContract.getcurrentValidators();
    expect(currentValidators.length).to.be.at.most(21);

    // 🏆 Log top 3 validators with their stakes
    console.log("\n🏆 TOP 3 ELECTED VALIDATORS:");
    for (let i = 0; i < Math.min(3, currentValidators.length); i++) {
      const valAddr = currentValidators[i];
      const data = await dposContract.delegates(valAddr);
      console.log(
        `#${i + 1}: ${valAddr} — Total Stake: ${ethers.formatEther(data.totalStaked)} AUTOX`
      );
    }

    const topValidator = currentValidators[0];
    const delegateData = await dposContract.delegates(topValidator);
    expect(delegateData.totalStaked).to.be.gt(0n);
  });

  // 🧩 TEST 2: Unstaking behavior
  it("should allow users to unstake correctly", async function () {
    const validator = signers[1];
    const delegateDataBefore = await dposContract.delegates(validator.address);
    const unstakeAmount = ethers.parseEther("500");

    await dposContract.connect(validator).unstake(validator.address, unstakeAmount);

    const delegateDataAfter = await dposContract.delegates(validator.address);
    expect(delegateDataAfter.totalStaked).to.be.lt(delegateDataBefore.totalStaked);
  });

  // 🧩 TEST 3: Reward distribution
  it("should reward top delegates", async function () {
    // ⏳ Move forward time before election
 const electionPeriod = await dposContract.ELECTION_PERIOD_SECONDS();
await increaseTime(Number(electionPeriod.toString()));


    await dposContract.connect(owner).electValidators();

    const topValidators = await dposContract.getcurrentValidators();
    await dposContract.connect(owner).distributeRewards();

    const firstValidator = topValidators[0];
    const delegateData = await dposContract.delegates(firstValidator);

    // 🪙 Log reward amount for clarity
    console.log(
      `\n💰 Reward distributed to first validator (${firstValidator}):`,
      ethers.formatEther(delegateData.totalRewards),
      "AUTOX"
    );

    // ✅ Ensure rewards were distributed
    expect(delegateData.totalRewards).to.be.gt(0n);
  });
});
