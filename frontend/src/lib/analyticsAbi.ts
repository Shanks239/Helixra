// Minimal ABI for HelixraAnalytics — only the fragments the frontend uses.
// Source: artifacts/contracts/HelixraAnalytics.sol/HelixraAnalytics.json
export const analyticsAbi = [
  {
    type: "event",
    name: "BatchRecorded",
    anonymous: false,
    inputs: [
      { indexed: true, name: "distributionId", type: "bytes32" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "recipientCount", type: "uint64" },
      { indexed: false, name: "encTotalHandle", type: "bytes32" },
      { indexed: false, name: "encAverageHandle", type: "bytes32" },
    ],
  },
  {
    type: "event",
    name: "ClaimRecorded",
    anonymous: false,
    inputs: [
      { indexed: true, name: "distributionId", type: "bytes32" },
      { indexed: false, name: "newClaimedCount", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "recordBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encryptedAmounts", type: "bytes32[]" },
      { name: "inputProof", type: "bytes" },
      { name: "recipientCount", type: "uint64" },
      { name: "distributionId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getDistributionHealth",
    stateMutability: "view",
    inputs: [{ name: "distributionId", type: "bytes32" }],
    outputs: [
      { name: "recipientCount", type: "uint64" },
      { name: "claimedCount", type: "uint64" },
      { name: "completionBps", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "getDistributionAnalytics",
    stateMutability: "view",
    inputs: [{ name: "distributionId", type: "bytes32" }],
    outputs: [
      { name: "encTotal", type: "bytes32" },
      { name: "encAverage", type: "bytes32" },
      { name: "recipientCount", type: "uint64" },
      { name: "claimedCount", type: "uint64" },
    ],
  },
] as const
