import {
  ApolloError,
  useMutation,
  type DocumentNode,
  type MutationHookOptions,
  type MutationTuple,
  type OperationVariables,
  type TypedDocumentNode,
} from '@apollo/client';
import { useCallback } from 'react';
import { useNotify } from './notification-context';
import type { LocalizedMessage, MaybeLocalizedMessage } from './types';

type MessageInput<TData, TArg> =
  | MaybeLocalizedMessage
  | ((arg: TArg, data?: TData) => MaybeLocalizedMessage | null | undefined);

export interface IAppMutationOptions<TData, TVariables extends OperationVariables>
  extends Omit<MutationHookOptions<TData, TVariables>, 'onCompleted' | 'onError'> {
  /** Show success notification. Default: true. */
  notifyOnSuccess?: boolean;
  /** Show error notification. Default: true. */
  notifyOnError?: boolean;
  /**
   * Override the success message. If omitted, the hook reads
   * `data.<mutationName>.message` (supporting string or `{vi,en}`) and
   * falls back to `fallbackSuccess` or a generic label.
   */
  successMessage?: MessageInput<TData, TData>;
  /** Override the error message. Defaults to BE error message. */
  errorMessage?: MessageInput<TData, ApolloError>;
  /** Fallback text when no BE message found on success. */
  fallbackSuccess?: MaybeLocalizedMessage;
  /** Fallback text when no BE message found on error. */
  fallbackError?: MaybeLocalizedMessage;
  /** Extra work after the success notification (invalidate, navigate, etc). */
  onSuccess?: (data: TData) => void;
  /** Extra work after the error notification. */
  onError?: (error: ApolloError) => void;
}

const DEFAULT_SUCCESS: LocalizedMessage = { vi: 'Thành công', en: 'Success' };
const DEFAULT_ERROR: LocalizedMessage = { vi: 'Đã xảy ra lỗi', en: 'Something went wrong' };

/** Walk the Apollo mutation response and pick out a `message` field, if any. */
function pickMessageFromData(data: unknown): MaybeLocalizedMessage | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const top = data as Record<string, unknown>;
  if ('message' in top) return top.message as MaybeLocalizedMessage;
  for (const key of Object.keys(top)) {
    const value = top[key];
    if (value && typeof value === 'object' && 'message' in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>).message as MaybeLocalizedMessage;
    }
  }
  return undefined;
}

/** Extract a readable error message from an ApolloError, preferring `{vi,en}` from extensions. */
function pickMessageFromError(error: ApolloError): MaybeLocalizedMessage | undefined {
  const gqlErr = error.graphQLErrors?.[0];
  const ext = gqlErr?.extensions as
    | { message?: MaybeLocalizedMessage; localizedMessage?: LocalizedMessage }
    | undefined;
  if (ext?.message) return ext.message;
  if (ext?.localizedMessage) return ext.localizedMessage;
  if (gqlErr?.message) return gqlErr.message;
  return error.message || undefined;
}

function resolveMessageInput<TData, TArg>(
  input: MessageInput<TData, TArg> | undefined,
  arg: TArg,
  data?: TData,
): MaybeLocalizedMessage | undefined {
  if (input == null) return undefined;
  if (typeof input === 'function') {
    const result = (input as (arg: TArg, data?: TData) => MaybeLocalizedMessage | null | undefined)(
      arg,
      data,
    );
    return result ?? undefined;
  }
  return input;
}

/**
 * Apollo `useMutation` wrapper with default antd notification behaviour.
 *
 * - On success: shows a notification resolved from the BE response's `message`
 *   (supports `string` or `{ vi, en }`), unless explicitly disabled or overridden.
 * - On error: shows a notification resolved from the BE error.
 * - `onSuccess` / `onError` let callers layer extra work (refetch, navigate, …)
 *   *after* the default notification has been displayed.
 */
export function useAppMutation<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options: IAppMutationOptions<TData, TVariables> = {},
): MutationTuple<TData, TVariables> {
  const {
    notifyOnSuccess = true,
    notifyOnError = true,
    successMessage,
    errorMessage,
    fallbackSuccess,
    fallbackError,
    onSuccess,
    onError,
    ...apolloOptions
  } = options;

  const notify = useNotify();

  const handleCompleted = useCallback(
    (data: TData) => {
      if (notifyOnSuccess) {
        const override = resolveMessageInput(successMessage, data, data);
        const fromData = pickMessageFromData(data);
        const msg = override ?? fromData ?? fallbackSuccess ?? DEFAULT_SUCCESS;
        notify.success(msg);
      }
      onSuccess?.(data);
    },
    [notify, notifyOnSuccess, successMessage, fallbackSuccess, onSuccess],
  );

  const handleError = useCallback(
    (error: ApolloError) => {
      if (notifyOnError) {
        const override = resolveMessageInput(errorMessage, error);
        const fromError = pickMessageFromError(error);
        const msg = override ?? fromError ?? fallbackError ?? DEFAULT_ERROR;
        notify.error(msg);
      }
      onError?.(error);
    },
    [notify, notifyOnError, errorMessage, fallbackError, onError],
  );

  // NOTE: `onError` is intentionally NOT passed to useMutation. When an onError handler is
  // set, Apollo swallows the rejection and resolves the promise (and the errors are not even
  // placed on `result.errors`), so callers can't tell success from failure → a FormModal would
  // close on error. Instead we catch in `safeMutate`, show the toast ourselves, then RE-THROW
  // so awaiters (e.g. FormModal) stay open on failure. Success notifications stay on onCompleted.
  const [mutate, state] = useMutation<TData, TVariables>(mutation, {
    ...apolloOptions,
    onCompleted: handleCompleted,
  });

  const safeMutate = useCallback<typeof mutate>(
    async (options) => {
      let result: Awaited<ReturnType<typeof mutate>>;
      try {
        result = await mutate(options);
      } catch (err) {
        // Default errorPolicy ('none'): GraphQL + network errors reject here.
        handleError(err as ApolloError);
        throw err;
      }
      // errorPolicy 'all': errors resolve onto the result instead of rejecting.
      if (result?.errors && result.errors.length > 0) {
        const apolloError = new ApolloError({
          errorMessage: result.errors[0]?.message ?? 'Mutation failed',
        });
        handleError(apolloError);
        throw apolloError;
      }
      return result;
    },
    [mutate, handleError],
  );

  return [safeMutate, state];
}
