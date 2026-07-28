// Bir tahtanın bağlı cüzdan için unlock durumunu okur.
// Board 1 (English) ücretsiz — onchain kaydı yok, hep unlocked kabul edilir.

import { useAccount, useReadContract } from "wagmi";
import { PEG_SOLITAIRE_BOARDS_ABI, CONTRACT_ADDRESS, ACTIVE_CHAIN } from "../contract";

const FREE_BOARD_ID = 1;

export function useIsUnlocked(boardId: number) {
  const { address } = useAccount();

  const isPaidBoard = boardId > FREE_BOARD_ID;

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PEG_SOLITAIRE_BOARDS_ABI,
    functionName: "isUnlocked",
    args: address ? [address, boardId] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: Boolean(CONTRACT_ADDRESS && address && isPaidBoard),
    },
  });

  if (!isPaidBoard) {
    return { isUnlocked: true, isLoading: false, isError: false, refetch };
  }

  return {
    isUnlocked: data ?? false,
    isLoading,
    isError,
    refetch,
  };
}
