# TimeScope: Timeline Fact Evolution Viewer

TimeScope is a web application that analyzes news articles and shows how their context has evolved over time. It provides:
- Original article summary
- Updated 2024 context
- Timeline of key events since publication

## Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Set up Python environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create a `.env.local` file with your Perplexity API key:
```
PERPLEXITY_API_KEY=your_api_key_here
```

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. Enter a news article URL in the input field
2. Click "Analyze"
3. View the original summary, modern context, and timeline of events

## Technologies Used

- Next.js 15
- React 19
- Tailwind CSS
- shadcn/ui
- newspaper3k (Python)
- Perplexity Sonar API
