<<<<<<< HEAD
# 🛡️ MedGuard

### AI-Assisted Medication Safety & Adverse Drug Reaction Assessment Platform

MedGuard is a full-stack medical decision-support application designed to help healthcare professionals assess potential medication-related risks for patients.

The system combines a **React frontend**, **Express backend**, **PostgreSQL database**, and **Flask-based ML API** to provide medicine information, adverse drug reaction (ADR) predictions, patient-specific safety assessments, medicine comparisons, and potential alternatives.

> **Important:** MedGuard is an academic/research project and is intended to assist healthcare professionals. It does not replace professional medical judgment, diagnosis, or prescribing decisions.

---

## 🚀 Features

### 👨‍⚕️ Doctor Dashboard

- Doctor profile and account management
- Dashboard with assessment statistics
- Patient management
- Recent assessments
- Quick access to new medication assessments

### 👤 Patient Management

- Create and manage patient records
- Store relevant patient information
- Maintain patient assessment history
- View previous medication assessments

### 💊 Medicine Search

- Search medicines from the database
- View medicine information
- View associated uses
- View reported side effects

### 🧠 AI-Based ADR Prediction

The Flask ML API analyzes medicine-related data and predicts potential adverse drug reactions.

The system can return:

- Predicted adverse drug reactions
- Prediction confidence/probability
- Risk-related information
- Medicine-specific results

### 🔍 Patient Safety Assessment

MedGuard combines patient information and medicine information to generate a safety assessment.

The assessment can consider factors such as:

- Patient information
- Disease/condition
- Selected medicine
- Potential adverse reactions
- Relevant safety information

### 🔄 Potential Medicine Alternatives

The application can identify potential alternative medicines based on available medicine and usage information.

Alternatives are presented as **potential options for professional review**, not automatic prescriptions.

### ⚖️ Medicine Comparison

Compare medicines and view their available safety and ADR-related information.

### 📊 Reports

- View completed assessments
- Review assessment results
- Track patient medication assessments
- Display risk-related information

---

# 🏗️ System Architecture

```text
                        ┌──────────────────────┐
                        │      React Client    │
                        │   React + Tailwind   │
                        └──────────┬───────────┘
                                   │
                                   │ HTTP / REST API
                                   ▼
                        ┌──────────────────────┐
                        │    Express Server    │
                        │   Backend / REST API │
                        └───────┬───────┬──────┘
                                │       │
                     PostgreSQL │       │ HTTP
                                │       │
                                ▼       ▼
                    ┌──────────────┐  ┌─────────────────┐
                    │  PostgreSQL  │  │   Flask ML API  │
                    │   Database   │  │  ML Predictions │
                    └──────────────┘  └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │ ML Models / Data│
                                      └─────────────────┘
```

---

# 🧰 Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- TypeScript/JavaScript
- Lucide React
- Axios

## Backend

- Node.js
- Express.js
- PostgreSQL
- REST APIs

## Machine Learning API

- Python
- Flask
- Flask-CORS
- Scikit-learn
- Pandas
- NumPy

## Database

- PostgreSQL

The database stores information related to:

- Medicines
- Medicine uses
- Side effects
- Patients
- Assessments
- Doctors/users
- Assessment results

---

# 📁 Project Structure

```text
MedGuard/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── config/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── api/
│   ├── routes/
│   │   ├── health.py
│   │   ├── prediction.py
│   │   ├── alternatives.py
│   │   ├── patient_safety.py
│   │   └── medicine_compare.py
│   ├── models/
│   ├── app.py
│   └── requirements.txt
│
├── database/
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

---

# 🔄 Application Flow

A typical medication assessment follows this flow:

```text
Doctor
  │
  ▼
Select/Create Patient
  │
  ▼
Select Medicine
  │
  ▼
Create Assessment
  │
  ▼
Express Backend
  │
  ├──────────────► PostgreSQL
  │
  ▼
Flask ML API
  │
  ▼
ADR Prediction
  │
  ▼
Safety Assessment
  │
  ├──────────────► Potential Alternatives
  │
  ▼
Assessment Result
  │
  ▼
Doctor Dashboard / Reports
```

---

# 🧠 Machine Learning

The machine-learning component is separated from the main backend and exposed through a Flask REST API.

This separation allows the ML system to be developed and updated independently from the main application.

### ML API Responsibilities

The Flask API provides endpoints for:

- ADR prediction
- Alternative medicine analysis
- Patient safety assessment
- Medicine comparison
- Health/status checks

Example API structure:

```text
GET  /health

POST /predict

POST /alternatives

POST /patient-safety

POST /medicine-compare
```

The exact endpoints may vary depending on the current implementation.

---

# 📊 Dataset

The project uses publicly available drug/ADR-related data for research and model development.

The project has worked with data derived from sources such as:

- SIDER
- Drug/medicine information datasets
- Processed medicine and adverse-effect data

The processed database contains a large collection of medicine-related records, including medicine names, uses, and reported side effects.

> Dataset licensing, attribution, and permitted usage should be verified before distributing the dataset itself with the project.

---

# 🗄️ Database

MedGuard uses PostgreSQL as its primary database.

The database contains information related to:

```text
Doctors / Users
       │
       ▼
Patients
       │
       ▼
Assessments
       │
       ├──────────► Medicines
       │
       ├──────────► Predicted ADRs
       │
       └──────────► Assessment Results
```

Medicine-related data includes:

```text
Medicine
├── Name
├── Uses
└── Side Effects
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd MedGuard
```

---

# 2. Frontend Setup

Navigate to the client:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create the required environment configuration if your frontend uses environment variables.

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 3. Backend Setup

Open another terminal:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Configure the environment variables.

Example:

```env
PORT=5000

DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/medguard

FLASK_API_URL=http://127.0.0.1:5001
```

Start the backend:

```bash
npm run dev
```

The backend will normally run on:

```text
http://localhost:5000
```

---

# 4. PostgreSQL Setup

Install PostgreSQL and create a database:

```sql
CREATE DATABASE medguard;
```

Configure your PostgreSQL credentials in the backend `.env` file.

Example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medguard
DB_USER=postgres
DB_PASSWORD=your_password
```

Use the environment variable names expected by your current backend configuration.

---

# 5. Flask ML API Setup

Navigate to the API directory:

```bash
cd api
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask API:

```bash
python app.py
```

The ML API is expected to run on:

```text
http://127.0.0.1:5001
```

---

# ▶️ Running the Complete Application

MedGuard requires three services to run during development.

### Terminal 1 — Frontend

```bash
cd client
npm run dev
```

### Terminal 2 — Express Backend

```bash
cd server
npm run dev
```

### Terminal 3 — Flask ML API

```bash
cd api
python app.py
```

Then open the frontend:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

Do **not** commit `.env` files to GitHub.

Example:

```text
.env
.env.local
```

should be included in `.gitignore`.

Instead, provide an example configuration:

```text
.env.example
```

Example:

```env
PORT=5000

DATABASE_URL=

DB_HOST=localhost
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=

FLASK_API_URL=http://127.0.0.1:5001
```

Never commit:

- Database passwords
- API keys
- Authentication secrets
- Private credentials

---

# 🔌 API Communication

The application follows a layered architecture.

```text
React
  │
  ▼
Express REST API
  │
  ├── PostgreSQL
  │
  └── Flask ML API
          │
          ▼
       ML Model
```

The Express backend acts as the main application server while the Flask service handles machine-learning functionality.

---

# 🧪 Testing

Before using the complete application, verify each service independently.

### Check Flask API

```text
GET /health
```

Expected response should indicate that the service is running.

### Check Express API

Verify that the backend starts without database connection errors.

### Check PostgreSQL

Verify that the backend can successfully connect to the database.

### Check Frontend

Verify that the React application can communicate with the Express backend.

---

# 🛡️ Medical Safety Disclaimer

MedGuard is an academic/research software project.

The information and predictions generated by the application should **not be treated as medical advice, diagnosis, or an automatic prescription**.

Potential medicine alternatives and adverse drug reaction predictions should be reviewed by a qualified healthcare professional using appropriate clinical information and authoritative medical resources.

The project does not guarantee the accuracy, completeness, or clinical applicability of its predictions.

---

# 🔮 Future Improvements

Potential future improvements include:

- Improved ADR prediction models
- Better patient-specific risk modeling
- Explainable AI for predictions
- Drug-drug interaction detection
- Drug-disease interaction detection
- Drug-allergy checking
- Dosage and contraindication support using authoritative sources
- More comprehensive medicine information
- Improved alternative-medicine ranking
- Model evaluation and validation on additional datasets
- Role-based access control
- Audit logging
- Production deployment
- Automated testing and CI/CD
- Improved security and authentication

---

# 📌 Current Limitations

- ML predictions depend on the quality and coverage of the training data.
- Dataset-derived information may not represent every medicine or patient population.
- Potential alternatives should not be interpreted as direct prescriptions.
- The application requires further clinical validation before real-world medical use.
- Some medicine information may require verification against current authoritative sources.

---

# 👨‍💻 Development

MedGuard is structured as a multi-service application:

```text
Frontend
React + Vite + Tailwind
        │
        ▼
Backend
Node.js + Express
        │
        ├──────────────┐
        ▼              ▼
PostgreSQL        Flask API
                     │
                     ▼
               ML Components
```

This architecture keeps the presentation layer, application logic, database, and machine-learning functionality separated.

---

# 📜 License

This project is intended for academic and educational purposes.

If you plan to publish or distribute the project, add an appropriate open-source license after verifying the licenses and attribution requirements of all third-party datasets, libraries, and APIs used by the project.

---

# ⭐ Acknowledgements

This project uses open-source technologies and publicly available datasets/resources for research and development.

Technologies used include:

- React
- Vite
- Tailwind CSS
- Node.js
- Express.js
- PostgreSQL
- Python
- Flask
- Scikit-learn
- Pandas
- NumPy
=======
# Main-Project
>>>>>>> 3a584f5170c32fa948009b6771ed03911e1f425f
