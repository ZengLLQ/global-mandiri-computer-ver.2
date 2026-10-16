package clock

import "time"

type Clock interface {
	Now() time.Time
}

type RealClock struct{}

func New() Clock {
	return &RealClock{}
}

func (c *RealClock) Now() time.Time {
	return time.Now().UTC()
}

type MockClock struct {
	Current time.Time
}

func NewMock(t time.Time) *MockClock {
	return &MockClock{Current: t}
}

func (m *MockClock) Now() time.Time {
	return m.Current
}

func (m *MockClock) Advance(d time.Duration) {
	m.Current = m.Current.Add(d)
}
