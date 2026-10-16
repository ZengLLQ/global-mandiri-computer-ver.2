-- name: CreateContactMessage :one
INSERT INTO contact_messages (
    id, name, email, phone, subject, message
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: CreateNewsletterSubscriber :exec
INSERT INTO newsletter_subscribers (
    id, email, name
) VALUES (
    $1, $2, $3
) ON CONFLICT (email) DO UPDATE
SET name = COALESCE(EXCLUDED.name, newsletter_subscribers.name);
