# HR Ops Compliance Agent

A comprehensive web application for small to mid-sized businesses to automatically audit HR policies, employee handbooks, and compliance documents for regulatory gaps, missing clauses, and jurisdiction requirements.

## Features

### 🔐 User Authentication
- Secure user registration and login
- JWT-based authentication
- Multi-user support with task assignment

### 📄 Document Management
- Upload HR documents (PDF, Word, Text)
- Support for policy documents, handbooks, and compliance files
- Automatic document parsing and text extraction
- Document status tracking (pending, analyzing, completed, failed)

### 🤖 AI-Powered Compliance Analysis
- Powered by Claude AI (Anthropic)
- Automatic detection of compliance issues
- Risk classification by severity (Critical, High, Medium, Low, Info)
- Category-based issue grouping
- Jurisdiction-specific requirement identification
- Detailed recommendations for each issue

### 📊 Compliance Dashboard
- Real-time statistics and metrics
- Issues grouped by severity and category
- Document status overview
- Task completion tracking
- Visual risk indicators with color gradients

### ✅ Task Management
- Create tasks from compliance issues
- Assign tasks to team members
- Track task status (Pending, In Progress, Completed)
- Set due dates and priorities
- Filter and sort tasks

### 📑 Reporting Module
- Generate formal compliance audit reports
- Multi-document report compilation
- Professional formatting for audits
- Downloadable reports in Markdown format
- Executive summaries with key findings
- Issue categorization and severity breakdown

### 🎨 Professional UI
- Clean, modern design
- Risk color gradients (red, orange, yellow, green, blue)
- Card-based layouts
- Responsive design (mobile, tablet, desktop)
- Calm, enterprise-appropriate color tones

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Better-SQLite3** for database
- **Anthropic API** (Claude) for AI analysis
- **JWT** for authentication
- **Multer** for file uploads
- **PDF-Parse** for PDF extraction
- **Mammoth** for Word document parsing

## Installation

### Prerequisites
- Node.js 18+ and npm
- Anthropic API key

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd hr-ops-compliance-agent
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Configure environment variables**

Create a `.env` file in the `backend` directory:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your configuration:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-secret-key-change-in-production
ANTHROPIC_API_KEY=your-anthropic-api-key
```

To get an Anthropic API key:
1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key to your `.env` file

4. **Start the application**

Development mode (both frontend and backend):
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### 1. Register an Account
- Navigate to http://localhost:3000
- Click "Register here"
- Fill in your name, email, and password
- You'll be automatically logged in

### 2. Upload a Document
- Click "Documents" in the sidebar
- Click "Upload Document"
- Enter a title (e.g., "Employee Handbook 2025")
- Select your file (PDF, Word, or Text)
- Click "Upload"
- The system will automatically analyze the document

### 3. Review Compliance Issues
- Click on a document to view details
- Issues are grouped by severity (Critical → Info)
- Each issue includes:
  - Description of the compliance gap
  - Location in the document
  - Recommendation for resolution
  - Relevant jurisdiction/regulation

### 4. Create and Assign Tasks
- From a document's issues, click "Create Task"
- Fill in task details
- Assign to a team member
- Set a due date
- Track progress in the Tasks section

### 5. Generate Reports
- Navigate to "Reports"
- Click "Generate Report"
- Enter a report title
- Select documents to include
- Click "Generate Report"
- View or download the formatted report

## Project Structure

```
hr-ops-compliance-agent/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── database/        # Database schema and setup
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── types/           # TypeScript type definitions
│   │   └── index.ts         # Server entry point
│   ├── data/                # SQLite database (created automatically)
│   ├── uploads/             # Uploaded files (created automatically)
│   ├── package.json
│   └── tsconfig.json
│
├── package.json             # Root package.json (workspace)
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users

### Documents
- `POST /api/documents/upload` - Upload and analyze document
- `GET /api/documents` - Get all user documents
- `GET /api/documents/:id` - Get document with issues
- `DELETE /api/documents/:id` - Delete document

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report details
- `DELETE /api/reports/:id` - Delete report

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Compliance Categories

The system analyzes documents for issues in various categories:

- Equal Employment Opportunity
- Workplace Safety
- Data Privacy (GDPR, CCPA, etc.)
- Leave Policies (FMLA, PTO, etc.)
- Wage & Hour Compliance
- Anti-Discrimination
- Harassment Prevention
- Background Checks
- Termination Procedures
- Employee Benefits
- And more...

## Issue Severity Levels

- **Critical** 🔴 - Immediate action required, major legal risk
- **High** 🟠 - Important compliance gap, significant risk
- **Medium** 🟡 - Should be addressed, moderate risk
- **Low** 🟢 - Minor improvement recommended
- **Info** 🔵 - General information or best practice

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Secure file uploads with validation
- SQL injection prevention
- CORS protection
- File size limits
- Type validation

## Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Database
The application uses SQLite for data storage. The database is automatically created in `backend/data/compliance.db` on first run.

### File Storage
Uploaded documents are stored in `backend/uploads/` with unique filenames.

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is already in use:
- Frontend: Edit `frontend/vite.config.ts` to change port
- Backend: Edit `backend/.env` PORT variable

### Database Issues
Delete `backend/data/compliance.db` and restart the server to recreate the database.

### Upload Errors
Ensure the `backend/uploads/` directory exists and has write permissions.

### Analysis Errors
- Verify your Anthropic API key is correct in `.env`
- Check that you have API credits available
- Review backend logs for detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for internal use.

## Support

For issues, questions, or feature requests, please contact the development team or open an issue in the repository.

---

Built with ❤️ for better HR compliance management
