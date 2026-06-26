// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title HelixraAnalytics
 * @notice FHE-native analytics for confidential token distributions.
 *
 * Caller passes externalEuint64 handles + inputProof from the SDK.
 * FHE.fromExternal() verifies the proof and grants the contract ACL
 * automatically — no manual allowTransient needed.
 *
 * Tracks per-distribution:
 *   - encTotal   : homomorphic sum of all amounts (FHE.add)
 *   - encAverage : encTotal / plaintext recipientCount (FHE.div scalar)
 *   - claimedCount / completionBps (plaintext)
 *
 * Only the distribution owner can decrypt analytics via userDecrypt.
 */
contract HelixraAnalytics is ZamaEthereumConfig {

    struct Distribution {
        euint64 encTotal;
        euint64 encAverage;
        uint64  recipientCount;
        uint64  claimedCount;
        bool    exists;
    }

    mapping(bytes32 => address)      public  distributionOwner;
    mapping(bytes32 => Distribution) private _distributions;
    mapping(address  => euint64)     private _globalTotal;
    mapping(address  => uint64)      public  globalRecipientCount;

    event BatchRecorded(
        bytes32 indexed distributionId,
        address indexed owner,
        uint64          recipientCount,
        bytes32         encTotalHandle,
        bytes32         encAverageHandle
    );

    event ClaimRecorded(
        bytes32 indexed distributionId,
        uint64          newClaimedCount
    );

    error AlreadyExists(bytes32 distributionId);
    error NotFound(bytes32 distributionId);
    error EmptyBatch();
    error ZeroRecipientCount();

    /**
     * @notice Record a completed disperse batch.
     * @param encryptedAmounts  externalEuint64 handles from SDK encrypt()
     * @param inputProof        Proof bytes from SDK encrypt()
     * @param recipientCount    Plaintext count — scalar divisor for average
     * @param distributionId    Unique ID, e.g. keccak256(abi.encodePacked(txHash, token))
     */
    function recordBatch(
        externalEuint64[] calldata encryptedAmounts,
        bytes             calldata inputProof,
        uint64                     recipientCount,
        bytes32                    distributionId
    ) external {
        if (encryptedAmounts.length == 0)          revert EmptyBatch();
        if (recipientCount == 0)                   revert ZeroRecipientCount();
        if (_distributions[distributionId].exists) revert AlreadyExists(distributionId);

        distributionOwner[distributionId] = msg.sender;

        // Verify proofs and accumulate encrypted total
        euint64 encTotal = FHE.asEuint64(0);
        for (uint256 i = 0; i < encryptedAmounts.length; i++) {
            // fromExternal verifies inputProof and grants contract ACL on the handle
            euint64 amount    = FHE.fromExternal(encryptedAmounts[i], inputProof);
            euint64 candidate = FHE.add(encTotal, amount);
            ebool   overflow  = FHE.lt(candidate, encTotal);
            encTotal = FHE.select(overflow, encTotal, candidate);
        }

        // Encrypted average via scalar division
        euint64 encAverage = FHE.div(encTotal, recipientCount);

        _distributions[distributionId] = Distribution({
            encTotal:       encTotal,
            encAverage:     encAverage,
            recipientCount: recipientCount,
            claimedCount:   0,
            exists:         true
        });

        FHE.allowThis(encTotal);
        FHE.allowThis(encAverage);
        FHE.allow(encTotal,   msg.sender);
        FHE.allow(encAverage, msg.sender);

        // Accumulate global total
        if (!FHE.isInitialized(_globalTotal[msg.sender])) {
            _globalTotal[msg.sender] = encTotal;
        } else {
            euint64 candidate = FHE.add(_globalTotal[msg.sender], encTotal);
            ebool   overflow  = FHE.lt(candidate, _globalTotal[msg.sender]);
            _globalTotal[msg.sender] = FHE.select(overflow, _globalTotal[msg.sender], candidate);
        }
        FHE.allowThis(_globalTotal[msg.sender]);
        FHE.allow(_globalTotal[msg.sender], msg.sender);

        globalRecipientCount[msg.sender] += recipientCount;

        emit BatchRecorded(
            distributionId,
            msg.sender,
            recipientCount,
            FHE.toBytes32(encTotal),
            FHE.toBytes32(encAverage)
        );
    }

    /**
     * @notice Increment claimed count. Anyone can call.
     */
    function recordClaim(bytes32 distributionId) external {
        Distribution storage d = _distributions[distributionId];
        if (!d.exists) revert NotFound(distributionId);
        if (d.claimedCount < d.recipientCount) {
            d.claimedCount++;
        }
        emit ClaimRecorded(distributionId, d.claimedCount);
    }

    function getDistributionAnalytics(bytes32 distributionId)
        external view
        returns (euint64 encTotal, euint64 encAverage, uint64 recipientCount, uint64 claimedCount)
    {
        Distribution storage d = _distributions[distributionId];
        if (!d.exists) revert NotFound(distributionId);
        return (d.encTotal, d.encAverage, d.recipientCount, d.claimedCount);
    }

    function getGlobalTotal(address owner)
        external view
        returns (euint64 encTotal, uint64 totalRecipients)
    {
        return (_globalTotal[owner], globalRecipientCount[owner]);
    }

    function getDistributionHealth(bytes32 distributionId)
        external view
        returns (uint64 recipientCount, uint64 claimedCount, uint64 completionBps)
    {
        Distribution storage d = _distributions[distributionId];
        if (!d.exists) revert NotFound(distributionId);
        uint64 bps = d.recipientCount > 0
            ? uint64((uint256(d.claimedCount) * 10_000) / d.recipientCount)
            : 0;
        return (d.recipientCount, d.claimedCount, bps);
    }

    function distributionExists(bytes32 distributionId) external view returns (bool) {
        return _distributions[distributionId].exists;
    }
}