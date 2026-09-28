from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "aegis-pqc-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./aegis.db"
    AIR_GAPPED: bool = True
    KEYS_DIR: str = "./storage/keys"
    STORAGE_DIR: str = "./storage"
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_MINUTES: int = 15

    class Config:
        env_file = ".env"

settings = Settings()
