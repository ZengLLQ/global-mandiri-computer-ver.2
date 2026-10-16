package whatsapp_test

import (
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/gmc/api/internal/platform/whatsapp"
)

func TestFormatRupiah(t *testing.T) {
	tests := []struct {
		input int64
		want  string
	}{
		{0, "0"},
		{50, "50"},
		{500, "500"},
		{1000, "1.000"},
		{15990, "15.990"},
		{150000, "150.000"},
		{1599000, "1.599.000"},
		{25000000, "25.000.000"},
		{123456789, "123.456.789"},
	}

	for _, tc := range tests {
		got := whatsapp.FormatRupiah(tc.input)
		assert.Equal(t, tc.want, got, "amount: %d", tc.input)
	}
}

func TestBuildOrderConfirmationURL(t *testing.T) {
	items := []whatsapp.OrderItemSummary{
		{
			Name:         "AMD Ryzen 7 7800X3D",
			VariantLabel: "Box",
			Quantity:     1,
			LineTotalIdr: 7299000,
		},
		{
			Name:         "Kingston Fury Beast DDR5 32GB",
			VariantLabel: "6000MHz RGB",
			Quantity:     2,
			LineTotalIdr: 3998000,
		},
	}

	waURL := whatsapp.BuildOrderConfirmationURL(
		"6282232554674",
		"Global Mandiri Computer",
		"GMC-261014-0001",
		"Budi Santoso",
		"pickup",
		"Surabaya",
		items,
		11297000,
	)

	require.NotEmpty(t, waURL)
	assert.True(t, strings.HasPrefix(waURL, "https://wa.me/6282232554674?text="))

	parsed, err := url.Parse(waURL)
	require.NoError(t, err)

	text := parsed.Query().Get("text")
	assert.Contains(t, text, "GMC-261014-0001")
	assert.Contains(t, text, "Budi Santoso")
	assert.Contains(t, text, "Ambil di toko")
	assert.Contains(t, text, "AMD Ryzen 7 7800X3D")
	assert.Contains(t, text, "Box")
	assert.Contains(t, text, "Kingston Fury Beast DDR5 32GB")
	assert.Contains(t, text, "11.297.000")
	assert.Contains(t, text, "Global Mandiri Computer")
}

func TestBuildContactInquiryURL(t *testing.T) {
	waURL := whatsapp.BuildContactInquiryURL(
		"6282232554674",
		"Global Mandiri Computer",
		"Riko Pratama",
		"order",
		"Halo, saya ingin menanyakan status pesanan saya.",
	)

	require.NotEmpty(t, waURL)
	assert.True(t, strings.HasPrefix(waURL, "https://wa.me/6282232554674?text="))

	parsed, err := url.Parse(waURL)
	require.NoError(t, err)

	text := parsed.Query().Get("text")
	assert.Contains(t, text, "Riko Pratama")
	assert.Contains(t, text, "order")
	assert.Contains(t, text, "Halo, saya ingin menanyakan status pesanan saya.")
}
