#   AI Prescription Reader

An AI-powered web application that extracts and structures medicine details from handwritten medical prescriptions.

---

##  Overview

This project converts unstructured prescription images into structured, readable medicine data using AI.

It helps users:

* Understand doctor prescriptions
* View medicines clearly
* Track past prescriptions

---

##  Key Features

###  Core Functionality

* Upload prescription images
* Extract medicines using AI (Gemini)
* Display structured data (name, dosage, frequency, duration)

###  Smart Processing

* Cleans inconsistent AI output
* Normalizes formats (e.g., `1-0-1`)
* Filters invalid or noisy results

###  History Tracking

* Saves all scans per user
* View past prescriptions
* Displays scan date and medicines

###  Image Context

* Shows prescription preview with results
* Helps users identify which prescription the data belongs to

###  Responsive UI

* Works on mobile and desktop
* Hamburger menu for mobile navigation
* Clean and modern interface

---

##  Tech Stack

### Frontend

* React.js
* Axios
* CSS (custom styling)

### Backend

* Node.js
* Express.js
* MongoDB

### AI Service

* FastAPI (Python)
* Google Gemini API

---

##  Architecture

Frontend → Backend → AI Service → Gemini API

---

## 🔁 Data Flow

1. User uploads prescription image
2. Frontend sends request to backend
3. Backend forwards image to AI service
4. AI extracts medicine details
5. Backend cleans and validates data
6. Data is stored in MongoDB
7. Results are displayed in UI

---

## 📂 Project Structure

### Frontend

```
frontend/
  pages/
    Upload.jsx
    Results.jsx
    History.jsx
  components/
    Navbar/
    MedicineCard/
  services/
    api.js
```

### Backend

```
backend/
  routes/
    scan.js
    auth.js
  models/
    User.js
    Scan.js
```

### AI Service

```
ai-services/
  main.py
  gemini.py
```

---

## ⚙️ Installation

### 1. Clone repository

```
git clone https://github.com/Tharasri78/ai-prescription-reader.git
cd ai-prescription-reader
```

---

### 2. Setup Backend

```
cd backend/node-auth
npm install
npm start
```

---

### 3. Setup Frontend

```
cd frontend
npm install
npm run dev
```

---

### 4. Setup AI Service

```
cd ai-services
pip install -r requirements.txt
uvicorn main:app --reload
```

---

##  Authentication

* JWT-based authentication
* Protected routes for scan and history
* Basic login & registration system

---

##  Why This Project Matters

* Solves a real healthcare problem
* Combines AI with full-stack development
* Handles messy real-world input
* Focuses on usability over unnecessary complexity

---

## 📌 Note

This application provides AI-generated suggestions. Always consult a doctor before taking any medication.

---

## 👤 Author

**Thara Sri**


---

