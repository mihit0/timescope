# extractor.py

from fastapi import FastAPI, Request
from pydantic import BaseModel
from newspaper import Article
import uvicorn

app = FastAPI()

class URLRequest(BaseModel):
    url: str

@app.post("/extract")
async def extract_article(req: URLRequest):
    url = req.url
    try:
        article = Article(url)
        article.download()
        article.parse()
        return {
            "text": article.text,
            "title": article.title,
            "date": article.publish_date.year if article.publish_date else None
        }
    except Exception as e:
        return { "error": str(e) }

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
