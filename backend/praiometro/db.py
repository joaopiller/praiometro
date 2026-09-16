from pymongo import MongoClient
from pymongo.collection import Collection

from .config import Settings


def criar_colecao_votos(settings: Settings) -> Collection:
    client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=3000)
    return client[settings.mongo_db]["votos"]
