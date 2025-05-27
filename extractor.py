# extractor.py

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel, HttpUrl
from newspaper import Article, Config
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import logging
import datetime
import re
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Get environment and configure CORS
is_production = os.getenv("ENVIRONMENT") == "production"
allowed_origins = ["*"] if not is_production else [
    "https://your-vercel-app.vercel.app",  # Replace with your actual Vercel URL
    "http://localhost:3000"  # Keep for local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLInput(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"status": "Article extractor service is running"}

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
            
        # Extract date with multiple fallback strategies
        try:
            year = None
            
            # Strategy 1: Use newspaper3k's publish_date
            if article.publish_date:
                year = article.publish_date.year
                logger.info(f"Found date using newspaper3k: {year}")
            
            # Strategy 2: Check article metadata
            if not year and article.meta_data:
                meta_dates = []
                # Common meta tag names for publication date
                date_meta_tags = [
                    'article:published_time',
                    'date',
                    'pubdate',
                    'publishdate',
                    'og:published_time',
                    'datePublished',
                    'article.published'
                ]
                
                for tag in date_meta_tags:
                    if tag in article.meta_data:
                        date_str = article.meta_data[tag]
                        # Try to parse the date string
                        for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%Y']:
                            try:
                                parsed_date = datetime.datetime.strptime(date_str[:10], fmt)
                                meta_dates.append(parsed_date.year)
                                break
                            except ValueError:
                                continue
                
                if meta_dates:
                    year = meta_dates[0]  # Use the first valid date found
                    logger.info(f"Found date in meta tags: {year}")
            
            # Strategy 3: Look for year in URL path
            if not year:
                path_parts = parsed.path.split('/')
                current_year = datetime.datetime.now().year
                
                for part in path_parts:
                    if part.isdigit() and len(part) == 4 and 1990 <= int(part) <= current_year:
                        year = int(part)
                        logger.info(f"Found date in URL path: {year}")
                        break
            
            # Strategy 4: Search for year patterns in text
            if not year:
                # Look for date patterns in the first few paragraphs
                first_paragraphs = ' '.join(article.text.split('\n')[:3])
                
                date_patterns = [
                    r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(\d{4})',
                    r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+(\d{4})',
                    r'\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})',
                    r'\d{1,2}/\d{1,2}/(\d{4})',
                    r'\d{4}-\d{2}-\d{2}'
                ]
                
                for pattern in date_patterns:
                    matches = re.findall(pattern, first_paragraphs)
                    if matches:
                        potential_year = int(matches[0])
                        if 1990 <= potential_year <= current_year:
                            year = potential_year
                            logger.info(f"Found date in text content: {year}")
                            break
            
            if not year:
                logger.warning("Could not determine article year through any method")
                year = None  # Just return None if we can't find a date
                
            logger.info(f"Final determined year: {year}")
            
        except Exception as e:
            logger.error(f"Error extracting date: {e}")
            year = None  # Return None on any error
        
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)