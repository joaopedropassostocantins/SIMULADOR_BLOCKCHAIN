import { useQueryClient } from "@tanstack/react-query";
import {
  useGetBlockchain,
  useMineBlock,
  useAddTransaction,
  useValidateChain,
  useResetBlockchain,
  useSetDifficulty,
  getGetBlockchainQueryKey,
  getValidateChainQueryKey,
} from "@workspace/api-client-react";

/**
 * Custom wrappers around the generated Orval hooks.
 * We wrap the mutations to automatically invalidate the blockchain query,
 * keeping the UI perfectly in sync after every action.
 */

export function useBlockchainData() {
  return useGetBlockchain({
    query: {
      refetchInterval: 10000, // Refresh occasionally
    },
  });
}

export function useBlockchainValidation() {
  return useValidateChain();
}

export function useMine() {
  const queryClient = useQueryClient();
  return useMineBlock({
    mutation: {
      onSuccess: () => {
        // Invalidate both the chain and the validation status
        queryClient.invalidateQueries({ queryKey: getGetBlockchainQueryKey() });
        queryClient.invalidateQueries({ queryKey: getValidateChainQueryKey() });
      },
    },
  });
}

export function useSubmitTransaction() {
  const queryClient = useQueryClient();
  return useAddTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBlockchainQueryKey() });
      },
    },
  });
}

export function useResetChain() {
  const queryClient = useQueryClient();
  return useResetBlockchain({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBlockchainQueryKey() });
        queryClient.invalidateQueries({ queryKey: getValidateChainQueryKey() });
      },
    },
  });
}

export function useUpdateDifficulty() {
  const queryClient = useQueryClient();
  return useSetDifficulty({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBlockchainQueryKey() });
      },
    },
  });
}
