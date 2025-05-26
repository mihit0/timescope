# extractor.py

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel, HttpUrl
from newspaper import Article, Config
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import logging
import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            
        # Configure newspaper
        config = Config()
        config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        
        article = Article(data.url, config=config)
        logger.info(f"Downloading article from: {data.url}")
        article.download()
        article.parse()
        
        # Extract text
        text = article.text
        if not text:
            logger.warning("No text extracted, trying alternative extraction")
            # You might want to add alternative extraction methods here
            
        # Extract date with fallback
        try:
            if article.publish_date:
                year = article.publish_date.year
            else:
                # Try to extract year from URL or other metadata
                logger.warning("No publish date found, attempting to extract from URL")
                # Example: extract year from URL path
                path_parts = parsed.path.split('/')
                for part in path_parts:
                    if part.isdigit() and len(part) == 4 and 1990 <= int(part) <= datetime.datetime.now().year:
                        year = int(part)
                        break
                else:
                    year = 2012  # fallback year
        except Exception as e:
            logger.error(f"Error extracting date: {e}")
            year = 2012
            
        logger.info(f"Successfully extracted article. Year: {year}, Text length: {len(text)}")
        
        return {
            "text": text,
            "date": year
        }
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract article: {str(e)}")
