import { useMutation } from '@apollo/client';
import { message } from 'antd';
import type { DocumentNode } from '@apollo/client';

interface IUseSafeMutationOptions<TData, TVariables> {
  mutation: DocumentNode;
  /** Return custom error message string, or undefined to use default */
  onError?: (err: Error) => string;
  /** Called with mutation result on success */
  onSuccess?: (data: TData) => void;
  /** Apollo mutation options passed through */
  mutationOptions?: Parameters<typeof useMutation<TData, TVariables>>[1];
}

interface IUseSafeMutationResult<TVariables> {
  mutate: (variables: TVariables) => Promise<boolean>;
  loading: boolean;
}

/**
 * Wrapper around useMutation that automatically shows message.error() on failure.
 * Returns `mutate(variables) => Promise<boolean>` (true = success, false = error).
 */
export function useSafeMutation<TData = unknown, TVariables = Record<string, unknown>>({
  mutation,
  onError,
  onSuccess,
  mutationOptions,
}: IUseSafeMutationOptions<TData, TVariables>): IUseSafeMutationResult<TVariables> {
  const [mutateFn, { loading }] = useMutation<TData, TVariables>(mutation, mutationOptions);

  const mutate = async (variables: TVariables): Promise<boolean> => {
    try {
      const { data } = await mutateFn({ variables });
      if (data && onSuccess) onSuccess(data);
      return true;
    } catch (err) {
      const msg = onError ? onError(err as Error) : 'Thao tác thất bại';
      message.error(msg);
      return false;
    }
  };

  return { mutate, loading };
}
