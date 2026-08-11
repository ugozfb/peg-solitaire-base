// Ücretli bir tahtayı on-chain açar (unlockBoard, payable).
// Tek iş yapar: transaction'ı yönetmek. Başarıdan sonra unlock durumunu
// tazelemek UI'nın işi (useIsUnlocked().refetch()) — burada callback yok.
//
// wagmi v3'te writeContract/writeContractAsync deprecated; karşılıkları
// mutate/mutateAsync. (wagmi.sh/react/api/hooks/useWriteContract)

import { useCallback, useState } from "react";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  BaseError,
  ChainMismatchError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from "viem";
import { PEG_SOLITAIRE_BOARDS_ABI, CONTRACT_ADDRESS, ACTIVE_CHAIN } from "../contract";
import { DATA_SUFFIX } from "../attribution";

// NotConnected/WrongNetwork zincire hiç gitmeden, write ÖNCESİ guard'lardan
// çıkar; diğerleri cüzdan/kontrat cevabından türer.
export type UnlockErrorKind =
  | "AlreadyUnlocked"
  | "IncorrectPayment"
  | "InvalidBoardId"
  | "UserRejected"
  | "InsufficientFunds"
  | "NotConnected"
  | "WrongNetwork"
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

  // Cüzdan yanlış ağdayken viem eth_sendTransaction'a HİÇ gitmeden
  // assertCurrentChain'de patlar; hata cause zincirine sarılı gelir, o yüzden
  // walk(). Bu kapı olmadan "Unknown" -> "Unlock failed" sessizliği oluyordu
  // (write öncesi guard bunu çoğu zaman yakalar, ama chainId'yi yanlış
  // bildiren cüzdanlarda son savunma hattı burası).
  if (error.walk((e) => e instanceof ChainMismatchError)) return "WrongNetwork";

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
  const { isConnected, isConnecting, isReconnecting, chainId: walletChainId } = useAccount();

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
    reset: resetWrite,
  } = useWriteContract();

  // wagmi v3: switchChain/switchChainAsync deprecated; karşılıkları
  // mutate/mutateAsync. mutateAsync (mutate'ten farklı olarak) red/hata
  // durumunda reject eder -> try/catch şart.
  // (wagmi.sh/react/api/hooks/useSwitchChain)
  const { mutateAsync: switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  // Write öncesi guard'ların hata kanalı. wagmi'den gelmeyen hatalar
  // (bağlı değil / yanlış ağ) writeError'a düşemez, bu state'ten akar.
  const [guardError, setGuardError] = useState<UnlockErrorKind | null>(null);

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

  // Ağ değiştirme onayı bekleniyor VEYA cüzdan onayı bekleniyor VEYA tx
  // zincirde onay bekliyor. Switch'i de saymazsak buton o aralıkta aktif
  // kalıp ikinci bir cüzdan penceresi açtırabilirdi.
  const isBusy = isWritePending || isConfirming || isSwitchPending;

  // reconnectOnMount (default true) yüzünden F5'ten hemen sonra isConnected
  // kısa süre false olur — bu "bağlı değil" DEĞİL, "henüz bilinmiyor"dur.
  // UI butonu bu bilgiyle bekletiyor, guard da bu sırada karar vermiyor.
  const isWalletConnecting = isConnecting || isReconnecting;

  // Guard hatasını bir mikro-tick SONRA yazar. Sebep: BoardCard aynı tıklama
  // handler'ında önce reset() ile guardError'ı null'lıyor, hemen ardından
  // unlock() çağırıyor. Senkron yazsaydık iki güncelleme aynı React batch'ine
  // düşerdi; hata bir öncekiyle aynıysa (ör. arka arkaya iki kez "cüzdan bağlı
  // değil") state hiç değişmez, BoardCard'ın terminal-hata effect'i tetiklenmez
  // -> mesaj görünmez ve unlock kilidi hiç açılmazdı. Bir tick beklemek null'ı
  // ayrı bir render'a commit ettirir, geçiş gerçek olur.
  const failGuard = useCallback(async (kind: UnlockErrorKind) => {
    await Promise.resolve();
    setGuardError(kind);
  }, []);

  // async, ama ASLA reject etmez: tüm hatalar guardError'a yazılır. Çağıran
  // taraf bugünkü gibi await etmeden çağırabilir, unhandled rejection olmaz.
  // Write yolu declarative kalıyor — guard'lar geçilince yine senkron
  // writeUnlock (mutate) çağrılıyor, sonrasındaki akış hiç değişmedi.
  const unlock = useCallback(
    async (boardId: number) => {
      if (isBusy) return; // çift-tık guard: ikinci tx penceresi açma
      if (!CONTRACT_ADDRESS) return;
      if (unlockPrice === undefined) return; // fiyat okunmadan ödeme gönderme

      // Reconnect bitmeden "bağlı değil" demek yanlış olurdu. Buton bu sırada
      // zaten disabled; buradaki sessiz dönüş savunma amaçlı.
      if (isWalletConnecting && !isConnected) return;

      if (!isConnected) {
        await failGuard("NotConnected");
        return; // write'a hiç gidilmiyor
      }

      // Yanlış ağ: switch BİR KEZ denenir. Başarısızsa durulur — otomatik
      // tekrar yok, dolayısıyla döngü de yok; kullanıcı yeniden tıklamalı.
      if (walletChainId !== ACTIVE_CHAIN.id) {
        try {
          const switched = await switchChainAsync({ chainId: ACTIVE_CHAIN.id });
          // switchChain geçilen Chain'i döndürüyor. Doğrulamayı bu dönen
          // değerle yapıyoruz: walletChainId closure'da bayat kalır, await
          // sonrası tekrar okumak yanlış cevap verirdi.
          if (switched.id !== ACTIVE_CHAIN.id) {
            await failGuard("WrongNetwork");
            return;
          }
        } catch {
          // Kullanıcının switch'i reddetmesi de, cüzdanın switch'i
          // beceremeyişi de aynı kapı: "Switch to Base Sepolia".
          await failGuard("WrongNetwork");
          return;
        }
      }

      setGuardError(null);

      writeUnlock({
        address: CONTRACT_ADDRESS,
        abi: PEG_SOLITAIRE_BOARDS_ABI,
        functionName: "unlockBoard",
        args: [boardId],
        value: unlockPrice,
        chainId: ACTIVE_CHAIN.id,
        // ERC-8021 builder code. Kod env'de yokken undefined -> viem calldata'ya
        // hiçbir şey eklemez, tx aynen bugünkü gibi gider.
        dataSuffix: DATA_SUFFIX,
      });
    },
    [
      isBusy,
      isConnected,
      isWalletConnecting,
      walletChainId,
      unlockPrice,
      switchChainAsync,
      failGuard,
      writeUnlock,
    ],
  );

  // Tek reset: write hatasını da guard hatasını da temizler. BoardCard yeni
  // denemeden önce bunu çağırıyor -> eski "Switch to Base Sepolia" bir an
  // görünmüyor.
  const reset = useCallback(() => {
    setGuardError(null);
    resetWrite();
  }, [resetWrite]);

  // viem'in waitForTransactionReceipt'i revert eden tx'te THROW ETMEZ;
  // status: "reverted" olan bir receipt ile başarıyla resolve olur.
  // Bu yüzden query'nin isSuccess'ine değil receipt.status'e bakılıyor.
  const isSuccess = receipt?.status === "success";
  const isReverted = receipt?.status === "reverted";

  const error = writeError ?? receiptError ?? null;

  // guardError önce: write hiç başlamadıysa zaten wagmi tarafında hata yok,
  // varsa da bir önceki denemeden kalmadır — güncel karar guard'ındır.
  const errorKind: UnlockErrorKind | null =
    guardError ??
    (error
      ? toErrorKind(error)
      : isReverted
        ? "Unknown" // receipt revert'i hangi custom error olduğunu taşımıyor
        : null);

  return {
    unlock,
    isBusy,
    isWalletConnecting, // UI: reconnect biterken butonu bekletmek için
    isSuccess,
    errorKind,
    error,
    txHash,
    unlockPrice, // UI fiyatı göstersin diye; value hesabı yukarıda, değişmedi
    reset, // hash'i + guard hatasını temizler -> durum sıfırlanır
  };
}
