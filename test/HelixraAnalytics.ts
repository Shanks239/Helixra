import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";

describe("HelixraAnalytics", function () {
  let analytics: any;
  let owner: any;

  const DIST_1 = ethers.keccak256(ethers.toUtf8Bytes("dist-1"));
  const DIST_2 = ethers.keccak256(ethers.toUtf8Bytes("dist-2"));

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("HelixraAnalytics");
    analytics = await Factory.deploy();
    await analytics.waitForDeployment();
  });

  // Encrypt multiple amounts in one input — single shared proof
  async function encryptAmounts(amounts: bigint[]) {
    const addr = await analytics.getAddress();
    const input = hre.fhevm.createEncryptedInput(addr, owner.address);
    for (const amt of amounts) {
      input.add64(amt);
    }
    const { handles, inputProof } = await input.encrypt();
    return { handles, inputProof };
  }

  it("records a batch and emits BatchRecorded", async function () {
    const { handles, inputProof } = await encryptAmounts([1000n, 2000n, 3000n]);
    const tx = await analytics
      .connect(owner)
      .recordBatch(handles, inputProof, 3, DIST_1);
    const receipt = await tx.wait();
    const event = receipt.logs.find((l: any) => l.fragment?.name === "BatchRecorded");
    expect(event).to.not.be.undefined;
    expect(event.args.recipientCount).to.equal(3n);
    expect(event.args.owner).to.equal(owner.address);
  });

  it("getDistributionHealth returns correct initial state", async function () {
    const { handles, inputProof } = await encryptAmounts([500n, 1500n]);
    await analytics.connect(owner).recordBatch(handles, inputProof, 2, DIST_1);
    const [recipientCount, claimedCount, completionBps] =
      await analytics.getDistributionHealth(DIST_1);
    expect(recipientCount).to.equal(2n);
    expect(claimedCount).to.equal(0n);
    expect(completionBps).to.equal(0n);
  });

  it("recordClaim increments count and updates completionBps", async function () {
    const { handles, inputProof } = await encryptAmounts([1000n, 1000n]);
    await analytics.connect(owner).recordBatch(handles, inputProof, 2, DIST_1);
    await analytics.recordClaim(DIST_1);
    const [, claimedCount, completionBps] =
      await analytics.getDistributionHealth(DIST_1);
    expect(claimedCount).to.equal(1n);
    expect(completionBps).to.equal(5000n);
  });

  it("reverts on duplicate distributionId", async function () {
    const { handles: h1, inputProof: p1 } = await encryptAmounts([1000n]);
    await analytics.connect(owner).recordBatch(h1, p1, 1, DIST_1);
    const { handles: h2, inputProof: p2 } = await encryptAmounts([500n]);
    await expect(
      analytics.connect(owner).recordBatch(h2, p2, 1, DIST_1)
    ).to.be.revertedWithCustomError(analytics, "AlreadyExists");
  });

  it("reverts on empty batch", async function () {
    const { inputProof } = await encryptAmounts([1000n]);
    await expect(
      analytics.connect(owner).recordBatch([], inputProof, 1, DIST_1)
    ).to.be.revertedWithCustomError(analytics, "EmptyBatch");
  });

  it("reverts on zero recipientCount", async function () {
    const { handles, inputProof } = await encryptAmounts([1000n]);
    await expect(
      analytics.connect(owner).recordBatch(handles, inputProof, 0, DIST_1)
    ).to.be.revertedWithCustomError(analytics, "ZeroRecipientCount");
  });

  it("accumulates globalRecipientCount across distributions", async function () {
    const { handles: h1, inputProof: p1 } = await encryptAmounts([1000n]);
    await analytics.connect(owner).recordBatch(h1, p1, 1, DIST_1);
    const { handles: h2, inputProof: p2 } = await encryptAmounts([2000n]);
    await analytics.connect(owner).recordBatch(h2, p2, 1, DIST_2);
    const count = await analytics.globalRecipientCount(owner.address);
    expect(count).to.equal(2n);
  });

  it("distributionExists returns correct state", async function () {
    expect(await analytics.distributionExists(DIST_1)).to.be.false;
    const { handles, inputProof } = await encryptAmounts([1000n]);
    await analytics.connect(owner).recordBatch(handles, inputProof, 1, DIST_1);
    expect(await analytics.distributionExists(DIST_1)).to.be.true;
  });
});