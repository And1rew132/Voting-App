# EU Voting App 🇪🇺

Official European Union Voting Platform - A secure, transparent, and accessible voting system for EU citizens.

![EU Voting App Main Interface](https://github.com/user-attachments/assets/64d5d988-d33d-490e-bccb-974ce285cfaf)

## Features

### Core Functionality
- ✅ **Poll Creation** - Create polls with multiple options
- ✅ **Secure Voting** - Vote with duplicate prevention
- ✅ **Real-time Results** - View voting results with visual charts
- ✅ **Multi-language Support** - Available in English, German, and French
- ✅ **Responsive Design** - Works on desktop and mobile devices

### EU-Specific Features
- 🇪🇺 **Multi-language Interface** - Native support for EU languages
- 🔒 **Security** - Rate limiting and input validation
- ♿ **Accessibility** - WCAG-compliant design
- 🔍 **Transparency** - Open voting results and statistics
- 🛡️ **Privacy** - Optional voter identification

![Results in German](https://github.com/user-attachments/assets/50ea22d6-3b11-4a29-85ef-81f419f5ea9d)

## Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/And1rew132/Voting-App.git
cd Voting-App
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Usage Guide

### Creating a Poll (Admin)
1. Navigate to the **Admin** tab
2. Enter your poll question
3. Add at least 2 options (you can add more with "Add Option")
4. Click "Create Poll"

### Voting
1. Go to the **Vote** tab
2. Select an active poll
3. Choose your preferred option
4. Optionally enter a Voter ID
5. Submit your vote

### Viewing Results
1. Click the **Results** tab
2. View real-time voting statistics
3. See percentage breakdowns and vote counts

### Language Support
- Use the language selector in the top-right corner
- Supported languages: English, Deutsch (German), Français (French)
- Interface automatically translates while preserving poll content

## Technical Architecture

### Backend (Node.js/Express)
- **Express.js** - Web framework
- **Helmet** - Security middleware
- **Rate Limiting** - DoS protection
- **CORS** - Cross-origin support
- **In-memory storage** - Simple data persistence

### Frontend (Vanilla JavaScript)
- **Responsive CSS** - Mobile-first design
- **Internationalization** - Multi-language support
- **Accessibility** - WCAG guidelines compliance
- **Progressive Enhancement** - Works without JavaScript

### Security Features
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Duplicate vote prevention
- XSS protection via HTML escaping

## API Documentation

### Endpoints

#### `GET /api/polls`
Get all polls
```json
[
  {
    "id": 1,
    "question": "Poll question",
    "options": ["Option 1", "Option 2"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "active": true
  }
]
```

#### `POST /api/polls`
Create a new poll
```json
{
  "question": "Your poll question",
  "options": ["Option 1", "Option 2", "Option 3"],
  "languages": {
    "en": "English question",
    "de": "German question",
    "fr": "French question"
  }
}
```

#### `GET /api/polls/:id`
Get specific poll details

#### `POST /api/polls/:id/vote`
Submit a vote
```json
{
  "option": "Selected option",
  "voterId": "optional-voter-id"
}
```

#### `GET /api/polls/:id/results`
Get poll results
```json
{
  "poll": { /* poll object */ },
  "results": {
    "Option 1": 5,
    "Option 2": 3
  },
  "totalVotes": 8
}
```

## EU Compliance

### Privacy & Data Protection (GDPR)
- Minimal data collection
- Optional voter identification
- No personal data storage beyond session
- Clear privacy notices

### Accessibility (WCAG 2.1)
- Keyboard navigation support
- Screen reader compatibility
- High contrast color scheme
- Semantic HTML structure
- Focus indicators

### Multi-language Support
- Interface translation for major EU languages
- Right-to-left language support ready
- Cultural considerations in design

## Deployment

### Environment Variables
```bash
PORT=3000  # Server port (default: 3000)
```

### Production Deployment
1. Build for production:
```bash
npm install --production
```

2. Start with PM2 (recommended):
```bash
npm install -g pm2
pm2 start server.js --name "eu-voting-app"
```

3. Or use Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Development

### Project Structure
```
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── public/                # Frontend files
│   ├── index.html        # Main HTML
│   ├── styles.css        # CSS styles
│   ├── app.js           # Main JavaScript
│   └── translations.js   # i18n translations
└── README.md             # This file
```

### Adding Languages
1. Add translations to `public/translations.js`
2. Add option to language selector in `index.html`
3. Test all interface elements

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Testing

### Manual Testing Checklist
- [ ] Poll creation works
- [ ] Voting functionality works
- [ ] Results display correctly
- [ ] Language switching works
- [ ] Mobile responsiveness
- [ ] Accessibility features
- [ ] Security measures active

### Future Enhancements
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication system
- [ ] Advanced poll types (ranked choice, multiple selection)
- [ ] Email notifications
- [ ] Export results to CSV/PDF
- [ ] Admin dashboard with analytics
- [ ] Integration with EU authentication systems

## License

MIT License - See LICENSE file for details

## Support

For support, questions, or contributions:
- Create an issue on GitHub
- Contact the development team
- Review documentation and API guides

---

**Made with ❤️ for European democracy**
