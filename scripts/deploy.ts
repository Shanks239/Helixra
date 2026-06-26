import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying HelixraAnalytics with:", deployer.address);

  const Factory = await ethers.getContractFactory("HelixraAnalytics");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HelixraAnalytics deployed to:", address);
  console.log("Save this — VITE_ANALYTICS_CONTRACT=", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});