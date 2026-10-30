
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is missing from .env")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000,
)

db = client["lifemirror"]

users_collection = db["users"]
journal_collection = db["journals"]
personality_collection = db["personality"]
insights_collection = db["insights"]
chat_collection = db["chat_messages"]
conversations_collection = db["conversations"]
memory_collection = db["memories"]
memory_suggestions_collection = db["memory_suggestions"]