import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { artifacts, network } from "hardhat";
import { formatEther, parseEther } from "viem";

// Board unlock price. Hardcoded on purpose: it is an immutable constructor arg
// and must never silently vary per environment. (Boards 2-6 cost this; board 1
// is free and never touches the contract.)
const UNLOCK_PRICE = parseEther("0.0004");

// Expected chainId per Hardhat network name. Derived from the --network flag,
// NOT from an env var, so we can hard-fail before broadcasting to the wrong
// chain. The same script serves testnet and mainnet.
const EXPECTED_CHAIN_IDS: Record<string, number> = {
  baseSepolia: 84532,
  base: 8453,
};

// Warn (do not block) below this balance — a deploy needs some gas headroom.
const LOW_BALANCE_THRESHOLD = parseEther("0.002");

const CONTRACT_NAME = "PegSolitaireBoards";

// Informational only. A build profile belongs to whatever `hardhat build`
// compiled the artifacts, not to this script: a plain script never receives
// --build-profile, and Hardhat exposes no runtime accessor for it. Hardhat's
// default is "default" and this project declares no custom profiles. The
// authoritative compiler settings below are read from the build info itself,
// so this label can never make the recorded solc/optimizer fields lie.
const BUILD_PROFILE = "default";

// The subset of Hardhat's SolidityBuildInfo we record. Read from the build info
// file rather than re-typed from hardhat.config.ts: a hand-copied solc version
// silently drifts the moment the config changes, and a deploy record that lies
// about its compiler is exactly what forces bytecode reverse-engineering at
// verification time.
interface BuildInfoSubset {
  readonly solcVersion: string;
  readonly solcLongVersion: string;
  readonly input: {
    readonly settings: {
      readonly optimizer?: { readonly enabled?: boolean; readonly runs?: number };
      readonly evmVersion?: string;
      readonly remappings?: readonly string[];
    };
  };
}

// Everything a verification run needs, straight from the compiler's own record.
async function readCompilerInfo() {
  const buildInfoId = await artifacts.getBuildInfoId(CONTRACT_NAME);
  if (buildInfoId === undefined) {
    throw new Error(
      `No build info found for ${CONTRACT_NAME}. Run \`npx hardhat build\` before deploying.`,
    );
  }

  const buildInfoPath = await artifacts.getBuildInfoPath(buildInfoId);
  if (buildInfoPath === undefined) {
    throw new Error(
      `Build info id ${buildInfoId} has no file on disk. Run \`npx hardhat build\` before deploying.`,
    );
  }

  const buildInfo = JSON.parse(readFileSync(buildInfoPath, "utf8")) as BuildInfoSubset;
  const settings = buildInfo.input.settings;

  return {
    solcVersion: buildInfo.solcVersion,
    // Commit-qualified version (e.g. 0.8.24+commit.e11b9ed9) — this, not the
    // short version, is what block explorers match against.
    solcLongVersion: buildInfo.solcLongVersion,
    evmVersion: settings.evmVersion,
    optimizer: settings.optimizer,
    remappings: settings.remappings ?? [],
    buildProfile: BUILD_PROFILE,
    buildInfoId,
  };
}

async function main() {
  // No network name here: it comes from `--network <name>` at run time so this
  // script stays network-agnostic (works for baseSepolia and base alike).
  // create() over the deprecated connect(): connect() is slated for removal,
  // and getOrCreate()'s connection reuse buys a one-shot script nothing.
  const connection = await network.create();

  try {
    const { viem, networkName } = connection;

    const publicClient = await viem.getPublicClient();

    // --- Chain safety: refuse to deploy to an unexpected chain ---------------
    const expectedChainId = EXPECTED_CHAIN_IDS[networkName];
    if (expectedChainId === undefined) {
      throw new Error(
        `Unknown network "${networkName}". Add it to EXPECTED_CHAIN_IDS before deploying. ` +
          `Known networks: ${Object.keys(EXPECTED_CHAIN_IDS).join(", ")}.`,
      );
    }

    const actualChainId = await publicClient.getChainId();
    if (actualChainId !== expectedChainId) {
      throw new Error(
        `Chain mismatch for network "${networkName}": expected chainId ${expectedChainId}, ` +
          `but the RPC reports ${actualChainId}. Aborting to avoid deploying to the wrong chain.`,
      );
    }

    // --- Deployer + owner ----------------------------------------------------
    const walletClients = await viem.getWalletClients();
    const deployer = walletClients[0];
    if (deployer === undefined) {
      throw new Error(
        `No wallet client available for network "${networkName}". Check that DEPLOYER_PRIVATE_KEY ` +
          `is set where Hardhat can read it (hardhat.config.ts loads \`dotenv/config\`, which reads ` +
          `.env — not .env.local).`,
      );
    }

    const deployerAddress = deployer.account.address;
    const initialOwner = deployerAddress; // owner = deployer, never hand-written

    const balance = await publicClient.getBalance({ address: deployerAddress });

    console.log("==============================");
    console.log("DEPLOY — PegSolitaireBoards");
    console.log("==============================");
    console.log(`Network:        ${networkName}`);
    console.log(`Chain ID:       ${actualChainId}`);
    console.log(`Deployer:       ${deployerAddress}`);
    console.log(`Balance:        ${formatEther(balance)} ETH`);
    console.log(`Unlock price:   ${formatEther(UNLOCK_PRICE)} ETH (${UNLOCK_PRICE} wei)`);
    console.log(`Initial owner:  ${initialOwner}`);
    console.log("------------------------------");

    if (balance < LOW_BALANCE_THRESHOLD) {
      console.warn(
        `⚠️  Low balance: ${formatEther(balance)} ETH (below ${formatEther(
          LOW_BALANCE_THRESHOLD,
        )} ETH). The deploy may run out of gas — proceeding anyway.`,
      );
    }

    // --- Gather the deploy record BEFORE broadcasting -------------------------
    // Deliberately ordered: if an artifact or its build info is missing, we fail
    // here, having spent no gas — rather than after a successful deploy that we
    // then cannot describe.
    const artifact = await artifacts.readArtifact(CONTRACT_NAME);
    const compiler = await readCompilerInfo();

    // --- Broadcast deployment ------------------------------------------------
    // Deployed through the wallet client directly instead of
    // viem.sendDeploymentTransaction(): that helper follows the broadcast with a
    // bare publicClient.getTransaction(), a single eth_getTransactionByHash with
    // no retry. Against a load-balanced RPC the read can land on a node that has
    // not seen the tx yet, and viem throws TransactionNotFoundError from inside
    // the helper — before it ever returns, so no amount of waiting on our side
    // helps. waitForTransactionReceipt, by contrast, catches that error and
    // retries with exponential backoff, so we go straight to it with the hash
    // the broadcast already handed us and never read the tx back.
    console.log("Sending deployment transaction...");
    const deploymentTxHash = await deployer.deployContract({
      abi: artifact.abi,
      // Artifact types bytecode as string; viem wants a 0x-prefixed Hex. The
      // contract links no libraries, so the artifact bytecode is final as-is.
      bytecode: artifact.bytecode as `0x${string}`,
      args: [UNLOCK_PRICE, initialOwner],
    });

    console.log(`Deployment tx:  ${deploymentTxHash}`);
    console.log("Waiting for transaction receipt (1 confirmation)...");

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deploymentTxHash,
      confirmations: 1,
    });

    if (receipt.status !== "success") {
      throw new Error(
        `Deployment transaction ${deploymentTxHash} reverted (status: ${receipt.status}). ` +
          `No contract was created.`,
      );
    }

    const contractAddress = receipt.contractAddress;
    const blockNumber = receipt.blockNumber;
    if (!contractAddress) {
      throw new Error(
        "Deployment receipt has no contractAddress — the deploy transaction did not create a contract.",
      );
    }

    console.log(`Contract:       ${contractAddress}`);
    console.log(`Block number:   ${blockNumber}`);
    console.log("------------------------------");

    // --- Post-deploy verification (is the contract actually live & correct?) --
    // getContractAt only reads the artifact and builds an instance — no tx
    // read-back — so it is safe here and keeps these calls fully typed.
    console.log("Verifying on-chain state...");

    const contract = await viem.getContractAt(CONTRACT_NAME, contractAddress);

    const onChainPrice = await contract.read.unlockPrice();
    if (onChainPrice !== UNLOCK_PRICE) {
      console.warn(
        `⚠️  unlockPrice mismatch: expected ${UNLOCK_PRICE}, got ${onChainPrice}.`,
      );
    } else {
      console.log(`  unlockPrice()  = ${onChainPrice} wei ✓`);
    }

    const onChainOwner = await contract.read.owner();
    if (onChainOwner.toLowerCase() !== initialOwner.toLowerCase()) {
      console.warn(
        `⚠️  owner mismatch: expected ${initialOwner}, got ${onChainOwner}.`,
      );
    } else {
      console.log(`  owner()        = ${onChainOwner} ✓`);
    }

    const board2Unlocked = await contract.read.isUnlocked([deployerAddress, 2]);
    if (board2Unlocked !== false) {
      console.warn(
        `⚠️  isUnlocked(deployer, 2) expected false, got ${board2Unlocked}.`,
      );
    } else {
      console.log(`  isUnlocked(deployer, 2) = ${board2Unlocked} ✓`);
    }

    console.log("------------------------------");

    // --- Persist deploy info (per-network file) ------------------------------
    // Chain-specific values (address, tx, block) come from the receipt we just
    // read, never from env: the record describes what actually landed on chain.
    const deployInfo = {
      contractName: CONTRACT_NAME,
      sourceName: artifact.sourceName,
      // What `hardhat verify` wants when a name is ambiguous.
      fullyQualifiedName: `${artifact.sourceName}:${CONTRACT_NAME}`,
      network: networkName,
      chainId: actualChainId,
      contractAddress,
      deploymentTx: deploymentTxHash,
      blockNumber: Number(blockNumber), // CRITICAL: frontend needs the deploy block
      deployer: deployerAddress,
      // Array so it can be copied verbatim into a verify command.
      constructorArgs: [UNLOCK_PRICE.toString(), initialOwner],
      unlockPriceWei: UNLOCK_PRICE.toString(),
      unlockPriceEth: formatEther(UNLOCK_PRICE),
      compiler,
      timestamp: new Date().toISOString(),
    };

    const infoFileName = `deploy-info.${networkName}.json`;
    const infoPath = resolve(process.cwd(), infoFileName);

    // Never clobber a previous deploy record. The contract it describes is still
    // live on chain, and overwriting it in place loses the only local trace of
    // that address, its deployer and its compiler settings.
    if (existsSync(infoPath)) {
      // Colons are not legal in Windows filenames — flatten the ISO stamp.
      const fileStamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `deploy-info.${networkName}.${fileStamp}.bak.json`;
      copyFileSync(infoPath, resolve(process.cwd(), backupName));
      console.log(`Backed up previous record -> ${backupName}`);
    }

    const infoJson = JSON.stringify(deployInfo, null, 2);
    writeFileSync(infoPath, infoJson + "\n");

    console.log(`Wrote ${infoFileName}:`);
    console.log(infoJson);

    // --- Next steps ----------------------------------------------------------
    console.log("");
    console.log("==============================");
    console.log("NEXT STEPS");
    console.log("1. Verify:");
    console.log(
      `     npx hardhat verify --network ${networkName} ${contractAddress} ` +
        `${UNLOCK_PRICE.toString()} ${initialOwner}`,
    );
    console.log("2. Frontend .env:");
    console.log(`     NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`     NEXT_PUBLIC_DEPLOY_BLOCK=${Number(blockNumber)}`);
    console.log("3. Test: call unlockBoard(2) with the unlock price and confirm it records.");
    console.log("==============================");
  } finally {
    // Runs even when a guard above throws, so a failed deploy never leaves the
    // provider connection dangling.
    await connection.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
