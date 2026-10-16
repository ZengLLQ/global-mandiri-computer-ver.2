package httpx

import (
	"encoding/json"
	"net/http"

	"github.com/gmc/api/internal/gen"
)

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code      gen.ErrorCode      `json:"code"`
	Message   string             `json:"message"`
	RequestID string             `json:"requestId"`
	Fields    map[string]string `json:"fields,omitempty"`
}

func (e *ErrorResponse) StatusCode() int {
	switch e.Error.Code {
	case gen.ErrorCodeBadRequest:
		return http.StatusBadRequest
	case gen.ErrorCodeValidationFailed:
		return http.StatusUnprocessableEntity
	case gen.ErrorCodeUnauthorized, gen.ErrorCodeTokenExpired, gen.ErrorCodeInvalidCredentials:
		return http.StatusUnauthorized
	case gen.ErrorCodeForbidden:
		return http.StatusForbidden
	case gen.ErrorCodeNotFound:
		return http.StatusNotFound
	case gen.ErrorCodeConflict, gen.ErrorCodeEmailTaken, gen.ErrorCodeOutOfStock, gen.ErrorCodePriceChanged, gen.ErrorCodeIdempotencyConflict:
		return http.StatusConflict
	case gen.ErrorCodeRateLimited:
		return http.StatusTooManyRequests
	default:
		return http.StatusInternalServerError
	}
}

func WriteError(w http.ResponseWriter, requestID string, code gen.ErrorCode, message string, fields map[string]string) {
	errResp := ErrorResponse{
		Error: ErrorDetail{
			Code:      code,
			Message:   message,
			RequestID: requestID,
			Fields:    fields,
		},
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(errResp.StatusCode())
	_ = json.NewEncoder(w).Encode(errResp)
}

func NewError(requestID string, code gen.ErrorCode, message string, fields map[string]string) *ErrorResponse {
	return &ErrorResponse{
		Error: ErrorDetail{
			Code:      code,
			Message:   message,
			RequestID: requestID,
			Fields:    fields,
		},
	}
}
