# Account abstraction contracts

## Local Development

### Install Dependencies

`yarn`

### Compile Contracts

`yarn compile`

### Run Tests

`yarn test`

## Contracts structure

### Dependencies

1. @account-abstraction/contracts 0.6.0
2. @openzeppelin/contracts 4.2.0
3. solidity-dkim
    
    Verify Email DKIM signature use solidity

### Core contracts

The Account Abstraction contracts are based on openzeppelin audited contracts EIP 4337 version 0.6. 

https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.6.0

The contracts located in the `contracts/accounts/secp256r1` directory are core contracts for IoTeX account abstraction. 

These contracts implement a smart contract account that uses secp256r1 elliptic curve signatures. The `contracts/accounts/secp256r1/Secp256r1.sol` contract uses IoTeX precompiled contract to verify secp256r1 signatures.
