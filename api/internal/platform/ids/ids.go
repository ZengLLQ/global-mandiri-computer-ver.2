package ids

import "github.com/google/uuid"

type Generator interface {
	New() uuid.UUID
}

type UUIDv7Generator struct{}

func NewGenerator() Generator {
	return &UUIDv7Generator{}
}

func (g *UUIDv7Generator) New() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.New()
	}
	return id
}

func New() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.New()
	}
	return id
}
