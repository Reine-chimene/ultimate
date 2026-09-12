"""Country metadata for international features."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CountryInfo:
    code: str
    name: str
    name_fr: str
    flag: str
    default_timezone: str


COUNTRIES: dict[str, CountryInfo] = {
    "CA": CountryInfo("CA", "Canada", "Canada", "🇨🇦", "America/Toronto"),
    "FR": CountryInfo("FR", "France", "France", "🇫🇷", "Europe/Paris"),
    "US": CountryInfo("US", "United States", "États-Unis", "🇺🇸", "America/New_York"),
    "GB": CountryInfo("GB", "United Kingdom", "Royaume-Uni", "🇬🇧", "Europe/London"),
    "BE": CountryInfo("BE", "Belgium", "Belgique", "🇧🇪", "Europe/Brussels"),
    "CM": CountryInfo("CM", "Cameroon", "Cameroun", "🇨🇲", "Africa/Douala"),
}


def get_country(code: str) -> CountryInfo:
    return COUNTRIES.get(code.upper(), CountryInfo(code.upper(), code.upper(), code.upper(), "🌍", "UTC"))


def country_display(city: str, country_code: str) -> str:
    info = get_country(country_code)
    return f"{city}, {info.name_fr} {info.flag}"


def default_timezone_for_country(country_code: str) -> str:
    return get_country(country_code).default_timezone
