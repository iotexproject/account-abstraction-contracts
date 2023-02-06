// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISecp256r1 {
    function validateSignature(
        bytes32 message,
        uint256[2] memory rs,
        uint256[2] memory Q
    ) external view returns (bool);
}
