// Ücretli bir tahtayı on-chain açar (unlockBoard, payable).
// Tek iş yapar: transaction'ı yönetmek. Başarıdan sonra unlock durumunu
// tazelemek UI'nın işi (useIsUnlocked().refetch()) — burada callback yok.
//
// wagmi v3'te writeContract/writeContractAsync deprecated; karşılıkları
// mutate/mutateAsync. (wagmi.sh/react/api/hooks/useWriteContract)

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from "viem";
import { PEG_SOLITAIRE_BOARDS_ABI, CONTRACT_ADDRESS, ACTIVE_CHAIN } from "../contract";

export type UnlockErrorKind =
  | "AlreadyUnlocked"
  | "IncorrectPayment"
  | "InvalidBoardId"
  | "UserRejected"
  | "InsufficientFunds"
  | "Unknown";

// unlockBoard'ın revert edebileceği custom error'lar. Ownable error'ları
// bu yoldan çıkmaz (owner-only fonksiyonlara özgü), o yüzden listede yok.
const UNLOCK_CONTRACT_ERRORS = new Set<string>([
  "AlreadyUnlocked",
  "IncorrectPayment",
  "InvalidBoardId",
]);

// EIP-1193 standart red kodu. Bazı cüzdanlar viem sınıfına sarılmamış
// düz obje fırlatıyor, o yüzden sınıf kontrolünün yanında bu da lazım.
function isUserRejection(error: unknown): boolean {
  if (error instanceof UserRejectedRequestError) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 4001
  );
}

function toErrorKind(error: unknown): UnlockErrorKind | null {
  if (!error) return null;

  // viem hiyerarşisi dışında bir şey geldiyse sadece 4001'i ayıklayabiliriz.
  if (!(error instanceof BaseError)) {
    return isUserRejection(error) ? "UserRejected" : "Unknown";
  }

  // walk(fn): cause zincirinde eşleşen ilk hatayı döner, yoksa null.
  if (error.walk(isUserRejection)) return "UserRejected";

  const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (reverted instanceof ContractFunctionRevertedError) {
    const errorName = reverted.data?.errorName;
    if (errorName && UNLOCK_CONTRACT_ERRORS.has(errorName)) {
      return errorName as UnlockErrorKind;
    }
    return "Unknown";
  }

  if (error.walk((e) => e instanceof InsufficientFundsError)) return "InsufficientFunds";

  return "Unknown";
}

export function useUnlockBoard() {
  // Fiyat contract'tan canlı okunuyor — hardcode yok. Başka bir adrese
  // (ör. mainnet deploy) geçildiğinde frontend değişmeden doğru değeri gönderir.
  const { data: unlockPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PEG_SOLITAIRE_BOARDS_ABI,
    functionName: "unlockPrice",
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: Boolean(CONTRACT_ADDRESS),
    },
  });

  const {
    mutate: writeUnlock,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  // confirmations: 1 — Base L2'de reorg riski düşük, tek blok guard yeterli.
  const {
    data: receipt,
    isLoading: isConfirming,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: Boolean(txHash),
    },
  });

  // Cüzdan onayı bekleniyor VEYA tx zincirde onay bekliyor.
  const isBusy = isWritePending || isConfirming;

  const unlock = useCallback(
    (boardId: number) => {
      if (isBusy) return; // çift-tık guard: ikinci tx penceresi açma
      if (!CONTRACT_ADDRESS) return;
      if (unlockPrice === undefined) return; // fiyat okunmadan ödeme gönderme

      writeUnlock({
        address: CONTRACT_ADDRESS,
        abi: PEG_SOLITAIRE_BOARDS_ABI,
        functionName: "unlockBoard",
        args: [boardId],
        value: unlockPrice,
        chainId: ACTIVE_CHAIN.id,
      });
    },
    [isBusy, unlockPrice, writeUnlock],
  );

  // viem'in waitForTransactionReceipt'i revert eden tx'te THROW ETMEZ;
  // status: "reverted" olan bir receipt ile başarıyla resolve olur.
  // Bu yüzden query'nin isSuccess'ine değil receipt.status'e bakılıyor.
  const isSuccess = receipt?.status === "success";
  const isReverted = receipt?.status === "reverted";

  const error = writeError ?? receiptError ?? null;
  const errorKind: UnlockErrorKind | null = error
    ? toErrorKind(error)
    : isReverted
      ? "Unknown" // receipt revert'i hangi custom error olduğunu taşımıyor
      : null;

  return {
    unlock,
    isBusy,
    isSuccess,
    errorKind,
    error,
    txHash,
    reset, // hash'i temizler -> receipt query'si devre dışı kalır, durum sıfırlanır
  };
}
