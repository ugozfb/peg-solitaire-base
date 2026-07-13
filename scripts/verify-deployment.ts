import { writeFileSync } from "node:fs";

import { network } from "hardhat";

const CONTRACT_ADDRESS = "0x5c27865c00844622bb92546124025019c566e471";
const DEPLOY_TX = "0x1bc85b6592bc007209c2541386c42fbc8d6874c3af656e9b61248fc4913a3222";
const DEPLOY_BLOCK = 44059021;
const DEPLOYER = "0xAB6FC7Fc5E0D76805A129757a0B64720E5726020";
const EXPECTED_UNLOCK_PRICE = 400000000000000n;
const EXPECTED_CHAIN_ID = 84532;
const EXPECTED_MIN_BOARD_ID = 2;
const EXPECTED_MAX_BOARD_ID = 6;

async function main() {
  let allPassed = true;

  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  const contract = await viem.getContractAt("PegSolitaireBoards", CONTRACT_ADDRESS);

  const check = (label: string, passed: boolean, actual: unknown, expected: unknown) => {
    if (passed) {
      console.log(`  ✓ ${label}: ${actual}`);
    } else {
      console.log(`  ✗ ${label}: got ${actual}, expected ${expected}`);
      allPassed = false;
    }
  };

  console.log(`Verifying PegSolitaireBoards at ${CONTRACT_ADDRESS} on baseSepolia...\n`);

  const chainId = await publicClient.getChainId();
  check("chainId", chainId === EXPECTED_CHAIN_ID, chainId, EXPECTED_CHAIN_ID);

  const unlockPrice = await contract.read.unlockPrice();
  check("unlockPrice", unlockPrice === EXPECTED_UNLOCK_PRICE, unlockPrice, EXPECTED_UNLOCK_PRICE);

  const owner = await contract.read.owner();
  check(
    "owner",
    owner.toLowerCase() === DEPLOYER.toLowerCase(),
    owner,
    DEPLOYER,
  );

  const unlocked = await contract.read.isUnlocked([DEPLOYER, 2]);
  check("isUnlocked(deployer, 2)", unlocked === false, unlocked, false);

  const minBoardId = await contract.read.MIN_BOARD_ID();
  check("MIN_BOARD_ID", minBoardId === EXPECTED_MIN_BOARD_ID, minBoardId, EXPECTED_MIN_BOARD_ID);

  const maxBoardId = await contract.read.MAX_BOARD_ID();
  check("MAX_BOARD_ID", maxBoardId === EXPECTED_MAX_BOARD_ID, maxBoardId, EXPECTED_MAX_BOARD_ID);

  const deployInfo = {
    contractName: "PegSolitaireBoards",
    network: "baseSepolia",
    chainId: EXPECTED_CHAIN_ID,
    contractAddress: CONTRACT_ADDRESS,
    deploymentTx: DEPLOY_TX,
    blockNumber: DEPLOY_BLOCK,
    deployer: DEPLOYER,
    constructorArgs: ["400000000000000", DEPLOYER],
    unlockPriceWei: "400000000000000",
    unlockPriceEth: "0.0004",
    solcVersion: "0.8.24",
    optimizer: { enabled: true, runs: 200 },
    timestamp: new Date().toISOString(),
  };

  const outputPath = "deploy-info.baseSepolia.json";
  writeFileSync(outputPath, JSON.stringify(deployInfo, null, 2));

  console.log(`\nWrote ${outputPath}:`);
  console.log(JSON.stringify(deployInfo, null, 2));

  console.log();
  if (allPassed) {
    console.log("DEPLOYMENT VERIFIED");
  } else {
    console.warn("VERIFICATION FAILED");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
