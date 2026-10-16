package cache

import (
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

type Cache interface {
	Get(key string) (any, bool)
	Set(key string, value any, ttl time.Duration)
	Delete(key string)
	Flush()
}

type item struct {
	value      any
	expiration int64
}

type MemoryCache struct {
	mu    sync.RWMutex
	items map[string]item
	group singleflight.Group
}

func NewMemoryCache() *MemoryCache {
	c := &MemoryCache{
		items: make(map[string]item),
	}
	// Background cleanup of expired items every 2 minutes
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		for range ticker.C {
			c.cleanup()
		}
	}()
	return c
}

func (c *MemoryCache) cleanup() {
	now := time.Now().UnixNano()
	c.mu.Lock()
	defer c.mu.Unlock()
	for k, it := range c.items {
		if it.expiration > 0 && now > it.expiration {
			delete(c.items, k)
		}
	}
}

func (c *MemoryCache) Get(key string) (any, bool) {
	c.mu.RLock()
	it, found := c.items[key]
	c.mu.RUnlock()

	if !found {
		return nil, false
	}
	if it.expiration > 0 && time.Now().UnixNano() > it.expiration {
		c.mu.Lock()
		delete(c.items, key)
		c.mu.Unlock()
		return nil, false
	}
	return it.value, true
}

func (c *MemoryCache) Set(key string, value any, ttl time.Duration) {
	var exp int64
	if ttl > 0 {
		exp = time.Now().Add(ttl).UnixNano()
	}
	c.mu.Lock()
	c.items[key] = item{
		value:      value,
		expiration: exp,
	}
	c.mu.Unlock()
}

func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	delete(c.items, key)
	c.mu.Unlock()
}

func (c *MemoryCache) Flush() {
	c.mu.Lock()
	c.items = make(map[string]item)
	c.mu.Unlock()
}

func (c *MemoryCache) Group() *singleflight.Group {
	return &c.group
}
