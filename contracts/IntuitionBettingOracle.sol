// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract IntuitionBettingOracle is Ownable, ReentrancyGuard {
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

    struct Bet {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
    }
    
    enum EventStatus { Open, Closed, Finished, Canceled }
    enum Outcome { None, YES, NO }

    uint256 public nextEventId;
    mapping(uint256 => EventData) public events;
    mapping(uint256 => mapping(address => Bet)) public userBets;

    address public treasury;
    uint256 public platformFeeBps; // Basis points, e.g., 300 for 3%

    event EventCreated(
        uint256 indexed id,
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

    constructor(address _initialOwner, address _treasury, uint256 _platformFeeBps) Ownable(_initialOwner) {
        treasury = _treasury;
        platformFeeBps = _platformFeeBps;
        nextEventId = 1; // Start with ID 1
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
    ) internal {
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
    }
    
    function createEvent(
        string memory q,
        string memory desc,
        string memory cat,
        string memory img,
        uint256 bettingStop,
        uint256 resolution,
        uint256 minStake,
        uint256 maxStake
    ) public onlyOwner {
        _createEvent(q, desc, cat, img, bettingStop, resolution, minStake, maxStake);
    }

    function placeBet(uint256 id, bool outcome) public payable nonReentrant {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open, "Betting is not open");
        require(block.timestamp < eventData.bettingStopDate, "Betting has closed");
        require(msg.value >= eventData.minStake, "Stake is below minimum");
        require(msg.value <= eventData.maxStake, "Stake is above maximum");

        Bet storage betInfo = userBets[id][msg.sender];
        if (outcome) { // Betting on YES
            betInfo.yesAmount += msg.value;
            eventData.yesPool += msg.value;
        } else { // Betting on NO
            betInfo.noAmount += msg.value;
            eventData.noPool += msg.value;
        }

        emit BetPlaced(id, msg.sender, outcome, msg.value);
    }

    function resolveEvent(uint256 id, bool yesWins) public onlyOwner {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open || eventData.status == EventStatus.Closed, "Event cannot be resolved");
        eventData.status = EventStatus.Finished;
        eventData.winningOutcome = yesWins ? Outcome.YES : Outcome.NO;
        emit EventResolved(id, eventData.winningOutcome);
    }

    function cancelEvent(uint256 id) public onlyOwner {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open, "Can only cancel open events");
        eventData.status = EventStatus.Canceled;
        emit EventCanceled(id);
    }

    function claim(uint256 id) public nonReentrant {
        EventData storage eventData = events[id];
        Bet storage betInfo = userBets[id][msg.sender];
        require(!betInfo.claimed, "Winnings already claimed");

        uint256 payout = 0;
        if (eventData.status == EventStatus.Finished) {
            uint256 totalPool = eventData.yesPool + eventData.noPool;
            if (eventData.winningOutcome == Outcome.YES && betInfo.yesAmount > 0) {
                payout = (betInfo.yesAmount * totalPool) / eventData.yesPool;
            } else if (eventData.winningOutcome == Outcome.NO && betInfo.noAmount > 0) {
                payout = (betInfo.noAmount * totalPool) / eventData.noPool;
            }
        } else if (eventData.status == EventStatus.Canceled) {
            payout = betInfo.yesAmount + betInfo.noAmount;
        }

        require(payout > 0, "No winnings to claim");
        betInfo.claimed = true;
        
        uint256 fee = 0;
        // only charge fee on winnings, not on refunds
        if (eventData.status == EventStatus.Finished) {
           fee = (payout * platformFeeBps) / 10000;
           payable(treasury).transfer(fee);
        }
        
        payable(msg.sender).transfer(payout - fee);
        emit WinningsClaimed(id, msg.sender, payout - fee);
    }

    // ===== Read-only functions =====
    function getEvent(uint256 id) public view returns (EventData memory) {
        return events[id];
    }
    
    function getUserBet(uint256 eventId, address user) public view returns (Bet memory) {
        return userBets[eventId][user];
    }

    function getAllEventIds() public view returns (uint256[] memory) {
        uint256 count = nextEventId > 0 ? nextEventId -1 : 0;
        uint256[] memory ids = new uint256[](count);
        for(uint i = 0; i < count; i++){
            ids[i] = i + 1;
        }
        return ids;
    }
    
    function getMultipleUserBets(uint256[] calldata eventIds, address user) public view returns (Bet[] memory) {
        Bet[] memory bets = new Bet[](eventIds.length);
        for (uint i = 0; i < eventIds.length; i++) {
            bets[i] = userBets[eventIds[i]][user];
        }
        return bets;
    }

    // ===== Admin functions =====
    function setTreasury(address _newTreasury) public onlyOwner {
        treasury = _newTreasury;
    }

    function setPlatformFee(uint256 _newFeeBps) public onlyOwner {
        platformFeeBps = _newFeeBps;
    }
}
