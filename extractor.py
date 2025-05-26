# extractor.py

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel, HttpUrl
from newspaper import Article
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse

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
        # Validate URL
        parsed = urlparse(data.url)
        if not all([parsed.scheme, parsed.netloc]):
            raise ValueError("Invalid URL format")

        article = Article(data.url)
        article.download()
        article.parse()
        
        return {
            "text": article.text,
            "date": article.publish_date.year if article.publish_date else 2012
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract article: {str(e)}")
