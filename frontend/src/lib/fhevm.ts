import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web"
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web"

let instance: FhevmInstance | null = null

export async function getFhevmInstance(): Promise<FhevmInstance> {
  if (instance) return instance
  instance = await createInstance({
    ...SepoliaConfig,
    network: window.ethereum,
    chainId: 11155111,
  })
  return instance
}

export function resetFhevmInstance() {
  instance = null
}
