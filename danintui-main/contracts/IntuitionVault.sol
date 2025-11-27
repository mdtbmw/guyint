// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IntuitionVault {
    address public owner;

    // Sweeper permissions: contracts that can move funds out via sweepTo()
    mapping(address => bool) public isSweeper;

    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event SweeperUpdated(address indexed sweeper, bool allowed);
    event Swept(address indexed sweeper, address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlySweeper() {
        require(isSweeper[msg.sender], "Not a sweeper");
        _;
    }

    constructor() {
        owner = msg.sender;
        isSweeper[msg.sender] = true; // owner is sweeper by default
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Admin can grant or revoke sweep permissions
    function setSweeper(address sweeper, bool allowed) external onlyOwner {
        isSweeper[sweeper] = allowed;
        emit SweeperUpdated(sweeper, allowed);
    }

    // Users deposit ETH (credited to their balances)
    function deposit() external payable {
        require(msg.value > 0, "No ETH sent");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // Users withdraw their own balance
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient funds");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    // Sweeper function: used by Betting contract
    function sweepTo(address to, uint256 amount) external onlySweeper {
        require(to != address(0), "Zero address");
        require(address(this).balance >= amount, "Vault underfunded");

        (bool ok, ) = to.call{ value: amount }("");
        require(ok, "Transfer failed");
        emit Swept(msg.sender, to, amount);
    }

    receive() external payable {
    }
}
