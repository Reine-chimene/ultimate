"""Country metadata for international features."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CountryInfo:
    code: str
    name: str
    name_fr: str
    flag: str
    default_timezone: str


COUNTRY_DATA: list[tuple[str, str, str, str, str]] = [
    ("CA", "Canada", "Canada", "🇨🇦", "America/Toronto"),
    ("US", "United States", "États-Unis", "🇺🇸", "America/New_York"),
    ("MX", "Mexico", "Mexique", "🇲🇽", "America/Mexico_City"),
    ("BR", "Brazil", "Brésil", "🇧🇷", "America/Sao_Paulo"),
    ("FR", "France", "France", "🇫🇷", "Europe/Paris"),
    ("BE", "Belgium", "Belgique", "🇧🇪", "Europe/Brussels"),
    ("CH", "Switzerland", "Suisse", "🇨🇭", "Europe/Zurich"),
    ("LU", "Luxembourg", "Luxembourg", "🇱🇺", "Europe/Luxembourg"),
    ("GB", "United Kingdom", "Royaume-Uni", "🇬🇧", "Europe/London"),
    ("ES", "Spain", "Espagne", "🇪🇸", "Europe/Madrid"),
    ("DE", "Germany", "Allemagne", "🇩🇪", "Europe/Berlin"),
    ("IT", "Italy", "Italie", "🇮🇹", "Europe/Rome"),
    ("PT", "Portugal", "Portugal", "🇵🇹", "Europe/Lisbon"),
    ("NL", "Netherlands", "Pays-Bas", "🇳🇱", "Europe/Amsterdam"),
    ("MC", "Monaco", "Monaco", "🇲🇨", "Europe/Monaco"),
    ("GP", "Guadeloupe", "Guadeloupe", "🇬🇵", "America/Guadeloupe"),
    ("MQ", "Martinique", "Martinique", "🇲🇶", "America/Martinique"),
    ("CM", "Cameroon", "Cameroun", "🇨🇲", "Africa/Douala"),
    ("CI", "Côte d'Ivoire", "Côte d'Ivoire", "🇨🇮", "Africa/Abidjan"),
    ("SN", "Senegal", "Sénégal", "🇸🇳", "Africa/Dakar"),
    ("MA", "Morocco", "Maroc", "🇲🇦", "Africa/Casablanca"),
    ("TN", "Tunisia", "Tunisie", "🇹🇳", "Africa/Tunis"),
    ("DZ", "Algeria", "Algérie", "🇩🇿", "Africa/Algiers"),
    ("AE", "UAE", "Émirats arabes unis", "🇦🇪", "Asia/Dubai"),
    ("AU", "Australia", "Australie", "🇦🇺", "Australia/Sydney"),
]

COUNTRIES: dict[str, CountryInfo] = {
    code: CountryInfo(code, name, name_fr, flag, tz)
    for code, name, name_fr, flag, tz in COUNTRY_DATA
}


def get_country(code: str) -> CountryInfo:
    return COUNTRIES.get(code.upper(), CountryInfo(code.upper(), code.upper(), code.upper(), "🌍", "UTC"))


def country_display(city: str, country_code: str) -> str:
    info = get_country(country_code)
    return f"{city}, {info.name_fr} {info.flag}"


def default_timezone_for_country(country_code: str) -> str:
    return get_country(country_code).default_timezone
