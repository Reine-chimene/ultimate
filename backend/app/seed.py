"""Seed demo data for ULTIMATE MVP."""

import asyncio
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select

from app.auth.password import hash_password
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
        "role": UserRole.USER,
        "bio": "Passionné de musique et de randonnée dans les Laurentides. Toujours partant pour découvrir un nouveau café à Montréal.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE],
        "occupation": "Designer UX",
        "interests": ["Musique", "Randonnée", "Café", "Photographie"],
        "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        "available_tonight": True,
    },
    {
        "email": "sophie.m@example.ca",
        "password": "Demo123!",
        "first_name": "Sophie",
        "date_of_birth": date(1993, 11, 8),
        "gender": Gender.FEMALE,
        "city": "Québec",
        "bio": "Amatrice de vin québécois et de vieux Québec. Je cherche quelqu'un avec qui partager de belles soirées et des rires sincères.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Sommelière",
        "interests": ["Vin", "Art", "Yoga", "Lecture"],
        "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        "available_tonight": True,
    },
    {
        "email": "marc.t@example.ca",
        "password": "Demo123!",
        "first_name": "Marc",
        "date_of_birth": date(1988, 4, 30),
        "gender": Gender.MALE,
        "city": "Laval",
        "bio": "Entrepreneur local, fan de hockey et de bonne bouffe. J'aime les conversations profondes autant qu'une partie de pool entre amis.",
        "intention": RelationshipIntention.CASUAL,
        "looking_for": [Gender.FEMALE, Gender.NON_BINARY],
        "occupation": "Entrepreneur",
        "interests": ["Hockey", "Gastronomie", "Entrepreneuriat"],
        "photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    },
    {
        "email": "emilie.r@example.ca",
        "password": "Demo123!",
        "first_name": "Émilie",
        "date_of_birth": date(1997, 1, 14),
        "gender": Gender.FEMALE,
        "city": "Montréal",
        "bio": "Étudiante en design, amoureuse des festivals d'été et des balades au Mont-Royal. La vie est trop courte pour les mauvaises vibes.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE, Gender.NON_BINARY],
        "occupation": "Étudiante",
        "interests": ["Design", "Festivals", "Danse", "Mode"],
        "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        "available_tonight": True,
    },
    {
        "email": "jeanpierre.l@example.ca",
        "password": "Demo123!",
        "first_name": "Jean-Pierre",
        "date_of_birth": date(1985, 9, 3),
        "gender": Gender.MALE,
        "city": "Gatineau",
        "bio": "Fonctionnaire le jour, musicien le soir. Je joue de la guitare dans un groupe local et j'adore les microbrasseries de l'Outaouais.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE],
        "occupation": "Analyste",
        "interests": ["Musique", "Bière artisanale", "Cyclisme"],
        "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    },
    {
        "email": "camille.b@example.ca",
        "password": "Demo123!",
        "first_name": "Camille",
        "date_of_birth": date(1994, 6, 19),
        "gender": Gender.FEMALE,
        "city": "Sherbrooke",
        "bio": "Prof de français avec une passion pour le théâtre et les escapades en Estrie. À la recherche d'une connexion authentique.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Enseignante",
        "interests": ["Théâtre", "Littérature", "Ski", "Voyage"],
        "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    },
    {
        "email": "olivier.d@example.ca",
        "password": "Demo123!",
        "first_name": "Olivier",
        "date_of_birth": date(1991, 12, 25),
        "gender": Gender.MALE,
        "city": "Trois-Rivières",
        "bio": "Ingénieur logiciel qui code de jour et cuisine de soir. Fan de pâtisserie française et de séries nordiques.",
        "intention": RelationshipIntention.CASUAL,
        "looking_for": [Gender.FEMALE],
        "occupation": "Ingénieur logiciel",
        "interests": ["Cuisine", "Programmation", "Séries TV"],
        "photo": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
    },
    {
        "email": "isabelle.f@example.ca",
        "password": "Demo123!",
        "first_name": "Isabelle",
        "date_of_birth": date(1990, 8, 7),
        "gender": Gender.FEMALE,
        "city": "Montréal",
        "bio": "Infirmière au CHUM, marathonienne en devenir. Je valorise l'honnêteté, l'humour et les personnes qui savent écouter.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Infirmière",
        "interests": ["Course à pied", "Santé", "Méditation"],
        "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        "available_tonight": True,
    },
    {
        "email": "thomas.g@example.ca",
        "password": "Demo123!",
        "first_name": "Thomas",
        "date_of_birth": date(1996, 2, 11),
        "gender": Gender.MALE,
        "city": "Québec",
        "bio": "Photographe freelance, toujours à la recherche du prochain coucher de soleil sur le fleuve. Disponible pour un verre ce soir?",
        "intention": RelationshipIntention.CASUAL,
        "looking_for": [Gender.FEMALE, Gender.NON_BINARY],
        "occupation": "Photographe",
        "interests": ["Photographie", "Voyage", "Art", "Nature"],
        "photo": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        "available_tonight": True,
    },
    {
        "email": "marieclaire.h@example.ca",
        "password": "Demo123!",
        "first_name": "Marie-Claire",
        "date_of_birth": date(1992, 5, 28),
        "gender": Gender.FEMALE,
        "city": "Longueuil",
        "bio": "Comptable le jour, bénévole le week-end. J'aime le RÉSO, les marchés publics et les soirées jeux de société entre amis.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Comptable",
        "interests": ["Bénévolat", "Jeux de société", "Marchés"],
        "photo": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
    },
    {
        "email": "lucas.p@example.ca",
        "password": "Demo123!",
        "first_name": "Lucas",
        "date_of_birth": date(1998, 10, 5),
        "gender": Gender.MALE,
        "city": "Montréal",
        "bio": "Barista et barista champion en herbe. Je connais les meilleurs spots pour un espresso à Mile-End. Parlons café!",
        "intention": RelationshipIntention.FRIENDSHIP,
        "looking_for": [Gender.FEMALE, Gender.MALE, Gender.NON_BINARY],
        "occupation": "Barista",
        "interests": ["Café", "Musique indie", "Skateboard"],
        "photo": "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400",
    },
    {
        "email": "audrey.v@example.ca",
        "password": "Demo123!",
        "first_name": "Audrey",
        "date_of_birth": date(1999, 3, 21),
        "gender": Gender.NON_BINARY,
        "city": "Montréal",
        "bio": "Artiste visuel·le et militant·e LGBTQ+. Je cherche des connexions respectueuses où chacun·e peut être authentique.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE, Gender.FEMALE, Gender.NON_BINARY],
        "occupation": "Artiste",
        "interests": ["Art", "Activisme", "Pride", "Cinéma"],
        "photo": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
        "available_tonight": True,
    },
    {
        "email": "nicolas.w@example.ca",
        "password": "Demo123!",
        "first_name": "Nicolas",
        "date_of_birth": date(1987, 7, 16),
        "gender": Gender.MALE,
        "city": "Saguenay",
        "bio": "Guide de kayak en été, prof de ski en hiver. La nature québécoise est mon terrain de jeu — et peut-être le nôtre?",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.FEMALE],
        "occupation": "Guide outdoor",
        "interests": ["Kayak", "Ski", "Nature", "Camping"],
        "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    },
    {
        "email": "valerie.c@example.ca",
        "password": "Demo123!",
        "first_name": "Valérie",
        "date_of_birth": date(1993, 4, 9),
        "gender": Gender.FEMALE,
        "city": "Montréal",
        "bio": "Avocate en droit de l'immigration. J'adore le jazz au Upstairs, les brunchs du dimanche et les discussions qui durent des heures.",
        "intention": RelationshipIntention.RELATIONSHIP,
        "looking_for": [Gender.MALE],
        "occupation": "Avocate",
        "interests": ["Jazz", "Droit", "Brunch", "Politique"],
        "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
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
            user = User(
                email=data["email"].lower(),
                password_hash=hash_password(data["password"]),
                first_name=data["first_name"],
                date_of_birth=data["date_of_birth"],
                gender=data["gender"],
                city=data["city"],
                role=data.get("role", UserRole.USER),
            )
            session.add(user)
            await session.flush()

            profile = Profile(
                user_id=user.id,
                bio=data["bio"],
                relationship_intention=data["intention"],
                looking_for_genders=data["looking_for"],
                min_age=22,
                max_age=45,
                max_distance_km=75,
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
        print(f"Seed terminé: {len(DEMO_USERS)} utilisateurs créés.")
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
