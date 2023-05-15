// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEmailGuardian {
    function register(bytes32 email) external;

    function account(bytes32 email) external view returns (address);
}
