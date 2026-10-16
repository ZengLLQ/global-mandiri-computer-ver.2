package whatsapp

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

type OrderItemSummary struct {
	Name         string
	VariantLabel string
	Quantity     int
	LineTotalIdr int64
}

// FormatRupiah formats integer IDR with dots as thousand separators (e.g., 1.500.000).
func FormatRupiah(amount int64) string {
	s := strconv.FormatInt(amount, 10)
	n := len(s)
	if n <= 3 {
		return s
	}

	var result strings.Builder
	remainder := n % 3
	if remainder > 0 {
		result.WriteString(s[:remainder])
		if n > remainder {
			result.WriteString(".")
		}
	}
	for i := remainder; i < n; i += 3 {
		result.WriteString(s[i : i+3])
		if i+3 < n {
			result.WriteString(".")
		}
	}
	return result.String()
}

// BuildOrderConfirmationURL builds the authoritative WhatsApp link for order confirmation.
func BuildOrderConfirmationURL(
	waNumber string,
	storeName string,
	orderNo string,
	customerName string,
	deliveryMethod string,
	city string,
	items []OrderItemSummary,
	totalIdr int64,
) string {
	var methodStr string
	if deliveryMethod == "pickup" {
		methodStr = "Ambil di toko"
	} else {
		if city != "" {
			methodStr = fmt.Sprintf("Kirim ke %s", city)
		} else {
			methodStr = "Kirim ke alamat"
		}
	}

	var itemsBuilder strings.Builder
	limit := 15
	for i, item := range items {
		if i >= limit {
			extra := len(items) - limit
			itemsBuilder.WriteString(fmt.Sprintf("+%d produk lainnya\n", extra))
			break
		}

		label := item.VariantLabel
		if label != "" {
			label = fmt.Sprintf(" (%s)", label)
		}
		itemsBuilder.WriteString(fmt.Sprintf("%d. %s%s x%d - Rp %s\n",
			i+1, item.Name, label, item.Quantity, FormatRupiah(item.LineTotalIdr),
		))
	}

	msg := fmt.Sprintf(
		"Halo %s, saya ingin konfirmasi pesanan:\n\n"+
			"No. Pesanan: %s\n"+
			"Nama: %s\n"+
			"Metode: %s\n\n"+
			"Pesanan:\n%s\n"+
			"Total: Rp %s\n\n"+
			"Mohon info total ongkir & ketersediaan. Terima kasih.",
		storeName,
		orderNo,
		customerName,
		methodStr,
		itemsBuilder.String(),
		FormatRupiah(totalIdr),
	)

	return fmt.Sprintf("https://wa.me/%s?text=%s", waNumber, url.QueryEscape(msg))
}

// BuildProductInquiryURL builds the WhatsApp URL for inquiring about a specific product.
func BuildProductInquiryURL(waNumber, storeName, productName, productURL string) string {
	msg := fmt.Sprintf("Halo %s, saya tertarik dengan %s (%s)", storeName, productName, productURL)
	return fmt.Sprintf("https://wa.me/%s?text=%s", waNumber, url.QueryEscape(msg))
}

// BuildContactInquiryURL builds the WhatsApp URL for a contact form submission.
func BuildContactInquiryURL(waNumber, storeName, name, subject, message string) string {
	msg := fmt.Sprintf(
		"Halo %s, saya %s.\n\nSubjek: %s\nPesan:\n%s",
		storeName, name, subject, message,
	)
	return fmt.Sprintf("https://wa.me/%s?text=%s", waNumber, url.QueryEscape(msg))
}
