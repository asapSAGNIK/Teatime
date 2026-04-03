import os
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))


class Settings:
    # GROQ IS THE ONLY ENGINE
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    VIRLO_API_KEY: str = os.getenv("VIRLO_API_KEY", "")


settings = Settings()
