// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SaltFarm is ERC721URIStorage, Ownable {
    using SafeERC20 for IERC20;

    uint256 public nextId;
    // receipt metadata
    struct Receipt { address lpToken; uint256 lpAmount; bytes32 merkleRoot; }
    mapping(uint256 => Receipt) public receipts;

    event StakedAndMinted(address indexed who, uint256 indexed id, address lpToken, uint256 amount, bytes32 merkleRoot);

    constructor() ERC721("SaltReceipt", "SREC") {
        nextId = 1;
    }

    /// @notice stake LP token into farm and mint receipt (caller must approve LP transfer)
    function stakeLPAndMint(address lpToken, uint256 amount, bytes32 merkleRoot, string calldata metadataURI) external returns (uint256) {
        require(amount > 0, "SaltFarm: zero amount");
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);
        uint256 id = nextId++;
        receipts[id] = Receipt({ lpToken: lpToken, lpAmount: amount, merkleRoot: merkleRoot });
        _mint(msg.sender, id);
        _setTokenURI(id, metadataURI);
        emit StakedAndMinted(msg.sender, id, lpToken, amount, merkleRoot);
        return id;
    }

    /// @notice withdraw underlying LP, burns receipt (only owner of token)
    function redeem(uint256 id) external {
        require(ownerOf(id) == msg.sender, "SaltFarm: not owner");
        Receipt memory r = receipts[id];
        delete receipts[id];
        _burn(id);
        IERC20(r.lpToken).safeTransfer(msg.sender, r.lpAmount);
    }

    /// emergency withdraw by owner (useful for recoveries in controlled tests)
    function emergencyWithdrawLP(uint256 id, address to) external onlyOwner {
        Receipt memory r = receipts[id];
        delete receipts[id];
        _burn(id);
        IERC20(r.lpToken).safeTransfer(to, r.lpAmount);
    }
}

