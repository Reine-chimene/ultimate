from pydantic import BaseModel


class CountryStats(BaseModel):
    code: str
    name: str
    name_fr: str
    flag: str
    user_count: int


class WorldResponse(BaseModel):
    countries: list[CountryStats]
    total_countries: int
