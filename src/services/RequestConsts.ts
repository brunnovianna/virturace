export type ErrorCode = 
  | 'ECONNABORTED' 
  | 'ERR_NETWORK' 
  | 'HTTP_404' 
  | 'HTTP_500'
  | 'HTTP_502'
  | 'HTTP_503'
  | 'UNKNOWN';

  export const ERROR: Record<ErrorCode, { message: string }> = {
    "ECONNABORTED": {
        "message": "A operação demorou muito para responder"
    },
    "ERR_NETWORK": {
        "message": "Verifique sua conexão com a internet"
    },
    "HTTP_404": {
        "message": "Rota não encontrada"
    },
    "HTTP_500": {
        "message": "Problema no servidor. Tente novamente."
    },
    "HTTP_502": {
        "message": "Problema no servidor. Tente novamente."
    },
    "HTTP_503": {
        "message": "Serviço temporariamente indisponível"
    },
    "UNKNOWN": {
        "message": "Algo deu errado"
    }
}

export const SUCCESS = {
    "status": "ok" as const
}