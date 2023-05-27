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

The contracts under the `contracts/accounts/secp256r1` directory are core contracts for IoTeX account abstraction.

Those contract implement a smart contract account use secp256r1 elliptic curve signatures. The `contracts/accounts/secp256r1/Secp256r1.sol` is use IoTeX precompiled contract to verify secp256r1 signature.
