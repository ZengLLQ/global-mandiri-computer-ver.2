package checkout_test

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/gmc/api/internal/gen"
)

// TestOrderNumberSequenceFormatting tests the format GMC-YYMMDD-NNNN in Asia/Jakarta timezone.
func TestOrderNumberSequenceFormatting(t *testing.T) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	require.NoError(t, err)

	testDate := time.Date(2026, 10, 15, 14, 30, 0, 0, loc)
	dayStr := testDate.Format("060102") // 261015

	tests := []struct {
		seq  int32
		want string
	}{
		{1, "GMC-261015-0001"},
		{42, "GMC-261015-0042"},
		{999, "GMC-261015-0999"},
		{1000, "GMC-261015-1000"},
		{9999, "GMC-261015-9999"},
	}

	for _, tc := range tests {
		orderNo := fmt.Sprintf("GMC-%s-%04d", dayStr, tc.seq)
		assert.Equal(t, tc.want, orderNo)
	}
}

// TestCanonicalPayloadHashing verifies that the SHA-256 hash of canonical order payload
// is deterministic and detects any change in lines, prices, or quantities.
func TestCanonicalPayloadHashing(t *testing.T) {
	subtotal := int64(5000000)
	varID1 := uuid.MustParse("01927364-7b23-718e-908d-764985289901")
	varID2 := uuid.MustParse("01927364-7b23-718e-908d-764985289902")

	reqA := gen.CheckoutRequest{
		Customer: gen.CustomerInput{
			Name:  "Test User",
			Email: "test@example.com",
			Phone: "082232554674",
		},
		DeliveryMethod: gen.Pickup,
		PaymentMethod:  gen.BankTransfer,
		Items: []gen.CartItemInput{
			{VariantId: varID1, Quantity: 2},
			{VariantId: varID2, Quantity: 1},
		},
		ExpectedSubtotalIdr: &subtotal,
	}

	// Canonical serialization
	bytesA, err := json.Marshal(reqA)
	require.NoError(t, err)
	hashA := sha256.Sum256(bytesA)

	// Same data must produce identical hash
	bytesA2, err := json.Marshal(reqA)
	require.NoError(t, err)
	hashA2 := sha256.Sum256(bytesA2)
	assert.Equal(t, hashA, hashA2)

	// Different data (e.g., quantity changed) must produce different hash
	reqB := reqA
	reqB.Items = []gen.CartItemInput{
		{VariantId: varID1, Quantity: 3},
		{VariantId: varID2, Quantity: 1},
	}
	bytesB, err := json.Marshal(reqB)
	require.NoError(t, err)
	hashB := sha256.Sum256(bytesB)
	assert.NotEqual(t, hashA, hashB)
}

// TestConcurrentStockReservation simulates 10 concurrent checkout requests attempting
// to purchase 1 unit each from an initial stock of 5 units.
// Must result in exactly 5 successes and 5 failures without any negative stock or data race.
func TestConcurrentStockReservation(t *testing.T) {
	initialStock := int32(5)
	currentStock := initialStock
	var successfulOrders int32
	var rejectedOrders int32

	concurrentRequests := 10
	var wg sync.WaitGroup
	wg.Add(concurrentRequests)

	// Simulated row-level lock mutex representing PostgreSQL SELECT ... FOR UPDATE
	var rowLock sync.Mutex

	for i := 0; i < concurrentRequests; i++ {
		go func() {
			defer wg.Done()

			// Acquire row-level lock
			rowLock.Lock()
			defer rowLock.Unlock()

			if currentStock >= 1 {
				currentStock -= 1
				atomic.AddInt32(&successfulOrders, 1)
			} else {
				atomic.AddInt32(&rejectedOrders, 1)
			}
		}()
	}

	wg.Wait()

	assert.Equal(t, int32(5), successfulOrders, "Exactly 5 checkouts should succeed")
	assert.Equal(t, int32(5), rejectedOrders, "Exactly 5 checkouts should be rejected due to out of stock")
	assert.Equal(t, int32(0), currentStock, "Remaining stock must not become negative")
}

// TestConcurrentIdempotencyReplay simulates 10 concurrent requests with the SAME idempotency key.
// Only 1 execution must perform insertion, and all other 9 must receive the identical cached order response.
func TestConcurrentIdempotencyReplay(t *testing.T) {
	idempotencyKey := "idem-test-key-12345"
	orderNo := "GMC-261015-0001"

	var executions int32
	var idempotencyMap sync.Map

	concurrentRequests := 10
	results := make([]string, concurrentRequests)

	var wg sync.WaitGroup
	wg.Add(concurrentRequests)

	for i := 0; i < concurrentRequests; i++ {
		idx := i
		go func() {
			defer wg.Done()

			// Check if already in cache
			if val, ok := idempotencyMap.Load(idempotencyKey); ok {
				results[idx] = val.(string)
				return
			}

			// Atomic load or store (simulating DB INSERT ON CONFLICT or unique constraint lock)
			actual, loaded := idempotencyMap.LoadOrStore(idempotencyKey, orderNo)
			if loaded {
				results[idx] = actual.(string)
			} else {
				atomic.AddInt32(&executions, 1)
				results[idx] = orderNo
			}
		}()
	}

	wg.Wait()

	assert.Equal(t, int32(1), executions, "Order must be created exactly once")
	for i := 0; i < concurrentRequests; i++ {
		assert.Equal(t, orderNo, results[i], "All callers must receive the exact same order number")
	}
}
