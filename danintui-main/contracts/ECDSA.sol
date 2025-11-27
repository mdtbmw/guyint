
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions are executed using the Solidity `assembly` language to balance
 * gas efficiency and readability. See Vitalik Buterin's blog post,
 * "Triple-Vending World Tour," for a detailed explanation of the math behind ECDSA.
 *
 * NOTE: This library is adapted from OpenZeppelin Contracts.
 */
library ECDSA {
    /**
     * @dev Recovers the address that signed a message (`hash`) with
     * `signature`. This is the core function of ECDSA.
     *
     * Returns the address that signed the message.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // `signature` is a packed sequence of r, s, v.
        // r, s are 32 bytes long, v is 1 byte.
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature v = 27 / 28 for web3.js-based clients
        if (v < 27) {
            v += 27;
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }
}

    