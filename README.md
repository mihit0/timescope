# TimeScope: Visualizing the Evolution of News Through Time

**Live Demo**: [timescope.vercel.app](https://timescope.vercel.app)

> **Note**: The live demo requires a one-time password that has been shared privately with the hackathon submission.

TimeScope is an innovative web application that revolutionizes how we understand news articles by analyzing their evolution through time. By leveraging Perplexity's Sonar API, advanced NLP and modern web technologies, it provides:

- Intelligent article extraction and summarization
- Real-time 2024 context updates with highlighted changes
- Interactive timeline of key events since publication
- Smooth animations and modern UI/UX
- Secure access with authentication

## Live Deployment

The application is split into two parts for optimal performance:
- Frontend: Deployed on Vercel ([timescope.vercel.app](https://timescope.vercel.app))
- Backend Web Scraper: Hosted on Render for reliable article extraction

## Local Development Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Set up Python environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Create a `.env.local` file with required credentials:
```
PERPLEXITY_API_KEY=your_api_key_here
AUTH_USERNAME=your_chosen_username
AUTH_PASSWORD=your_chosen_password
```

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Key Features

- **Smart Article Extraction**: Powered by newspaper3k for reliable content parsing
- **Intelligent Context Updates**: Uses Perplexity's Sonar API for accurate historical analysis
- **Beautiful Animations**: Smooth transitions using Framer Motion
- **Modern UI Components**: Built with shadcn/ui and Tailwind CSS
- **Responsive Timeline**: Interactive visualization of key historical events
- **Secure Access**: Custom authentication system for controlled access
- **Error Handling**: Robust error management and user feedback

## Technology Stack

### Frontend
- Next.js 15
- React 19
- Tailwind CSS
- Framer Motion
- shadcn/ui components

### Backend
- FastAPI
- newspaper3k
- Perplexity Sonar API
- Custom web scraping logic

### DevOps
- Vercel (Frontend Hosting)
- Render (Backend Hosting)
- Environment-based configuration

## Usage

1. Access the application at [timescope.vercel.app](https://timescope.vercel.app)
2. Enter the provided one-time password
3. Input a news article URL
4. View the comprehensive analysis including:
   - Original article summary
   - Modern context updates
   - Interactive timeline of events

## Future Enhancements

- Enhanced article parsing capabilities
- Additional visualization options
- Expanded timeline features
