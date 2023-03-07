// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "../../core/BaseAccount.sol";
import "../callback/TokenCallbackHandler.sol";
import "./ISecp256r1.sol";

/**
 * minimal p256 account.
 *  this is sample minimal p256 account.
 *  has execute, eth handling methods
 *  has a single signer that can send requests through the entryPoint.
 */
contract P256Account is BaseAccount, TokenCallbackHandler, UUPSUpgradeable, Initializable {
    using ECDSA for bytes32;

    uint256 private _nonce;
    bytes public publicKey;

    function nonce() public view virtual override returns (uint256) {
        return _nonce;
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    IEntryPoint private immutable _entryPoint;
    ISecp256r1 private immutable _validator;

    event P256AccountInitialized(
        IEntryPoint indexed entryPoint,
        ISecp256r1 indexed validator,
        bytes publicKey
    );

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    modifier onlyEntryPoint() {
        _onlyEntryPoint();
        _;
    }

    function _onlyEntryPoint() internal view {
        require(msg.sender == address(entryPoint()), "account: not EntryPoint");
    }

    constructor(IEntryPoint anEntryPoint, ISecp256r1 anISecp256r1) {
        _entryPoint = anEntryPoint;
        _validator = anISecp256r1;
    }

    /**
     * execute a transaction
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyEntryPoint {
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transaction
     */
    function executeBatch(address[] calldata dest, bytes[] calldata func) external onlyEntryPoint {
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    function initialize(bytes calldata _publicKey) public virtual initializer {
        _initialize(_publicKey);
    }

    function _initialize(bytes calldata _publicKey) internal virtual {
        publicKey = _publicKey;

        emit P256AccountInitialized(_entryPoint, _validator, publicKey);
    }

    /// implement template method of BaseAccount
    function _validateAndUpdateNonce(UserOperation calldata userOp) internal override {
        require(_nonce++ == userOp.nonce, "account: invalid nonce");
    }

    /// implement template method of BaseAccount
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
        internal
        virtual
        override
        returns (uint256 sigTimeRange)
    {
        if (
            !_validator.validateSignature(
                sha256(abi.encode(userOpHash)),
                userOp.signature,
                publicKey
            )
        ) {
            return SIG_VALIDATION_FAILED;
        }
        return 0;
    }

    function _call(
        address target,
        uint256 value,
        bytes memory data
    ) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        (bool req, ) = address(entryPoint()).call{value: msg.value}("");
        require(req);
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     * @param signature to validate
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount,
        bytes calldata signature
    ) public {
        bytes32 hash = keccak256(abi.encode(withdrawAddress, amount, _nonce));

        require(
            _validator.validateSignature(sha256(abi.encode(hash)), signature, publicKey),
            "signature invalid"
        );

        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(
        address /*newImplementation*/
    ) internal virtual override {
        _onlyEntryPoint();
    }
}
