// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice Minimal SaltToken: mint only when backend provides signed attestation (off-chain)
contract SaltToken is ERC20, Ownable {
    using ECDSA for bytes32;
    address public attestor; // public address that signs attestations off-chain

    event Minted(address indexed to, uint256 amt, bytes32 merkleRoot, string ipfsCid);

    constructor(address _attestor) ERC20("Salt Token", "ST") {
        attestor = _attestor;
    }

    function setAttestor(address a) external onlyOwner {
        attestor = a;
    }

    /// @dev mint authorized by attestor signature over (to|amt|merkleRoot|ipfsCid)
    function mintWithAttestation(
        address to,
        uint256 amt,
        bytes32 merkleRoot,
        string calldata ipfsCid,
        bytes calldata signature
    ) external {
        bytes32 h = keccak256(abi.encodePacked(to, amt, merkleRoot, ipfsCid));
        bytes32 ethSigned = h.toEthSignedMessageHash();
        require(ethSigned.recover(signature) == attestor, "SaltToken: bad attestation");
        _mint(to, amt);
        emit Minted(to, amt, merkleRoot, ipfsCid);
    }
}

