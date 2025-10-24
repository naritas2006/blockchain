const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Autonomix DPoS Validator Election", function () {
  let autoxToken, dposContract;
  let treasury, signers;
  const ELECTION_PERIOD_SECONDS = 7 * 24 * 60 * 60; // 7 days
  const MAX_VALIDATORS = 21;
  
  beforeEach(async function () {
      [owner, treasury, ...signers] = await ethers.getSigners();
  
      // Deploy AUTOX token
    autoxToken = await ethers.deployContract("AUTOXToken", [ethers.parseEther("1000000")]);

    // Deploy DPoS contract
    dposContract = await ethers.deployContract("AutonomixDPoS", [autoxToken.target, treasury.address]);

    // Create 20 fake validator addresses and impersonate them
    const fakeValidators = [];
    for (let i = 0; i < 20; i++) {
        const wallet = ethers.Wallet.createRandom();
        fakeValidators.push(wallet.address);
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [wallet.address],
        });
        // Fund the impersonated account with some ETH for gas
        await network.provider.send("hardhat_setBalance", [
            wallet.address,
            "0x1000000000000000000", // 1 ETH
        ]);
        // Register the fake validator in the contract
        await dposContract.addTestValidator(wallet.address);
    }

    // Combine real signers with fake validators
    const allValidators = [...signers.slice(0, 2).map(s => s.address), ...fakeValidators]; // Use first 2 real signers' addresses and 20 fake ones

    // Distribute AUTOX tokens to all validators and approve the DPoS contract
    for (let i = 0; i < allValidators.length; i++) {
        const validatorAddress = allValidators[i];
        const stakeAmount = ethers.parseUnits("1000", "ether"); // Example stake amount

        await autoxToken.transfer(validatorAddress, stakeAmount);
        await autoxToken.connect(await ethers.getSigner(validatorAddress)).approve(dposContract.target, stakeAmount);
        await dposContract.connect(await ethers.getSigner(validatorAddress)).stake(validatorAddress, stakeAmount);
    }

    // Fund and approve all 22 validators (first 22 signers) with AUTOX tokens
    for (let i = 0; i < Math.min(signers.length, 22); i++) {
      const validator = signers[i];
  
      // Transfer AUTOX to validator
      await autoxToken.transfer(validator.address, ethers.parseEther("1000"));
  
      // Approve DPoS contract to spend AUTOX
      await autoxToken.connect(validator).approve(dposContract.target, ethers.parseEther("1000"));
  
      // Register and stake for validators
      const stakeAmount = ethers.parseEther((i + 1).toString()); // 1, 2, ..., 22
      await dposContract.connect(validator).stake(validator.address, stakeAmount);
    }
  });

  it("should elect top 21 delegates after election period", async function () {
    // Stake different amounts to each validator
    for (let i = 0; i < 22; i++) {
      const validator = signers[i];
      const stakeAmount = ethers.parseEther((i + 1).toString()); // 1, 2, ..., 22
      await dposContract.connect(validator).stake(validator.address, stakeAmount);
    }

    // Fast-forward 7 days (election period)
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    // Elect top validators
    // Fast forward time to trigger election
    await ethers.provider.send("evm_increaseTime", [ELECTION_PERIOD_SECONDS + 1]);
    await ethers.provider.send("evm_mine");

    await dposContract.electValidators();

    const electedValidators = await dposContract.getcurrentValidators();
    expect(electedValidators.length).to.equal(MAX_VALIDATORS);

    // Verify that the top 21 by stake are elected
    const stakes = await Promise.all(
      signers.slice(0, 22).map(v => dposContract.getDelegateTotalStaked(v.address))
    );

    // Sort by stake descending
    const sorted = stakes.map((s, idx) => ({ idx, s: s.toBigInt() })).sort((a, b) => Number(b.s - a.s));

    // Find indices of elected validators in original signers array
    const electedIndices = electedValidators.map(addr => signers.findIndex(s => s.address === addr));
    const expectedIndices = sorted.slice(0, 21).map(x => x.idx);

    expect(electedIndices.sort()).to.deep.equal(expectedIndices.sort());
  });
});
