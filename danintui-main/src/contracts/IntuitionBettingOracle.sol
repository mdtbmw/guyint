// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IntuitionBettingOracle is Ownable, EIP712, Pausable, ReentrancyGuard {
    enum EventStatus { Open, Closed, Finished, Canceled }
    enum Outcome { None, YES, NO }

    struct EventData {
        uint256 id;
        string question;
        string description;
        string category;
        string imageUrl;
        uint256 bettingStopDate;
        uint256 resolutionDate;
        uint256 minStake;
        uint256 maxStake;
        uint256 yesPool;
        uint256 noPool;
        EventStatus status;
        Outcome winningOutcome;
    }

     struct OracleEvent {
        string question;
        string description;
        string category;
        string imageUrl;
        uint256 bettingStopDate;
        uint256 resolutionDate;
        uint256 minStake;
        uint256 maxStake;
    }

    struct Bet {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
    }

    uint256 public nextEventId = 1;
    mapping(uint256 => EventData) public events;
    mapping(uint256 => mapping(address => Bet)) public userBets;
    mapping(address => bool) public isOracleSigner;

    address public treasury;
    uint256 public platformFeeBps; // Basis points, e.g., 300 for 3%

    event EventCreated(
        uint256 id,
        string question,
        string description,
        string category,
        string imageUrl,
        uint256 bettingStopDate,
        uint256 resolutionDate,
        uint256 minStake,
        uint256 maxStake
    );
    event BetPlaced(uint256 indexed eventId, address indexed user, bool outcome, uint256 amount);
    event EventResolved(uint256 indexed eventId, Outcome winningOutcome);
    event EventCanceled(uint256 indexed eventId);
    event WinningsClaimed(uint256 indexed eventId, address indexed user, uint256 amount);
    event OracleSignerChanged(address indexed signer, bool isAllowed);

    constructor(address _initialOwner, address _treasury, uint256 _platformFeeBps) Ownable(_initialOwner) EIP712("IntuitionBettingOracle", "1") {
        treasury = _treasury;
        platformFeeBps = _platformFeeBps;
        isOracleSigner[_initialOwner] = true;
    }

    function createEventFromOracle(OracleEvent calldata ev, bytes calldata signature) external whenNotPaused nonReentrant {
        address signer = _recoverSigner(keccak256(abi.encode(ev)), signature);
        require(isOracleSigner[signer], "Invalid oracle signature");

        _createEvent(ev.question, ev.description, ev.category, ev.imageUrl, ev.bettingStopDate, ev.resolutionDate, ev.minStake, ev.maxStake);
    }
    
    function createEvent(
        string calldata q,
        string calldata desc,
        string calldata cat,
        string calldata img,
        uint256 bettingStop,
        uint256 resolution,
        uint256 minStake,
        uint256 maxStake
    ) external onlyOwner whenNotPaused nonReentrant returns (uint256) {
        return _createEvent(q, desc, cat, img, bettingStop, resolution, minStake, maxStake);
    }

    function _createEvent(
        string memory q,
        string memory desc,
        string memory cat,
        string memory img,
        uint256 bettingStop,
        uint256 resolution,
        uint256 minStake,
        uint256 maxStake
    ) internal returns (uint256) {
        require(bytes(q).length > 0, "Question cannot be empty");
        require(bettingStop > block.timestamp, "Betting stop date must be in the future");
        require(resolution > bettingStop, "Resolution date must be after betting stop date");
        require(maxStake > minStake, "Max stake must be greater than min stake");

        uint256 id = nextEventId++;
        
        events[id] = EventData({
            id: id,
            question: q,
            description: desc,
            category: cat,
            imageUrl: img,
            bettingStopDate: bettingStop,
            resolutionDate: resolution,
            minStake: minStake,
            maxStake: maxStake,
            yesPool: 0,
            noPool: 0,
            status: EventStatus.Open,
            winningOutcome: Outcome.None
        });

        emit EventCreated(id, q, desc, cat, img, bettingStop, resolution, minStake, maxStake);
        return id;
    }


    function _recoverSigner(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        return ECDSA.recover(digest, signature);
    }


    function placeBet(uint256 id, bool outcome) external payable whenNotPaused nonReentrant {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open, "Event not open for betting");
        require(block.timestamp < eventData.bettingStopDate, "Betting has closed");
        require(msg.value >= eventData.minStake, "Stake is below minimum");
        require(msg.value <= eventData.maxStake, "Stake is above maximum");

        Bet storage bet = userBets[id][msg.sender];
        if (outcome) {
            eventData.yesPool += msg.value;
            bet.yesAmount += msg.value;
        } else {
            eventData.noPool += msg.value;
            bet.noAmount += msg.value;
        }

        emit BetPlaced(id, msg.sender, outcome, msg.value);
    }

    function resolveEvent(uint256 id, bool yesWins) external onlyOwner whenNotPaused nonReentrant {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open || eventData.status == EventStatus.Closed, "Event already resolved or canceled");
        // Optional: require(block.timestamp > eventData.resolutionDate, "Too early to resolve");

        eventData.status = EventStatus.Finished;
        eventData.winningOutcome = yesWins ? Outcome.YES : Outcome.NO;
        emit EventResolved(id, eventData.winningOutcome);
    }

    function cancelEvent(uint256 id) external onlyOwner whenNotPaused nonReentrant {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open, "Event must be open to be canceled");
        eventData.status = EventStatus.Canceled;
        emit EventCanceled(id);
    }

    function claim(uint256 id) external nonReentrant {
        EventData storage eventData = events[id];
        Bet storage bet = userBets[id][msg.sender];
        require(!bet.claimed, "Winnings already claimed");
        require(eventData.status == EventStatus.Finished || eventData.status == EventStatus.Canceled, "Event not yet finalized");
        
        uint256 payout = 0;
        if (eventData.status == EventStatus.Finished) {
            uint256 totalPool = eventData.yesPool + eventData.noPool;
            if (eventData.winningOutcome == Outcome.YES && bet.yesAmount > 0) {
                payout = (totalPool * bet.yesAmount) / eventData.yesPool;
            } else if (eventData.winningOutcome == Outcome.NO && bet.noAmount > 0) {
                payout = (totalPool * bet.noAmount) / eventData.noPool;
            }
        } else { // Canceled
            payout = bet.yesAmount + bet.noAmount;
        }

        require(payout > 0, "No winnings to claim");
        
        uint256 fee = (payout * platformFeeBps) / 10000;
        uint256 userPayout = payout - fee;

        bet.claimed = true;
        
        if (fee > 0) {
            (bool success, ) = treasury.call{value: fee}("");
            require(success, "Failed to send fee to treasury");
        }
        (bool success, ) = msg.sender.call{value: userPayout}("");
        require(success, "Failed to send winnings");

        emit WinningsClaimed(id, msg.sender, userPayout);
    }

    // --- Admin Functions ---

    function setTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
    }

    function setPlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "Fee cannot exceed 10%");
        platformFeeBps = _newFeeBps;
    }

    function setOracleSigner(address signer, bool allowed) external onlyOwner {
        isOracleSigner[signer] = allowed;
        emit OracleSignerChanged(signer, allowed);
    }
    
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- View Functions ---

    function getEvent(uint256 id) external view returns (EventData memory) {
        return events[id];
    }
    
    function getUserBet(uint256 eventId, address user) external view returns (Bet memory) {
        return userBets[eventId][user];
    }

    function getMultipleUserBets(uint256[] calldata eventIds, address user) external view returns (Bet[] memory) {
        Bet[] memory bets = new Bet[](eventIds.length);
        for (uint i = 0; i < eventIds.length; i++) {
            bets[i] = userBets[eventIds[i]][user];
        }
        return bets;
    }

    function getAllEventIds() external view returns (uint256[] memory) {
        uint256 count = nextEventId > 0 ? nextEventId - 1 : 0;
        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = i + 1;
        }
        return ids;
    }
}