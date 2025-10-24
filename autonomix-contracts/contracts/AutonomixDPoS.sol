// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AUTOXToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AutonomixDPoS is Ownable {
    AUTOXToken public autoxToken;

    uint256 public constant MAX_VALIDATORS = 21;
    uint256 public constant ELECTION_PERIOD_SECONDS = 7 days; // Weekly elections

    struct Delegate {
        uint256 totalStaked;
        mapping(address => uint256) delegators;
        bool isValidator;
    }

    mapping(address => Delegate) public delegates;
    address[] public registeredDelegates; // New: To keep track of all delegates
    address[] public currentValidators;
    uint256 public lastElectionTime;

    // Reward distribution percentages
    uint256 public constant VALIDATOR_REWARD_PERCENTAGE = 70;
    uint256 public constant DELEGATOR_REWARD_PERCENTAGE = 20;
    uint256 public constant TREASURY_REWARD_PERCENTAGE = 10;

    address public treasuryAddress;

    event Staked(address indexed delegator, address indexed delegate, uint256 amount);
    event Unstaked(address indexed delegator, address indexed delegate, uint256 amount);
    event ValidatorsElected(address[] newValidators);
    event RewardsDistributed(uint256 totalReward, uint256 validatorShare, uint256 delegatorShare, uint256 treasuryShare);

    constructor(address _autoxTokenAddress, address _treasuryAddress) Ownable(msg.sender) {
        autoxToken = AUTOXToken(_autoxTokenAddress);
        treasuryAddress = _treasuryAddress;
        lastElectionTime = block.timestamp;
    }

    // Function to allow users to stake AUTOX tokens to a delegate
    function stake(address _delegate, uint256 _amount) public {
        require(_amount > 0, "Stake amount must be greater than zero");
        require(autoxToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        if (delegates[_delegate].totalStaked == 0 && delegates[_delegate].delegators[msg.sender] == 0) {
            registeredDelegates.push(_delegate); // Add delegate to list if they are new
        }

        delegates[_delegate].totalStaked += _amount;
        delegates[_delegate].delegators[msg.sender] += _amount;

        emit Staked(msg.sender, _delegate, _amount);
    }

    // Function to allow users to unstake AUTOX tokens from a delegate
    function unstake(address _delegate, uint256 _amount) public {
        require(_amount > 0, "Unstake amount must be greater than zero");
        require(delegates[_delegate].delegators[msg.sender] >= _amount, "Insufficient staked amount");

        delegates[_delegate].totalStaked -= _amount;
        delegates[_delegate].delegators[msg.sender] -= _amount;
        require(autoxToken.transfer(msg.sender, _amount), "Token transfer failed");

        emit Unstaked(msg.sender, _delegate, _amount);

        if (delegates[_delegate].totalStaked == 0) {
            // Remove delegate from registeredDelegates if they have no stake left
            for (uint i = 0; i < registeredDelegates.length; i++) {
                if (registeredDelegates[i] == _delegate) {
                    registeredDelegates[i] = registeredDelegates[registeredDelegates.length - 1];
                    registeredDelegates.pop();
                    break;
                }
            }
        }
    }

    // Function to elect new validators (only callable by owner or a designated election caller)
    function electValidators() public onlyOwner {
        require(block.timestamp >= lastElectionTime + ELECTION_PERIOD_SECONDS, "Election period not over yet");

        // Clear previous validators
        for (uint i = 0; i < currentValidators.length; i++) {
            delegates[currentValidators[i]].isValidator = false;
        }
        currentValidators = new address[](0);

        // Create a temporary array of active delegates for sorting
        address[] memory activeDelegates = new address[](registeredDelegates.length);
        uint activeCount = 0;
        for (uint i = 0; i < registeredDelegates.length; i++) {
            if (delegates[registeredDelegates[i]].totalStaked > 0) {
                activeDelegates[activeCount] = registeredDelegates[i];
                activeCount++;
            }
        }

        // Resize activeDelegates to actual count
        address[] memory sortableDelegates = new address[](activeCount);
        for (uint i = 0; i < activeCount; i++) {
            sortableDelegates[i] = activeDelegates[i];
        }

        // Sort delegates by totalStaked in descending order (Bubble Sort for simplicity)
        for (uint i = 0; i < sortableDelegates.length; i++) {
            for (uint j = i + 1; j < sortableDelegates.length; j++) {
                if (delegates[sortableDelegates[i]].totalStaked < delegates[sortableDelegates[j]].totalStaked) {
                    address temp = sortableDelegates[i];
                    sortableDelegates[i] = sortableDelegates[j];
                    sortableDelegates[j] = temp;
                }
            }
        }

        // Select top MAX_VALIDATORS
        for (uint i = 0; i < sortableDelegates.length && currentValidators.length < MAX_VALIDATORS; i++) {
            currentValidators.push(sortableDelegates[i]);
            delegates[sortableDelegates[i]].isValidator = true;
        }

        lastElectionTime = block.timestamp;
        emit ValidatorsElected(currentValidators);
    }

    // Function to distribute rewards (can be called by anyone, but rewards come from contract balance)
    function distributeRewards(uint256 _totalReward) public {
        require(_totalReward > 0, "Reward amount must be greater than zero");
        require(autoxToken.balanceOf(address(this)) >= _totalReward, "Insufficient contract balance for rewards");

        uint256 validatorShare = (_totalReward * VALIDATOR_REWARD_PERCENTAGE) / 100;
        uint256 delegatorShare = (_totalReward * DELEGATOR_REWARD_PERCENTAGE) / 100;
        uint256 treasuryShare = (_totalReward * TREASURY_REWARD_PERCENTAGE) / 100;

        // Distribute to treasury
        require(autoxToken.transfer(treasuryAddress, treasuryShare), "Treasury reward transfer failed");

        // Distribute to validators and delegators
        uint256 totalStakedByValidators = 0;
        for (uint i = 0; i < currentValidators.length; i++) {
            totalStakedByValidators += delegates[currentValidators[i]].totalStaked;
        }

        for (uint i = 0; i < currentValidators.length; i++) {
            address validator = currentValidators[i];
            uint256 validatorStake = delegates[validator].totalStaked;

            // Calculate validator's share of the validator rewards
            uint256 individualValidatorReward = (validatorShare * validatorStake) / totalStakedByValidators;
            require(autoxToken.transfer(validator, individualValidatorReward), "Validator reward transfer failed");

            // Distribute delegator rewards for this validator
            // This part is more complex as we need to iterate through all delegators for each validator
            // For simplicity in this example, we'll assume a direct distribution to the validator
            // A more robust solution would involve a separate claim mechanism for delegators
            // For now, we'll just add the delegator share to the validator's balance to be claimed later or distributed off-chain
            // In a real DPoS, delegators would claim their rewards directly or through a separate function.
            // For this implementation, we'll transfer the delegator share to the validator, who is then responsible for distributing it.
            uint256 delegatorRewardForThisValidator = (delegatorShare * validatorStake) / totalStakedByValidators;
            require(autoxToken.transfer(validator, delegatorRewardForThisValidator), "Delegator reward transfer to validator failed");
        }

        emit RewardsDistributed(_totalReward, validatorShare, delegatorShare, treasuryShare);
    }

    // Helper function to get a delegate's staked amount by a specific delegator
    function getDelegatorStake(address _delegate, address _delegator) public view returns (uint256) {
        return delegates[_delegate].delegators[_delegator];
    }

    // Helper function to get a delegate's total staked amount
    function getDelegateTotalStaked(address _delegate) public view returns (uint256) {
        return delegates[_delegate].totalStaked;
    }

    // Helper function to check if an address is a current validator
    function isCurrentValidator(address _addr) public view returns (bool) {
        for (uint256 i = 0; i < currentValidators.length; i++) {
            if (currentValidators[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    // Helper function to get the entire currentValidators array
    function getcurrentValidators() public view returns (address[] memory) {
        return currentValidators;
    }

    // Function to add a validator for testing purposes
    function addTestValidator(address _validatorAddress) public onlyOwner {
        require(_validatorAddress != address(0), "Invalid address");
        require(delegates[_validatorAddress].totalStaked == 0, "Validator already has stake");

        if (delegates[_validatorAddress].totalStaked == 0 && delegates[_validatorAddress].delegators[_validatorAddress] == 0) {
            registeredDelegates.push(_validatorAddress);
        }
        delegates[_validatorAddress].isValidator = true;
    }
}