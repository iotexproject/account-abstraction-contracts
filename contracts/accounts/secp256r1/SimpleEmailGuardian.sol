// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../interfaces/IEmailGuardian.sol";

contract SimpleEmailGuardian is IEmailGuardian {
    mapping(bytes32 => address) private users;
    mapping(address => bytes32) private emails;

    function register(bytes32 email) external override {
        require(users[email] == address(0), "already bind");
        bytes32 preEmail = emails[msg.sender];
        if (preEmail != 0) {
            users[preEmail] = address(0);
        }
        users[email] = msg.sender;
        emails[msg.sender] = email;
    }

    function account(bytes32 email) external view override returns (address) {
        return users[email];
    }
}
