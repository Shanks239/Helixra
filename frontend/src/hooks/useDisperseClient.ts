import { useMemo } from "react"
import { usePublicClient, useWalletClient } from "wagmi"
import { createConfidentialDisperseClient } from "@tokenops/sdk/fhe-disperse"
import { getFhevmInstance } from "../lib/fhevm"

export function useDisperseClient() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const client = useMemo(() => {
    if (!publicClient) return null
    return createConfidentialDisperseClient({
      publicClient,
      walletClient: walletClient ?? undefined,
      // Lazy encryptor: the factory must return synchronously, but the FHEVM
      // instance loads asynchronously — so we return an Encryptor whose
      // `encrypt` awaits the instance at call time instead of racing it.
      encryptor: () => ({
        encrypt: async ({ values, contractAddress, userAddress }) => {
          const inst = await getFhevmInstance()
          const input = inst.createEncryptedInput(contractAddress, userAddress)
          for (const v of values) {
            if (v.type === "euint64") input.add64(v.value as bigint)
          }
          return input.encrypt()
        },
      }),
    })
  }, [publicClient, walletClient])

  return client
}
