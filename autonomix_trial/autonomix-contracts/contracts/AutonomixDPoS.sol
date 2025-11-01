// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AUTOXToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AutonomixDPoS is Ownable {
    AUTOXToken public autoxToken;

    uint256 public constant MAX_VALIDATORS = 21;
    uint256 public constant ELECTION_PERIOD_SECONDS = 7 days;

    struct Delegate {
        uint256 totalStaked;
        mapping(address => uint256) delegators;
        bool isValidator;
        uint256 totalRewards;
    }

    mapping(address => Delegate) public delegates;
    address[] public registeredDelegates;
    address[] public currentValidators;
    uint256 public lastElectionTime;

    // Reward distribution percentages
    uint256 public constant VALIDATOR_REWARD_PERCENTAGE = 70;
    uint256 public constant DELEGATOR_REWARD_PERCENTAGE = 20;
    uint256 public constant TREASURY_REWARD_PERCENTAGE = 10;
    address public treasuryAddress;

    // 🔹 NEW: Data verification system
    struct DataSubmission {
        address submitter;
        bytes32 dataHash;
        bool verified;
    }

    mapping(bytes32 => DataSubmission) public dataSubmissions;
    mapping(address => uint256) public reputation; // 🔹 NEW: Reputation system (0–1000 scale)

    event Staked(address indexed delegator, address indexed delegate, uint256 amount);
    event Unstaked(address indexed delegator, address indexed delegate, uint256 amount);
    event ValidatorsElected(address[] newValidators);
    event RewardsDistributed(uint256 totalReward, uint256 validatorShare, uint256 delegatorShare, uint256 treasuryShare);

    // 🔹 NEW events
    event DataSubmitted(address indexed submitter, bytes32 indexed dataHash);
    event DataVerified(bytes32 indexed dataHash, bool success);
    event ValidatorSlashed(address indexed validator, uint256 penalty);

    constructor(address _autoxTokenAddress, address _treasuryAddress) Ownable(msg.sender) {
        autoxToken = AUTOXToken(_autoxTokenAddress);
        treasuryAddress = _treasuryAddress;
        lastElectionTime = block.timestamp;
    }

    // -------------------------------------------
    // 🔸 STAKING FUNCTIONS (unchanged)
    // -------------------------------------------
    function stake(address _delegate, uint256 _amount) public {
        require(_amount > 0, "Stake amount must be greater than zero");
        require(autoxToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        if (delegates[_delegate].totalStaked == 0 && delegates[_delegate].delegators[msg.sender] == 0) {
            registeredDelegates.push(_delegate);
        }

        delegates[_delegate].totalStaked += _amount;
        delegates[_delegate].delegators[msg.sender] += _amount;

        emit Staked(msg.sender, _delegate, _amount);
    }

    function unstake(address _delegate, uint256 _amount) public {
        require(_amount > 0, "Unstake amount must be greater than zero");
        require(delegates[_delegate].delegators[msg.sender] >= _amount, "Insufficient staked amount");

        delegates[_delegate].totalStaked -= _amount;
        delegates[_delegate].delegators[msg.sender] -= _amount;
        require(autoxToken.transfer(msg.sender, _amount), "Token transfer failed");

        emit Unstaked(msg.sender, _delegate, _amount);

        if (delegates[_delegate].totalStaked == 0) {
            for (uint i = 0; i < registeredDelegates.length; i++) {
                if (registeredDelegates[i] == _delegate) {
                    registeredDelegates[i] = registeredDelegates[registeredDelegates.length - 1];
                    registeredDelegates.pop();
                    break;
                }
            }
        }
    }

    // -------------------------------------------
    // 🔸 VALIDATOR ELECTION (unchanged)
    // -------------------------------------------
    function electValidators() public onlyOwner {
        require(block.timestamp >= lastElectionTime + ELECTION_PERIOD_SECONDS, "Election period not over yet");

        for (uint i = 0; i < currentValidators.length; i++) {
            delegates[currentValidators[i]].isValidator = false;
        }
        currentValidators = new address[](0) ;

        address[] memory sortableDelegates = registeredDelegates;

        for (uint i = 0; i < sortableDelegates.length; i++) {
            for (uint j = i + 1; j < sortableDelegates.length; j++) {
                if (delegates[sortableDelegates[i]].totalStaked < delegates[sortableDelegates[j]].totalStaked) {
                    address temp = sortableDelegates[i];
                    sortableDelegates[i] = sortableDelegates[j];
                    sortableDelegates[j] = temp;
                }
            }
        }

        for (uint i = 0; i < sortableDelegates.length && currentValidators.length < MAX_VALIDATORS; i++) {
            currentValidators.push(sortableDelegates[i]);
            delegates[sortableDelegates[i]].isValidator = true;
        }

        lastElectionTime = block.timestamp;
        emit ValidatorsElected(currentValidators);
    }

    // -------------------------------------------
    // 🔸 REWARD DISTRIBUTION (unchanged)
    // -------------------------------------------
    function distributeRewards() public {
        uint256 _totalReward = autoxToken.balanceOf(address(this)) / 10; // 10% of balance
        require(_totalReward > 0, "No rewards to distribute");

        uint256 validatorShare = (_totalReward * VALIDATOR_REWARD_PERCENTAGE) / 100;
        uint256 delegatorShare = (_totalReward * DELEGATOR_REWARD_PERCENTAGE) / 100;
        uint256 treasuryShare = (_totalReward * TREASURY_REWARD_PERCENTAGE) / 100;

        require(autoxToken.transfer(treasuryAddress, treasuryShare), "Treasury transfer failed");

        uint256 totalStakedByValidators = 0;
        for (uint i = 0; i < currentValidators.length; i++) {
            totalStakedByValidators += delegates[currentValidators[i]].totalStaked;
        }

        for (uint i = 0; i < currentValidators.length; i++) {
            address validator = currentValidators[i];
            uint256 validatorStake = delegates[validator].totalStaked;

            uint256 valReward = (validatorShare * validatorStake) / totalStakedByValidators;
            uint256 delReward = (delegatorShare * validatorStake) / totalStakedByValidators;
            require(autoxToken.transfer(validator, valReward + delReward), "Reward transfer failed");
            delegates[validator].totalRewards += valReward + delReward;
        }

        emit RewardsDistributed(_totalReward, validatorShare, delegatorShare, treasuryShare);
    }

    // -------------------------------------------
    // 🔹 NEW MODULES BELOW
    // -------------------------------------------

    // 🔸 Data submission — called automatically by AutonomixDataSharing.sol
    function submitData(bytes32 _dataHash) public {
        require(_dataHash != 0, "Invalid data hash");
        dataSubmissions[_dataHash] = DataSubmission(msg.sender, _dataHash, false);
        emit DataSubmitted(msg.sender, _dataHash);
    }

    // 🔸 Data verification — validators confirm authenticity
    function verifyData(bytes32 _dataHash, bool _valid) public {
        require(delegates[msg.sender].isValidator, "Only validator can verify");
        require(dataSubmissions[_dataHash].submitter != address(0), "Data not found");
        require(!dataSubmissions[_dataHash].verified, "Already verified");

        dataSubmissions[_dataHash].verified = true;

        if (_valid) {
            updateReputation(msg.sender, true);
        } else {
            updateReputation(msg.sender, false);
            slashValidator(msg.sender, delegates[msg.sender].totalStaked / 10); // 10% slash
        }

        emit DataVerified(_dataHash, _valid);
    }

    // 🔸 Reputation management
    function updateReputation(address _validator, bool _positive) internal {
        if (_positive) {
            reputation[_validator] += 10;
            if (reputation[_validator] > 1000) reputation[_validator] = 1000;
        } else {
            if (reputation[_validator] >= 20) {
                reputation[_validator] -= 20;
            } else {
                reputation[_validator] = 0;
            }
        }
    }

    // 🔸 Slashing mechanism
    function slashValidator(address _validator, uint256 _penalty) public onlyOwner {
        require(delegates[_validator].totalStaked >= _penalty, "Insufficient stake to slash");
        delegates[_validator].totalStaked -= _penalty;
        require(autoxToken.transfer(treasuryAddress, _penalty), "Slash transfer failed");
        if (reputation[_validator] >= 50) reputation[_validator] -= 50;
        emit ValidatorSlashed(_validator, _penalty);
    }

    // -------------------------------------------
    // 🔸 HELPER FUNCTIONS (unchanged)
    // -------------------------------------------
    function getDelegatorStake(address _delegate, address _delegator) public view returns (uint256) {
        return delegates[_delegate].delegators[_delegator];
    }

    function getDelegateTotalStaked(address _delegate) public view returns (uint256) {
        return delegates[_delegate].totalStaked;
    }

    function isCurrentValidator(address _addr) public view returns (bool) {
        for (uint256 i = 0; i < currentValidators.length; i++) {
            if (currentValidators[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function getcurrentValidators() public view returns (address[] memory) {
        return currentValidators;
    }

    function addTestValidator(address _validatorAddress) public onlyOwner {
        require(_validatorAddress != address(0), "Invalid address");
        if (delegates[_validatorAddress].totalStaked == 0) {
            registeredDelegates.push(_validatorAddress);
        }
        delegates[_validatorAddress].isValidator = true;
    }
}
