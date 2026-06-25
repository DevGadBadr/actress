import os
from langchain_core.tools import tool
from langchain_tavily import TavilySearch
from supabase import create_client
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SERVICE_ROLE_KEY")
SEARCH = TavilySearch(max_results=10, include_images=True)
SUPERBASE_CLIENT = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
OPENAI_CLIENT = OpenAI()

                    
@tool
def save_actress(actress_name: str, actress_pic_url: str, description: str) -> str:
    """Save an actress's name, picture URL, and description (with embedding) to the agent_data table."""
    
    existing = SUPERBASE_CLIENT.table("agent_data").select("id").eq("actress_name", actress_name).execute()
    if existing.data:
        return f"{actress_name} already exists in the database."

    embedding_response = OPENAI_CLIENT.embeddings.create(
        model="text-embedding-3-small",
        input=description
    )
    embedding = embedding_response.data[0].embedding

    SUPERBASE_CLIENT.table("agent_data").insert({
        "actress_name": actress_name,
        "actress_pic_url": actress_pic_url,
        "description": description,
        "embedding": embedding
    }).execute()
    
    return f"Saved {actress_name} to database."

@tool
def search_actress_knowledge(query: str) -> str:
    """Search existing saved actresses by meaning/theme using the database."""
    
    embedding_response = OPENAI_CLIENT.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    query_embedding = embedding_response.data[0].embedding

    result = SUPERBASE_CLIENT.rpc("match_actress", {
        "query_embedding": query_embedding,
        "match_count": 3
    }).execute()

    return str(result.data)