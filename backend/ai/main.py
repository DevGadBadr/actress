from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from myTools import *

LLM = ChatOpenAI(model="gpt-4o-mini")
Agent = create_agent(LLM, tools=[SEARCH, save_actress, search_actress_knowledge])
while True:
    input_text = input("Enter your query: ")
    response = Agent.invoke({
        "messages": [
            ("user", input_text),
            ("system", "You are an agent that finds actresses based on a movie or theme. "
                        "First use search_actress_knowledge to check if a matching actress is already saved. "
                        "If nothing relevant is found, use the search tool to find a new actress and make it new/modern results, a direct image URL, "
                        "and write a short description, then use save_actress to store her in the database.")
        ]
    })
    print(response["messages"][-1].content)