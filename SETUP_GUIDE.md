# HR Ops Compliance Agent - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install all dependencies for frontend and backend
npm run install:all
```

### 2. Configure Anthropic API Key
```bash
# Edit backend/.env file
cd backend
nano .env
```

Add your Anthropic API key:
```
ANTHROPIC_API_KEY=your-actual-api-key-here
```

Get your API key from: https://console.anthropic.com/

### 3. Run the Application
```bash
# From the root directory
npm run dev
```

This will start:
- Backend API on http://localhost:5000
- Frontend on http://localhost:3000

### 4. Create Your First Account
1. Open http://localhost:3000
2. Click "Register here"
3. Fill in your details
4. You're ready to go!

## 📋 What You Can Do

### Upload Documents
- Supported formats: PDF, Word (.docx), Text (.txt)
- Maximum file size: 10MB
- Automatic AI analysis using Claude

### View Compliance Issues
Issues are categorized by:
- **Severity**: Critical, High, Medium, Low, Info
- **Category**: EEOC, Safety, Privacy, Leave Policies, etc.
- **Jurisdiction**: Federal, State-specific regulations

### Manage Tasks
- Create tasks from issues
- Assign to team members
- Track progress
- Set due dates

### Generate Reports
- Select multiple documents
- Generate formal compliance reports
- Download in Markdown format
- Ready for audits

## 🔧 Configuration

### Change Ports
**Frontend** - Edit `frontend/vite.config.ts`:
```typescript
server: {
  port: 3000, // Change this
}
```

**Backend** - Edit `backend/.env`:
```
PORT=5000  # Change this
```

### Database Location
SQLite database is stored at: `backend/data/compliance.db`

### Uploaded Files
Files are stored in: `backend/uploads/`

## 🛠️ Development Commands

```bash
# Install dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Sample Workflow

1. **Register** an account
2. **Upload** an employee handbook or HR policy
3. **Wait** for AI analysis (usually 30-60 seconds)
4. **Review** identified compliance issues
5. **Create tasks** for critical items
6. **Assign** tasks to team members
7. **Generate** a compliance report
8. **Download** and share with stakeholders

## 🔐 Security Notes

- Change the JWT_SECRET in production
- Keep your Anthropic API key secure
- Never commit `.env` files to git
- Use HTTPS in production
- Set up proper access controls

## 🆘 Troubleshooting

### "Port already in use"
Kill the process using the port or change the port number in config.

### "Database locked"
Stop all running instances and restart.

### "Upload failed"
Check that `backend/uploads/` directory exists and has write permissions.

### "Analysis failed"
- Verify Anthropic API key is correct
- Check API credits at https://console.anthropic.com/
- Review backend logs for details

### "Module not found"
Run `npm run install:all` again.

## 📞 Need Help?

Check the main README.md for comprehensive documentation.

---

Happy compliance auditing! 🎉
