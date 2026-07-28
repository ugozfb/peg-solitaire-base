// Kontrat ABI'si + adres + aktif chain — tek merkezi kaynak.

import { base, baseSepolia } from "wagmi/chains";

export const PEG_SOLITAIRE_BOARDS_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_unlockPrice", type: "uint256" },
      { internalType: "address", name: "_initialOwner", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "uint8", name: "boardId", type: "uint8" }],
    name: "AlreadyUnlocked",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "sent", type: "uint256" },
      { internalType: "uint256", name: "required", type: "uint256" },
    ],
    name: "IncorrectPayment",
    type: "error",
  },
  {
    inputs: [{ internalType: "uint8", name: "boardId", type: "uint8" }],
    name: "InvalidBoardId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPrice",
    type: "error",
  },
  {
    inputs: [],
    name: "NothingToWithdraw",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "WithdrawFailed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: true, internalType: "uint8", name: "boardId", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "BoardUnlocked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_BOARD_ID",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_BOARD_ID",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint8", name: "boardId", type: "uint8" },
    ],
    name: "isUnlocked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "boardId", type: "uint8" }],
    name: "unlockBoard",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "unlockPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint8", name: "", type: "uint8" },
    ],
    name: "unlockedBoards",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as
  | `0x${string}`
  | undefined;

export const ACTIVE_CHAIN =
  process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;
