// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract IntuitionBettingOracle is Ownable, ReentrancyGuard {

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

    struct Bet {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
    }

    mapping(uint256 => EventData) public events;
    mapping(uint256 => mapping(address => Bet)) public userBets;
    uint256 public nextEventId = 1;
    address public treasury;
    uint256 public platformFeeBps; // e.g., 300 for 3%

    event EventCreated(uint256 indexed id, string question, string description, string category, string imageUrl, uint256 bettingStopDate, uint256 resolutionDate, uint256 minStake, uint256 maxStake);
    event BetPlaced(uint256 indexed eventId, address indexed user, bool outcome, uint256 amount);
    event EventResolved(uint256 indexed eventId, Outcome winningOutcome);
    event EventCanceled(uint256 indexed eventId);
    event WinningsClaimed(uint256 indexed eventId, address indexed user, uint256 amount);

    constructor(address _initialOwner, address _treasury, uint256 _platformFeeBps) Ownable(_initialOwner) {
        require(_treasury != address(0), "Treasury address cannot be zero");
        require(_platformFeeBps <= 1000, "Platform fee cannot exceed 10%"); // 10% sanity check
        treasury = _treasury;
        platformFeeBps = _platformFeeBps;
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
    ) external onlyOwner {
        require(bettingStop > block.timestamp, "Betting stop date must be in the future");
        require(resolution > bettingStop, "Resolution date must be after betting stop date");
        require(maxStake > minStake, "Max stake must be greater than min stake");

        events[nextEventId] = EventData(
            nextEventId,
            q,
            desc,
            cat,
            img,
            bettingStop,
            resolution,
            minStake,
            maxStake,
            0,
            0,
            EventStatus.Open,
            Outcome.None
        );
        emit EventCreated(nextEventId, q, desc, cat, img, bettingStop, resolution, minStake, maxStake);
        nextEventId++;
    }

    function placeBet(uint256 id, bool outcome) external payable nonReentrant {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open, "Event is not open for betting");
        require(block.timestamp < eventData.bettingStopDate, "Betting has closed for this event");
        require(msg.value >= eventData.minStake, "Stake is below minimum");
        require(msg.value <= eventData.maxStake, "Stake is above maximum");

        Bet storage bet = userBets[id][msg.sender];
        require(bet.yesAmount == 0 && bet.noAmount == 0, "User has already placed a bet on this event");

        if (outcome) { // Corresponds to YES
            eventData.yesPool += msg.value;
            bet.yesAmount = msg.value;
        } else { // Corresponds to NO
            eventData.noPool += msg.value;
            bet.noAmount = msg.value;
        }

        emit BetPlaced(id, msg.sender, outcome, msg.value);
    }
    
    function resolveEvent(uint256 id, bool yesWins) external onlyOwner {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open || eventData.status == EventStatus.Closed, "Event cannot be resolved");
        
        eventData.winningOutcome = yesWins ? Outcome.YES : Outcome.NO;
        eventData.status = EventStatus.Finished;

        emit EventResolved(id, eventData.winningOutcome);
    }

    function cancelEvent(uint256 id) external onlyOwner {
        EventData storage eventData = events[id];
        require(eventData.status == EventStatus.Open, "Can only cancel open events");
        eventData.status = EventStatus.Canceled;
        emit EventCanceled(id);
    }

    function claim(uint256 id) external nonReentrant {
        Bet storage bet = userBets[id][msg.sender];
        EventData storage eventData = events[id];
        require(!bet.claimed, "Winnings already claimed");
        
        uint256 payout = 0;

        if (eventData.status == EventStatus.Finished) {
            bool userStakedOnYes = bet.yesAmount > 0;
            bool userWon = (userStakedOnYes && eventData.winningOutcome == Outcome.YES) || (!userStakedOnYes && eventData.winningOutcome == Outcome.NO);
            
            require(userWon, "No winnings to claim");

            uint256 stake = userStakedOnYes ? bet.yesAmount : bet.noAmount;
            uint256 totalPool = eventData.yesPool + eventData.noPool;
            uint256 winningPool = eventData.winningOutcome == Outcome.YES ? eventData.yesPool : eventData.noPool;
            
            payout = (stake * totalPool) / winningPool;
            uint256 fee = (payout - stake) * platformFeeBps / 10000;
            payout -= fee;
            payable(treasury).transfer(fee);

        } else if (eventData.status == EventStatus.Canceled) {
            payout = bet.yesAmount + bet.noAmount;
        } else {
            revert("Event not resolved or canceled");
        }

        require(payout > 0, "Nothing to claim");
        bet.claimed = true;
        emit WinningsClaimed(id, msg.sender, payout);
        payable(msg.sender).transfer(payout);
    }

    // --- View Functions ---
    
    function getEventById(uint256 id) public view returns (EventData memory) {
        return events[id];
    }

    function getUserBet(uint256 eventId, address user) public view returns (Bet memory) {
        return userBets[eventId][user];
    }
    
    function getMultipleUserBets(uint256[] memory eventIds, address user) public view returns (Bet[] memory) {
        Bet[] memory bets = new Bet[](eventIds.length);
        for(uint i = 0; i < eventIds.length; i++) {
            bets[i] = userBets[eventIds[i]][user];
        }
        return bets;
    }

    function getAllEventIds() public view returns (uint256[] memory) {
        if (nextEventId == 1) {
            return new uint256[](0);
        }
        uint256[] memory ids = new uint256[](nextEventId - 1);
        for(uint i = 1; i < nextEventId; i++) {
            ids[i-1] = i;
        }
        return ids;
    }
}
