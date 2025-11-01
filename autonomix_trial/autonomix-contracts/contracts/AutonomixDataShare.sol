// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AutonomixDPoS.sol";

contract AutonomixDataSharing is Ownable {
    AutonomixDPoS public dposContract;

    struct DataBlock {
        address carAddress;
        string metadata;
        bytes32 dataHash;
        uint256 timestamp;
        bool verified;
    }

    mapping(bytes32 => DataBlock) public dataRecords;
    bytes32[] public allDataHashes;

    // 🔹 Validator management
    mapping(address => bool) public validators;
    address[] public validatorList;

    // 🔹 Events
    event ValidatorRegistered(address indexed validator);
    event DataUploaded(address indexed car, bytes32 indexed dataHash, string metadata);
    event DataValidated(bytes32 indexed dataHash, bool verified);
    event BlockCreated(uint256 indexed blockId, address indexed validator, bytes32 dataHash, uint256 timestamp);

    constructor(address _dposAddress) Ownable(msg.sender) {
        require(_dposAddress != address(0), "Invalid DPoS contract address");
        dposContract = AutonomixDPoS(_dposAddress);
    }

    // ✅ Register validator nodes
    function registerValidator(address _validator) public onlyOwner {
        require(!validators[_validator], "Already registered");
        validators[_validator] = true;
        validatorList.push(_validator);
        emit ValidatorRegistered(_validator);
    }

    // 🚗 Cars upload data
    function uploadData(string memory _metadata, bytes32 _dataHash) public {
        require(_dataHash != 0, "Invalid hash");
        require(dataRecords[_dataHash].timestamp == 0, "Data already uploaded");

        dataRecords[_dataHash] = DataBlock({
            carAddress: msg.sender,
            metadata: _metadata,
            dataHash: _dataHash,
            timestamp: block.timestamp,
            verified: false
        });

        allDataHashes.push(_dataHash);

        dposContract.submitData(_dataHash);
        emit DataUploaded(msg.sender, _dataHash, _metadata);
    }

    // ✅ Once validators confirm via DPoS verifyData(), mark verified here too
    function markDataVerified(bytes32 _dataHash, bool _verified) external onlyOwner {
        require(dataRecords[_dataHash].timestamp != 0, "Data not found");
        dataRecords[_dataHash].verified = _verified;

        // 🔹 Emit a simulated “block created” event when verified
        uint256 blockId = allDataHashes.length;
        emit BlockCreated(blockId, msg.sender, _dataHash, block.timestamp);

        emit DataValidated(_dataHash, _verified);
    }

    function getAllData() public view returns (DataBlock[] memory) {
        DataBlock[] memory result = new DataBlock[](allDataHashes.length);
        for (uint i = 0; i < allDataHashes.length; i++) {
            result[i] = dataRecords[allDataHashes[i]];
        }
        return result;
    }

    // Helper
    function getValidators() public view returns (address[] memory) {
        return validatorList;
    }
}
