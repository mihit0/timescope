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
from bs4 import BeautifulSoup

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# get environment and configure CORS
is_production = os.getenv("ENVIRONMENT") == "production"
allowed_origins = ["*"] if not is_production else [
    "https://timescope.vercel.app/",  
    "http://localhost:3000"  # Kept for local development
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
        # Validates URL
        parsed = urlparse(data.url)
        if not all([parsed.scheme, parsed.netloc]):
            raise ValueError("Invalid URL format")
            
        # Configures newspaper
        config = Config()
        config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        
        article = Article(data.url, config=config)
        logger.info(f"Downloading article from: {data.url}")
        article.download()
        article.parse()
        
        # Extracts text
        text = article.text
        if not text:
            logger.warning("No text extracted, trying alternative extraction")
            # Try to extract from article.html
            if article.html:
                # Special handling for old CNN articles
                if 'cnn.com' in data.url.lower():
                    
                    content_blocks = []
                    
                    # different potential content locations
                    selectors = [
                        'td:nth-of-type(3)',  
                        'td[width="70%"]',    
                        'td.cnnBodyText',      
                        'p.cnnBodyText',     
                    ]
                    
                    for selector in selectors:
                        elements = article.soup.select(selector)
                        for element in elements:
                            # Clean up the text
                            block_text = element.get_text(strip=True)
                            if len(block_text) > 100:  
                                content_blocks.append(block_text)
                    
                    if content_blocks:
                        text = '\n\n'.join(content_blocks)
                        logger.info("Successfully extracted text using CNN legacy format handler")
                else:
                    # Generic fallback for other sites
                    
                    for unwanted in article.soup.find_all(['script', 'style', 'nav', 'header', 'footer']):
                        unwanted.decompose()
                    
                    
                    paragraphs = article.soup.find_all('p')
                    text = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50)
            
        if not text:
            raise ValueError("Could not extract any meaningful text from the article")
            
        # Extracts date
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
                    year = meta_dates[0]  # Use first valid date found
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
            
            if not year:
                logger.warning("Could not determine article year through any method")
                year = None
                
            logger.info(f"Final determined year: {year}")
            
        except Exception as e:
            logger.error(f"Error extracting date: {e}")
            year = None
        
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