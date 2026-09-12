"""Seed demo data for ULTIMATE — international MVP."""

import asyncio
from datetime import UTC, date, datetime

from sqlalchemy import func, select

from app.auth.password import hash_password
from app.countries import default_timezone_for_country
from app.database import Base, async_session_factory, engine
from app.models.enums import (
    Gender,
    RelationshipIntention,
    SubscriptionPlan,
    SubscriptionStatus,
    UserRole,
)
from app.models.meeting import Availability
from app.models.profile import Interest, Photo, Profile
from app.models.subscription import Subscription
from app.models.user import User

DEMO_USERS = [
    {
        "email": "admin@ultimate.ca",
        "password": "Admin123!",
        "first_name": "Admin",
        "date_of_birth": date(1990, 3, 15),
        "gender": Gender.MALE,
        "city": "Montréal",
        "country": "CA",
        "latitude": 45.5017,
        "longitude": -73.5673,
        "role": UserRole.ADMIN,
        "bio": "Administrateur de la plateforme ULTIMATE.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE],
        "occupation": "Administrateur système",
        "interests": ["Technologie", "Voyage", "Cuisine"],
        "photo": "https://i.pravatar.cc/400?u=admin-ultimate",
    },
    {
        "email": "demo@ultimate.ca",
        "password": "Demo123!",
        "first_name": "Alex",
        "date_of_birth": date(1995, 7, 22),
        "gender": Gender.MALE,
        "city": "Montréal",
        "country": "CA",
        "latitude": 45.5017,
        "longitude": -73.5673,
        "role": UserRole.USER,
        "bio": "Passionné de musique et de randonnée. Ouvert aux rencontres locales et internationales.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE],
        "occupation": "Designer UX",
        "interests": ["Musique", "Randonnée", "Café", "Photographie"],
        "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        "available_tonight": True,
    },
    {
        "email": "sophie.m@ultimate.ca",
        "password": "Demo123!",
        "first_name": "Sophie",
        "date_of_birth": date(1993, 11, 8),
        "gender": Gender.FEMALE,
        "city": "Québec",
        "country": "CA",
        "latitude": 46.8139,
        "longitude": -71.2080,
        "bio": "Sommelière québécoise en quête de connexions authentiques au Canada et au-delà.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Sommelière",
        "interests": ["Vin", "Art", "Yoga", "Lecture"],
        "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        "available_tonight": True,
    },
    {
        "email": "sarah.p@ultimate.fr",
        "password": "Demo123!",
        "first_name": "Sarah",
        "date_of_birth": date(1996, 5, 12),
        "gender": Gender.FEMALE,
        "city": "Paris",
        "country": "FR",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "bio": "Consultante en marketing, amoureuse des galeries du Marais et des soirées jazz.",
        "intention": RelationshipIntention.FRIENDSHIP,
        "looking_for": [Gender.MALE, Gender.NON_BINARY],
        "occupation": "Consultante marketing",
        "interests": ["Jazz", "Art", "Mode", "Voyage"],
        "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        "available_tonight": True,
    },
    {
        "email": "pierre.d@ultimate.fr",
        "password": "Demo123!",
        "first_name": "Pierre",
        "date_of_birth": date(1989, 2, 28),
        "gender": Gender.MALE,
        "city": "Lyon",
        "country": "FR",
        "latitude": 45.7640,
        "longitude": 4.8357,
        "bio": "Chef de cuisine lyonnais, curieux des cultures et des saveurs du monde.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE],
        "occupation": "Chef cuisinier",
        "interests": ["Gastronomie", "Voyage", "Cyclisme"],
        "photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    },
    {
        "email": "james.w@ultimate.us",
        "password": "Demo123!",
        "first_name": "James",
        "date_of_birth": date(1991, 8, 3),
        "gender": Gender.MALE,
        "city": "New York",
        "country": "US",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "bio": "Architecte à Manhattan. Toujours partant pour découvrir de nouvelles perspectives.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE, Gender.NON_BINARY],
        "occupation": "Architecte",
        "interests": ["Architecture", "Art", "Running", "Théâtre"],
        "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        "available_tonight": True,
    },
    {
        "email": "emily.r@ultimate.us",
        "password": "Demo123!",
        "first_name": "Emily",
        "date_of_birth": date(1994, 12, 19),
        "gender": Gender.FEMALE,
        "city": "Los Angeles",
        "country": "US",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "bio": "Productrice créative entre studio et plage. Ouverte aux rencontres sincères.",
        "intention": RelationshipIntention.CASUAL,
        "looking_for": [Gender.MALE],
        "occupation": "Productrice",
        "interests": ["Cinéma", "Yoga", "Surf", "Photographie"],
        "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    },
    {
        "email": "oliver.h@ultimate.uk",
        "password": "Demo123!",
        "first_name": "Oliver",
        "date_of_birth": date(1990, 6, 7),
        "gender": Gender.MALE,
        "city": "London",
        "country": "GB",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "bio": "Journaliste culturel basé à Londres. Passionné d'histoire et de rencontres enrichissantes.",
        "intention": RelationshipIntention.FRIENDSHIP,
        "looking_for": [Gender.FEMALE, Gender.MALE],
        "occupation": "Journaliste",
        "interests": ["Littérature", "Théâtre", "Pub culture", "Voyage"],
        "photo": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
        "available_tonight": True,
    },
    {
        "email": "charlotte.b@ultimate.uk",
        "password": "Demo123!",
        "first_name": "Charlotte",
        "date_of_birth": date(1997, 3, 25),
        "gender": Gender.FEMALE,
        "city": "Manchester",
        "country": "GB",
        "latitude": 53.4808,
        "longitude": -2.2426,
        "bio": "Designer textile, fan de concerts indie et de week-ends à Edimbourg.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Designer textile",
        "interests": ["Mode", "Musique indie", "Design", "Danse"],
        "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    },
    {
        "email": "lucas.v@ultimate.be",
        "password": "Demo123!",
        "first_name": "Lucas",
        "date_of_birth": date(1992, 9, 14),
        "gender": Gender.MALE,
        "city": "Brussels",
        "country": "BE",
        "latitude": 50.8503,
        "longitude": 4.3517,
        "bio": "Consultant UE trilingue. J'aime les terrasses bruxelloises et les voyages spontanés.",
        "intention": RelationshipIntention.TRAVEL,
        "looking_for": [Gender.FEMALE, Gender.NON_BINARY],
        "occupation": "Consultant",
        "interests": ["Politique", "Voyage", "Bière", "Art contemporain"],
        "photo": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    },
    {
        "email": "amina.n@ultimate.cm",
        "password": "Demo123!",
        "first_name": "Amina",
        "date_of_birth": date(1995, 1, 30),
        "gender": Gender.FEMALE,
        "city": "Yaoundé",
        "country": "CM",
        "latitude": 3.8480,
        "longitude": 11.5021,
        "bio": "Entrepreneure tech à Yaoundé. Fière de connecter les cultures africaines et internationales.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Entrepreneure",
        "interests": ["Tech", "Danse", "Gastronomie", "Voyage"],
        "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
        "available_tonight": True,
    },
    {
        "email": "jean.k@ultimate.cm",
        "password": "Demo123!",
        "first_name": "Jean",
        "date_of_birth": date(1988, 11, 2),
        "gender": Gender.MALE,
        "city": "Douala",
        "country": "CM",
        "latitude": 4.0511,
        "longitude": 9.7679,
        "bio": "Importateur et amateur de musique afrobeat. Ouvert aux rencontres pendant mes déplacements.",
        "intention": RelationshipIntention.TRAVEL,
        "looking_for": [Gender.FEMALE],
        "occupation": "Importateur",
        "interests": ["Musique", "Affaires", "Football", "Cuisine"],
        "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    },
    {
        "email": "marie.t@ultimate.ca",
        "password": "Demo123!",
        "first_name": "Marie",
        "date_of_birth": date(1998, 4, 18),
        "gender": Gender.FEMALE,
        "city": "Toronto",
        "country": "CA",
        "latitude": 43.6532,
        "longitude": -79.3832,
        "bio": "Analyste financière, amatrice de galeries et de brunchs dans le Distillery District.",
        "intention": RelationshipIntention.TONIGHT,
        "looking_for": [Gender.MALE, Gender.NON_BINARY],
        "occupation": "Analyste financière",
        "interests": ["Finance", "Art", "Brunch", "Fitness"],
        "photo": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
        "available_tonight": True,
    },
    {
        "email": "camille.l@ultimate.fr",
        "password": "Demo123!",
        "first_name": "Camille",
        "date_of_birth": date(1993, 7, 9),
        "gender": Gender.FEMALE,
        "city": "Bordeaux",
        "country": "FR",
        "latitude": 44.8378,
        "longitude": -0.5792,
        "bio": "Œnologue bordelaise. Je voyage souvent et j'aime rencontrer des personnes curieuses.",
        "intention": RelationshipIntention.TRAVEL,
        "looking_for": [Gender.MALE],
        "occupation": "Œnologue",
        "interests": ["Vin", "Voyage", "Nature", "Photographie"],
        "photo": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
    },
    {
        "email": "thomas.b@ultimate.us",
        "password": "Demo123!",
        "first_name": "Thomas",
        "date_of_birth": date(1987, 10, 21),
        "gender": Gender.MALE,
        "city": "Boston",
        "country": "US",
        "latitude": 42.3601,
        "longitude": -71.0589,
        "bio": "Professeur à Harvard extension. Disponible ce soir pour un café au Back Bay.",
        "intention": RelationshipIntention.TONIGHT,
        "looking_for": [Gender.FEMALE],
        "occupation": "Professeur",
        "interests": ["Histoire", "Lecture", "Course", "Musique classique"],
        "photo": "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400",
        "available_tonight": True,
    },
]


async def seed_if_empty() -> bool:
    async with async_session_factory() as session:
        count = (await session.execute(select(func.count()).select_from(User))).scalar_one()
        if count > 0:
            print(f"Base déjà peuplée ({count} utilisateurs). Seed ignoré.")
            return False

        tonight = date.today()
        now = datetime.now(UTC)

        for data in DEMO_USERS:
            country = data.get("country", "CA").upper()
            user = User(
                email=data["email"].lower(),
                password_hash=hash_password(data["password"]),
                first_name=data["first_name"],
                date_of_birth=data["date_of_birth"],
                gender=data["gender"],
                city=data["city"],
                country=country,
                timezone=default_timezone_for_country(country),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
                role=data.get("role", UserRole.USER),
            )
            session.add(user)
            await session.flush()

            profile = Profile(
                user_id=user.id,
                bio=data["bio"],
                relationship_intention=data["intention"],
                looking_for_genders=data["looking_for"],
                preferred_intentions=data.get("preferred_intentions", [data["intention"]]),
                preferred_countries=data.get("preferred_countries", []),
                min_age=22,
                max_age=45,
                max_distance_km=100,
                occupation=data.get("occupation"),
            )
            session.add(profile)
            await session.flush()

            session.add(
                Photo(
                    profile_id=profile.id,
                    url=data["photo"],
                    is_primary=True,
                    sort_order=0,
                )
            )

            for interest_name in data.get("interests", []):
                session.add(Interest(profile_id=profile.id, name=interest_name))

            session.add(
                Subscription(
                    user_id=user.id,
                    plan=SubscriptionPlan.FREE,
                    status=SubscriptionStatus.ACTIVE,
                    started_at=now,
                )
            )

            if data.get("available_tonight"):
                session.add(
                    Availability(
                        user_id=user.id,
                        available_date=tonight,
                        is_available=True,
                        note="Disponible ce soir pour un verre!",
                    )
                )

        await session.commit()
        print(f"Seed terminé: {len(DEMO_USERS)} utilisateurs internationaux créés.")
        return True


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def main():
    await create_tables()
    await seed_if_empty()
    await engine.dispose()


if __name__ == "__main__":
    import sys

    if "--tables-only" in sys.argv:
        asyncio.run(create_tables())
    else:
        asyncio.run(main())
