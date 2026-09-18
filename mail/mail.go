package mail

import (
	"errors"
	"fmt"
	"net/smtp"
	"os"
)

// SendPasswordResetEmail emails a password reset link to the given address.
// SMTP settings are read from the environment (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, SMTP_FROM). If SMTP_HOST is unset, delivery fails unless
// DEV_LOG_RESET_LINKS=true is explicitly set, in which case the link is
// printed to the console instead so local development works without a real
// SMTP server. Never enable DEV_LOG_RESET_LINKS outside local development —
// reset links grant account takeover and must not land in shared logs.
func SendPasswordResetEmail(to, resetLink string) error {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		if os.Getenv("DEV_LOG_RESET_LINKS") == "true" {
			fmt.Printf("[mail] SMTP_HOST not configured; password reset link for %s: %s\n", to, resetLink)
			return nil
		}
		return errors.New("email delivery is not configured (set SMTP_HOST, or DEV_LOG_RESET_LINKS=true for local development)")
	}

	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = user
	}

	subject := "Reset your password"
	body := fmt.Sprintf(
		"We received a request to reset your password.\r\n\r\n"+
			"Reset your password using the link below (expires in 1 hour):\r\n%s\r\n\r\n"+
			"If you didn't request this, you can safely ignore this email.\r\n",
		resetLink,
	)
	msg := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=\"utf-8\"\r\n\r\n%s",
		from, to, subject, body,
	)

	addr := fmt.Sprintf("%s:%s", host, port)
	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
}
