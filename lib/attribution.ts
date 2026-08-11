// ERC-8021 builder code attribution (Base builder rewards).
//
// Builder code base.dev kaydından sonra .env'e NEXT_PUBLIC_BUILDER_CODE olarak
// eklenecek. Kod yokken/boşken DATA_SUFFIX undefined kalır: viem parametreyi
// yok sayar, calldata'ya hiçbir şey eklenmez, unlockBoard normal çalışır.
// Yani mainnet'te yapılacak TEK iş env'e kodu yazmak.
//
// NEDEN config-level DEĞİL: Base dokümanı suffix'i wagmi createConfig'e koymayı
// öneriyor ve kurulu @wagmi/core (2.22.1) bunu TİP düzeyinde kabul ediyor
// (createConfig.d.ts'teki ClientConfig, viem'in ClientConfig'inden dataSuffix'i
// omit etmiyor). Ama runtime'da uygulanmıyor: createConfig rest-spread'i sadece
// okuma client'ına (config.getClient()) geçiyor, writeContract ise cüzdan
// hesabında getConnectorClient() ile SIFIRDAN client kuruyor
// (createClient({ account, chain, name, transport })) ve config'in client
// opsiyonlarını taşımıyor. Sonuç: build temiz geçer, tx gider, attribution hiç
// eklenmez. O yüzden suffix write çağrısına parametre olarak veriliyor —
// viem writeContract -> sendTransaction zincirinde calldata'ya concat edilmesi
// garanti (sendTransaction: data = concat([data, dataSuffix])).

import { Attribution } from "ox/erc8021";

const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE;

export const DATA_SUFFIX = BUILDER_CODE
  ? Attribution.toDataSuffix({ codes: [BUILDER_CODE] })
  : undefined;
