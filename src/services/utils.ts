import type { ResponseError, ResponseOK, errorTypes } from "../types";
import { ERROR, SUCCESS, type ErrorCode } from "./RequestConsts";


function normalizeError (error: errorTypes): ErrorCode {
    const code = (error.response?.status && `HTTP_${error.response?.status}`) || error.code || "";

    if (code in ERROR) {
        return code as ErrorCode;
    }

    return 'UNKNOWN';
}
function successResponse<T>(_data: T | null): ResponseOK<T | null> {
    const status = SUCCESS.status;
    const data = _data || null;
    return {
        status, data
    };
}

function errorResponse(error: errorTypes): ResponseError {
    const errorId = normalizeError(error);
    return {
        status: "error",
        error: ERROR[errorId].message || ""
    }
}

export { successResponse, errorResponse };