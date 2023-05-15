// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../interfaces/IEmailGuardian.sol";

contract SimpleEmailGuardian is IEmailGuardian {
    mapping(bytes32 => address) private users;

    function register(bytes32 email) external override {
        require(users[email] == address(0), "already bind");
        users[email] = msg.sender;
    }

    function account(bytes32 email) external view override returns (address) {
        return users[email];
    }
}
