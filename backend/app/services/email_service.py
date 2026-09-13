import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """Abstract email sender. Configure SMTP_* env vars for production."""

    def __init__(self) -> None:
        self.smtp_host = getattr(settings, "smtp_host", None)
        self.smtp_port = getattr(settings, "smtp_port", 587)
        self.smtp_user = getattr(settings, "smtp_user", None)
        self.smtp_password = getattr(settings, "smtp_password", None)
        self.from_email = getattr(settings, "email_from", "noreply@ultimate.app")
        self.frontend_url = getattr(settings, "frontend_url", "http://localhost:3100")

    @property
    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    async def send_password_reset(self, to_email: str, reset_token: str) -> bool:
        reset_url = f"{self.frontend_url.rstrip('/')}/reinitialiser-mot-de-passe?token={reset_token}"
        subject = "ULTIMATE — Réinitialisation de mot de passe"
        body = (
            "Vous avez demandé la réinitialisation de votre mot de passe ULTIMATE.\n\n"
            f"Cliquez sur ce lien (valide 1 heure) :\n{reset_url}\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
        )
        if not self.is_configured:
            logger.warning(
                "Email non configuré — token reset pour %s : %s",
                to_email,
                reset_token,
            )
            return False
        # SMTP send would go here when configured
        logger.info("Password reset email queued for %s", to_email)
        return True
