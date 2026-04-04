from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")

db = client["life_mirror"]

users_collection = db["users"]
journal_collection = db["journals"]
insights_collection = db["insights"]  # optional but recommended