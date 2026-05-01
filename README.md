
# AI PRESCRIPTION READER

<div align="center">

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Tharasri78/ai-prescription-reader)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Tharasri78/ai-prescription-reader/pulls)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

</div>

---

##  Overview

**AI Prescription Reader** transforms messy, handwritten medical prescriptions into clean, structured, and readable medicine data. No more struggling to understand doctor's handwriting — just upload, extract, and track.

---

##  Key Features

###  Core Features

- **Upload** - Drag & drop prescription images
- **Auth** - Secure JWT login/registration
- **History** - View all past scans
- **Responsive** - Works on mobile & desktop

###  AI Features
 
- **Gemini API** - Reads handwriting
- **Smart Cleaning** - Converts `1-0-1` → "thrice daily"
- **Structured Output** - Medicine, Dosage, Frequency, Duration

### Display Features

- **Image Preview** - See prescription side-by-side
- **Clean Tables** - Easy to read results

---

### Data Flow

1. User uploads prescription image 
2. Frontend → Backend (Express) 
3. Backend → AI Service (FastAPI) 
4. AI calls Gemini API for extraction 
5. Backend cleans & normalizes output 
6. Data stored in MongoDB 
7. Results + image preview shown to user 

---

##  Tech Stack

**Frontend:** React.js, Axios, CSS3  
**Backend:** Node.js, Express.js, JWT  
**Database:** MongoDB, Mongoose  
**AI Service:** FastAPI (Python), Google Gemini API  
---

## 📂 Project Structure

```bash
ai-prescription-reader/
├── frontend/ # React app (pages, components, API client)
├── backend/ # Node.js + Express (routes, models, auth)
└── ai-services/ # FastAPI + Gemini (image processing)
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (v18+)
- Python (3.9+)
- MongoDB (local or Atlas)
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/Tharasri78/ai-prescription-reader.git
cd ai-prescription-reader
```

### 2. Backend Setup

```bash
cd backend/node-auth
npm install

# Create .env file
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:8000

npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. AI Service Setup

```bash
cd ai-services
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Set Gemini API key
 GEMINI_API_KEY=your_api_key

uvicorn main:app --reload --port 8000
```

## 👨‍💻 Author

**Thara Sri**

[![GitHub](https://img.shields.io/badge/GitHub-Tharasri78-181717?style=flat-square&logo=github)](https://github.com/Tharasri78)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/tharasri)
[![Email](https://img.shields.io/badge/Email-Contact-EA4335?style=flat-square&logo=gmail)](mailto:tharasribaskaran@gmail.com)

---
