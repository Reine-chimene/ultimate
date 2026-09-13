"""Supported UI languages for ULTIMATE accounts."""

from dataclasses import dataclass


@dataclass(frozen=True)
class LanguageInfo:
    code: str
    label: str


SUPPORTED_LANGUAGES: dict[str, LanguageInfo] = {
    "fr": LanguageInfo("fr", "Français"),
    "en": LanguageInfo("en", "English"),
    "es": LanguageInfo("es", "Español"),
    "pt": LanguageInfo("pt", "Português"),
}

DEFAULT_LANGUAGE = "fr"


def is_supported_language(code: str) -> bool:
    return code.lower() in SUPPORTED_LANGUAGES
