# extractor.py

from fastapi import FastAPI, Request
from pydantic import BaseModel
from newspaper import Article
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend access (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] to be strict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLInput(BaseModel):
    url: str

@app.post("/extract")
async def extract_article(data: URLInput):
    try:
        article = Article(data.url)
        article.download()
        article.parse()
        return {
            "text": article.text,
            "date": article.publish_date.year if article.publish_date else 2012
        }
    except Exception as e:
        return {"error": str(e)}
