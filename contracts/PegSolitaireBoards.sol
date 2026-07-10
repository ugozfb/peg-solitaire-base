// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PegSolitaireBoards
/// @notice Board unlock economy for Peg Solitaire. Board 1 (English) is free
///         and never touches this contract. Boards 2-6 are unlocked by paying
///         a fixed price, recorded per-wallet on-chain.
contract PegSolitaireBoards is Ownable {
    uint256 public immutable unlockPrice;

    uint8 public constant MIN_BOARD_ID = 2;
    uint8 public constant MAX_BOARD_ID = 6;

    mapping(address => mapping(uint8 => bool)) public unlockedBoards;

    event BoardUnlocked(address indexed player, uint8 indexed boardId, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error InvalidBoardId(uint8 boardId);
    error IncorrectPayment(uint256 sent, uint256 required);
    error AlreadyUnlocked(uint8 boardId);
    error NothingToWithdraw();
    error WithdrawFailed();
    error InvalidPrice();

    constructor(uint256 _unlockPrice, address _initialOwner) Ownable(_initialOwner) {
        if (_unlockPrice == 0) revert InvalidPrice();
        unlockPrice = _unlockPrice;
    }

    function unlockBoard(uint8 boardId) external payable {
        if (boardId < MIN_BOARD_ID || boardId > MAX_BOARD_ID) {
            revert InvalidBoardId(boardId);
        }
        if (msg.value != unlockPrice) {
            revert IncorrectPayment(msg.value, unlockPrice);
        }
        if (unlockedBoards[msg.sender][boardId]) {
            revert AlreadyUnlocked(boardId);
        }

        unlockedBoards[msg.sender][boardId] = true;
        emit BoardUnlocked(msg.sender, boardId, msg.value);
    }

    function isUnlocked(address player, uint8 boardId) external view returns (bool) {
        return unlockedBoards[player][boardId];
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToWithdraw();

        address currentOwner = owner();
        (bool ok, ) = payable(currentOwner).call{value: balance}("");
        if (!ok) revert WithdrawFailed();

        emit Withdrawn(currentOwner, balance);
    }
}
