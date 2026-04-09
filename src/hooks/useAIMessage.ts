import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  supabase,
} from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  AIMessageErrorCode,
  AIMessageErrorResponse,
  GenerateMessageRequest,
  GenerateMessageResponse,
  AIMessageVariant,
} from '@/lib/messages/types'

interface UseAIMessageReturn {
  generate: (req: GenerateMessageRequest) => Promise<AIMessageVariant[] | null>
  isGenerating: boolean
}

const AI_ERROR_CODES: AIMessageErrorCode[] = [
  'missing_config',
  'network_error',
  'unauthorized',
  'forbidden',
  'rate_limit',
  'invalid_request',
  'function_runtime_error',
  'unknown_error',
]

function isAIMessageErrorCode(value: unknown): value is AIMessageErrorCode {
  return typeof value === 'string' && AI_ERROR_CODES.includes(value as AIMessageErrorCode)
}

function mapStatusToErrorCode(status?: number): AIMessageErrorCode {
  switch (status) {
    case 400:
    case 422:
      return 'invalid_request'
    case 401:
      return 'unauthorized'
    case 403:
      return 'forbidden'
    case 429:
      return 'rate_limit'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'function_runtime_error'
    default:
      return 'unknown_error'
  }
}

function getErrorMessageKey(code: AIMessageErrorCode) {
  switch (code) {
    case 'missing_config':
      return 'messages.ai.errors.missingConfig'
    case 'network_error':
      return 'messages.ai.errors.network'
    case 'unauthorized':
      return 'messages.ai.errors.unauthorized'
    case 'forbidden':
      return 'messages.ai.errors.forbidden'
    case 'rate_limit':
      return 'messages.ai.errors.rateLimit'
    case 'invalid_request':
      return 'messages.ai.errors.invalidRequest'
    case 'function_runtime_error':
      return 'messages.ai.errors.runtime'
    case 'unknown_error':
    default:
      return 'messages.ai.errors.unknown'
  }
}

async function readFunctionError(response: Response): Promise<AIMessageErrorResponse | null> {
  try {
    const payload = await response.clone().json() as Partial<AIMessageErrorResponse>
    if (!isAIMessageErrorCode(payload.code)) {
      return null
    }

    return {
      code: payload.code,
      message: typeof payload.message === 'string' ? payload.message : '',
      details: typeof payload.details === 'string' ? payload.details : undefined,
    }
  } catch {
    return null
  }
}

export function useAIMessage(): UseAIMessageReturn {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async (req: GenerateMessageRequest): Promise<AIMessageVariant[] | null> => {
    if (isGenerating) return null
    setIsGenerating(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const invokePromise = supabase.functions.invoke('generate-message', {
        body: req,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('request_timeout')), 15000)
      })

      const { data, error } = await Promise.race([invokePromise, timeoutPromise])

      if (error) throw error

      const response = data as GenerateMessageResponse
      if (!Array.isArray(response?.variants) || response.variants.length === 0) {
        console.error('[useAIMessage] Invalid response shape:', response)
        toast.error(t('messages.ai.errors.runtime'))
        return null
      }

      return response.variants ?? null
    } catch (err) {
      let classifiedError: AIMessageErrorResponse = {
        code: 'unknown_error',
        message: 'Unknown error',
      }

      if (err instanceof FunctionsHttpError && err.context instanceof Response) {
        classifiedError = (await readFunctionError(err.context)) ?? {
          code: mapStatusToErrorCode(err.context.status),
          message: err.context.statusText || err.message,
          details: `http_${err.context.status}`,
        }
      } else if (err instanceof FunctionsRelayError) {
        classifiedError = {
          code: 'function_runtime_error',
          message: err.message,
          details: 'relay_error',
        }
      } else if (err instanceof FunctionsFetchError) {
        classifiedError = {
          code: 'network_error',
          message: err.message,
          details: 'fetch_error',
        }
      } else if (err instanceof Error && err.message === 'request_timeout') {
        classifiedError = {
          code: 'network_error',
          message: err.message,
          details: 'request_timeout',
        }
      } else if (err instanceof Error && /network|failed to fetch/i.test(err.message)) {
        classifiedError = {
          code: 'network_error',
          message: err.message,
        }
      }

      console.error('[useAIMessage] generate error:', {
        code: classifiedError.code,
        details: classifiedError.details,
        error: err,
      })
      toast.error(t(getErrorMessageKey(classifiedError.code)))
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating }
}
