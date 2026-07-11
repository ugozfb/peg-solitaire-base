import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

const UNLOCK_PRICE = parseEther("0.0004");

describe("PegSolitaireBoards", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [owner, alice, bob] = await viem.getWalletClients();

  // Deploys a fresh contract owned by `owner` (the default deployer wallet).
  const deploy = (price: bigint = UNLOCK_PRICE) =>
    viem.deployContract("PegSolitaireBoards", [price, owner.account.address]);

  // Returns a contract instance whose writes are sent from `wallet`, so that
  // `msg.sender` inside the contract is that wallet's address.
  const connectAs = (address: `0x${string}`, wallet: typeof alice) =>
    viem.getContractAt("PegSolitaireBoards", address, {
      client: { wallet },
    });

  describe("deployment", function () {
    it("stores the unlock price and initial owner", async function () {
      const contract = await deploy();

      assert.equal(await contract.read.unlockPrice(), UNLOCK_PRICE);
      assert.equal(
        (await contract.read.owner()).toLowerCase(),
        owner.account.address.toLowerCase(),
      );
    });

    it("reverts with InvalidPrice when deployed with a zero unlock price", async function () {
      // A valid contract only serves as the ABI source for decoding the error;
      // the failing deployment promise is what we assert on.
      const reference = await deploy();

      await viem.assertions.revertWithCustomError(
        deploy(0n) as unknown as Promise<`0x${string}`>,
        reference,
        "InvalidPrice",
      );
    });
  });

  describe("unlockBoard — success", function () {
    it("records the board as unlocked for the paying wallet", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });

      assert.equal(
        await contract.read.unlockedBoards([alice.account.address, 2]),
        true,
      );
    });

    it("emits BoardUnlocked with (player, boardId, amount)", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.emitWithArgs(
        asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE }),
        contract,
        "BoardUnlocked",
        [alice.account.address, 2, UNLOCK_PRICE],
      );
    });

    it("reports unlock status per board via isUnlocked", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });

      assert.equal(await contract.read.isUnlocked([alice.account.address, 2]), true);
      assert.equal(await contract.read.isUnlocked([alice.account.address, 3]), false);
    });

    it("keeps unlocks independent across wallets", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });

      assert.equal(await contract.read.isUnlocked([alice.account.address, 2]), true);
      assert.equal(await contract.read.isUnlocked([bob.account.address, 2]), false);
    });

    it("lets a single wallet unlock several different boards", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });
      await asAlice.write.unlockBoard([4], { value: UNLOCK_PRICE });

      assert.equal(await contract.read.isUnlocked([alice.account.address, 2]), true);
      assert.equal(await contract.read.isUnlocked([alice.account.address, 4]), true);
    });
  });

  describe("unlockBoard — revert", function () {
    it("rejects board id 1 (the free board) with InvalidBoardId", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([1], { value: UNLOCK_PRICE }),
        contract,
        "InvalidBoardId",
      );
    });

    it("rejects board id 7 (above range) with InvalidBoardId", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([7], { value: UNLOCK_PRICE }),
        contract,
        "InvalidBoardId",
      );
    });

    it("rejects board id 0 with InvalidBoardId", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([0], { value: UNLOCK_PRICE }),
        contract,
        "InvalidBoardId",
      );
    });

    it("rejects underpayment with IncorrectPayment", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE - 1n }),
        contract,
        "IncorrectPayment",
      );
    });

    it("rejects overpayment with IncorrectPayment", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE + 1n }),
        contract,
        "IncorrectPayment",
      );
    });

    it("rejects zero payment with IncorrectPayment", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([2], { value: 0n }),
        contract,
        "IncorrectPayment",
      );
    });

    it("rejects unlocking an already unlocked board with AlreadyUnlocked", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });

      await viem.assertions.revertWithCustomError(
        asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE }),
        contract,
        "AlreadyUnlocked",
      );
    });
  });

  describe("withdraw", function () {
    it("reverts for a non-owner caller with OwnableUnauthorizedAccount", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);

      await viem.assertions.revertWithCustomError(
        asAlice.write.withdraw(),
        contract,
        "OwnableUnauthorizedAccount",
      );
    });

    it("reverts with NothingToWithdraw on an empty contract", async function () {
      const contract = await deploy();

      await viem.assertions.revertWithCustomError(
        contract.write.withdraw(),
        contract,
        "NothingToWithdraw",
      );
    });

    it("empties the contract to the owner and emits Withdrawn", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);
      const asBob = await connectAs(contract.address, bob);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });
      await asAlice.write.unlockBoard([3], { value: UNLOCK_PRICE });
      await asBob.write.unlockBoard([2], { value: UNLOCK_PRICE });

      const total = 3n * UNLOCK_PRICE;
      assert.equal(
        await publicClient.getBalance({ address: contract.address }),
        total,
      );

      // `contract` is bound to the default wallet (owner), so this is an
      // owner-initiated withdrawal.
      const hash = await contract.write.withdraw();

      await viem.assertions.emitWithArgs(hash, contract, "Withdrawn", [
        owner.account.address,
        total,
      ]);
      assert.equal(
        await publicClient.getBalance({ address: contract.address }),
        0n,
      );
    });

    it("transfers the exact accumulated balance to the owner (net of gas)", async function () {
      const contract = await deploy();
      const asAlice = await connectAs(contract.address, alice);
      const asBob = await connectAs(contract.address, bob);

      await asAlice.write.unlockBoard([2], { value: UNLOCK_PRICE });
      await asAlice.write.unlockBoard([3], { value: UNLOCK_PRICE });
      await asBob.write.unlockBoard([2], { value: UNLOCK_PRICE });

      const total = 3n * UNLOCK_PRICE;

      // balancesHaveChanged adds the sender's gas fee back before comparing,
      // so the owner's net change must equal the full accumulated total.
      await viem.assertions.balancesHaveChanged(contract.write.withdraw(), [
        { address: owner.account.address, amount: total },
      ]);
    });
  });
});
