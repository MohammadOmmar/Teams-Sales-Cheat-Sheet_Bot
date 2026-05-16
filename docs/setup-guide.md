# Setup Guide

## Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

### For Teams Deployment (Optional)
- Microsoft 365 developer account
- Azure subscription (for bot registration)
- [ngrok](https://ngrok.com) or Dev Tunnels (for local tunneling)

---

## Step 1: Install Dependencies

```bash
# Navigate to the project directory
cd salescheat-bot

# Install all dependencies
npm install
```

This installs:
- `express` — Web server framework
- `botbuilder` — Microsoft Bot Framework SDK
- `cors` — Cross-origin resource sharing
- `dotenv` — Environment variable management

---

## Step 2: Configure Environment

Copy the example `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server port (default: 3000)
PORT=3000

# Microsoft Teams Bot credentials (leave empty for web-only demo)
MICROSOFT_APP_ID=
MICROSOFT_APP_PASSWORD=

# OpenAI API key (optional - bot works without it)
OPENAI_API_KEY=
```

---

## Step 3: Start the Server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

You should see:

```
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🎯 SalesCheat Bot is running!          ║
  ║                                          ║
  ║   Web UI:  http://localhost:3000          ║
  ║   API:     http://localhost:3000/api      ║
  ║   Health:  http://localhost:3000/api/health║
  ║                                          ║
  ╚══════════════════════════════════════════╝
```

Open **http://localhost:3000** in your browser!

---

## Step 4: Test the Bot

### Via Web UI
1. Navigate to `http://localhost:3000`
2. Click one of the example buttons or paste a bio
3. The Battle Card should appear within 1-2 seconds

### Via API (curl)
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input": "Senior Software Engineer at Google, 8 years experience in Kubernetes and cloud infrastructure"}'
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

---

## Step 5: Teams Deployment (Optional)

### 5.1 Register the Bot in Azure

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Azure Bot** resource
3. Under **Configuration**, note:
   - **Microsoft App ID**
   - **Microsoft App Password** (create a new client secret)
4. Set the **Messaging endpoint** to: `https://your-domain.com/api/messages`

### 5.2 Configure Environment

Update `.env`:
```env
MICROSOFT_APP_ID=your-app-id-here
MICROSOFT_APP_PASSWORD=your-app-password-here
```

### 5.3 Set Up Tunneling (for local development)

Using ngrok:
```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update the Azure Bot's messaging endpoint to:
```
https://abc123.ngrok.io/api/messages
```

### 5.4 Create Teams App Package

1. Open `teams-manifest/manifest.json`
2. Replace `{{MICROSOFT_APP_ID}}` with your actual App ID
3. Add bot icon files (`color.png` 192×192, `outline.png` 32×32)
4. Zip the manifest folder contents:
   ```bash
   cd teams-manifest
   zip -r ../salescheat-bot.zip *
   ```

### 5.5 Upload to Teams

1. Open Microsoft Teams
2. Go to **Apps** → **Manage your apps** → **Upload a custom app**
3. Upload `salescheat-bot.zip`
4. The bot should now appear in your Teams chat

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Change the port in .env
PORT=3001
```

### Bot not responding in Teams
1. Verify your `MICROSOFT_APP_ID` and `MICROSOFT_APP_PASSWORD` are correct
2. Check that your ngrok/tunnel is running
3. Verify the messaging endpoint URL in Azure Portal matches your tunnel URL
4. Check server logs for errors

### Vector store issues
```bash
# Delete and regenerate
rm server/data/vectorStore.json
npm start  # Vectors will be recomputed
```
