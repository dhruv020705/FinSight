# 💸 FinSight — AI-Powered Personal Finance Management Platform

### Track Smarter. Spend Wisely. Save Better.

**FinSight** is a full-stack, AI-powered personal finance management platform designed to help users understand their spending habits, manage budgets, optimize savings, and make informed financial decisions.

Unlike traditional expense trackers, FinSight integrates **Machine Learning, predictive analytics, anomaly detection, and intelligent financial recommendations** into a unified, interactive dashboard.

Built using **Next.js, TypeScript, Supabase, FastAPI, and Scikit-learn**, FinSight combines modern web development with practical machine learning applications.

---

## 📸 Application Preview

![FinSight Dashboard](public/screenshots/dashboard.png)

*An intelligent financial dashboard combining income and expense tracking, spending analytics, forecasts, and anomaly detection.*

## ✨ Key Features

### 🧠 1. AI-Powered Expense Classification

Automatically predicts expense categories using a trained machine learning model.

- Uses **TF-IDF Vectorization** to transform transaction descriptions into numerical features.
- Applies **Logistic Regression** for expense classification.
- Integrates the model with the frontend through FastAPI.
- Supports manual category selection when needed.

![ML Expense Classification](public/screenshots/ml-classification.png)

### 📊 2. Intelligent Financial Dashboard

A centralized financial overview with:

- Total income, expenses, and available balance.
- Interactive spending and financial analytics.
- Monthly income-versus-expense comparisons.
- Spending forecasts.
- Unusual transaction alerts.
- Recent transaction activity.

### 💰 3. Smart Budget Management

Manage category-wise spending limits and track financial performance.

- Create and manage monthly budgets.
- Monitor category-level spending.
- Visualize budget utilization.
- Identify overspending risks.
- Generate intelligent budget recommendations.
- Analyze budget trends over six months.

![Budget Analytics](public/screenshots/budget-analytics.png)

### 🎯 4. AI Savings Management & Optimization

A comprehensive savings management system that goes beyond traditional savings trackers.

- Create and manage financial savings goals.
- Track savings contributions and progress.
- Prioritize savings goals.
- Generate savings recommendations.
- Forecast future savings progress.
- Analyze financial goal risks.
- Simulate different savings scenarios.
- Optimize allocation across multiple goals.
- Compare alternative allocation strategies.

![Savings Optimizer](public/screenshots/savings-optimizer.png)

### 📈 5. Predictive Spending Analytics

Uses historical financial information to estimate future spending patterns.

- Spending forecasting powered by Python ML services.
- Visual representation of projected expenses.
- Supports proactive financial planning.
- Helps identify potential future budget pressure.

### 🚨 6. Spending Anomaly Detection

Detects unusual financial activity and highlights potentially unexpected spending patterns.

- Analyzes transaction and spending behavior.
- Identifies anomalous financial activity.
- Displays alerts in the financial dashboard.
- Helps users review unexpected expenses.

### 📑 7. Financial Reports & Analytics

Generate detailed financial summaries with interactive visualizations.

- Six-month income-versus-expense comparisons.
- Net cash flow analysis.
- Category-wise expense distribution.
- Monthly financial summaries.
- Financial insights and trend analysis.
- Export reports in **CSV and PDF** formats.

![Financial Reports](public/screenshots/financial-reports.png)

### 🔐 8. Secure Authentication & Data Management

- Supabase email/password authentication.
- User-specific financial information.
- Persistent authentication sessions.
- Protected financial pages.
- Supabase PostgreSQL database.
- Row Level Security (RLS) policies for data isolation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Backend API | Python, FastAPI |
| Machine Learning | Scikit-learn |
| NLP | TF-IDF Vectorization |
| Classification | Logistic Regression |
| Reports | jsPDF, CSV |
| Version Control | Git, GitHub |

---

## 🏗️ System Architecture

```text
                    FIN SIGHT
                 User Interface
                       |
                       v
             Next.js + TypeScript
                       |
             +---------+---------+
             |                   |
             v                   v
        Supabase             FastAPI
        Backend              ML APIs
             |                   |
       +-----+-----+      +------+------+
       |           |      |             |
 Authentication  Database ML Models  Analytics
       |           |      |             |
       +-----------+------+-------------+
                       |
                       v
              Financial Insights
```

**Workflow:**

1. Users securely authenticate through Supabase.
2. Financial transactions are stored in PostgreSQL.
3. The frontend retrieves and displays user-specific financial information.
4. FastAPI processes ML-related requests.
5. Machine learning models generate predictions and recommendations.
6. Results are presented through interactive charts and financial dashboards.

---

## 🤖 Machine Learning Components

| ML Component | Purpose |
|---|---|
| Expense Classification | Predicts transaction categories |
| Spending Forecasting | Estimates future spending |
| Anomaly Detection | Identifies unusual spending behavior |
| Budget Recommendation | Supports smarter budget allocation |
| Savings Forecasting | Estimates savings progress |
| Savings Risk Analysis | Analyzes risks to financial goals |
| Savings Allocation Optimization | Recommends allocation strategies |

### Expense Classification Pipeline

```text
Transaction Description
          |
          v
   Text Preprocessing
          |
          v
  TF-IDF Vectorization
          |
          v
 Logistic Regression
          |
          v
  Predicted Category
          |
          v
  FinSight Interface
```

---

## 📂 Project Structure

```text
FinSight/
│
├── app/
│   ├── components/
│   ├── dashboard/
│   ├── transactions/
│   ├── budget/
│   ├── savings/
│   ├── reports/
│   ├── login/
│   ├── signup/
│   └── page.tsx
│
├── ml/
│   ├── api.py
│   ├── train.py
│   ├── anomaly_detection.py
│   ├── budget_recommendation.py
│   ├── spending_forecast.py
│   ├── savings_forecast.py
│   ├── savings_optimizer.py
│   ├── savings_recommendation.py
│   ├── savings_risk.py
│   ├── models/
│   └── data/
│
├── public/
│   └── screenshots/
│
├── src/
│   └── supabase.ts
│
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Supabase project
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/dhruv020705/FinSight.git
cd FinSight
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root and configure the Supabase environment variables required by `src/supabase.ts`.

Keep all private credentials and secret keys out of Git.

### 4. Start the Frontend

```bash
npm run dev
```

Visit:

`http://localhost:3000`

### 5. Start the Machine Learning Backend

Install the Python dependencies required by the ML modules.

For a FastAPI application named `app` inside `ml/api.py`, run from the project root:

```bash
uvicorn ml.api:app --reload --port 8000
```

If your Python imports require running inside the `ml` directory, start the server from there instead.

FastAPI documentation:

`http://127.0.0.1:8000/docs`

Ensure the frontend API configuration points to the running backend.

**Note:** Database schema, RLS policies, Python dependencies, and environment settings must be configured for a fresh installation.

---

## 🔮 Future Enhancements

- AI-powered conversational financial assistant.
- Personalized spending insights and financial recommendations.
- Bank statement import and automatic transaction extraction.
- Enhanced financial forecasting models.
- Automated recurring transaction detection.
- Goal-based financial planning.
- Production deployment and automated testing.

---

## 🎯 Project Highlights

FinSight demonstrates practical experience in:

- Full-stack application development.
- Machine learning integration with web applications.
- REST API development.
- Secure authentication and database management.
- Financial data visualization.
- Predictive analytics and recommendation systems.
- Responsive UI/UX design.
- Building modular, scalable software systems.

---

## 👨‍💻 Developer

**Dhruv Gupta**

Full Stack Developer | Machine Learning Enthusiast

- **GitHub:** [dhruv020705](https://github.com/dhruv020705)
- **Project Repository:** [FinSight](https://github.com/dhruv020705/FinSight)

---

## ⭐ Support

If you find FinSight interesting, consider giving the repository a ⭐ on GitHub.

**FinSight — Turning Financial Data into Smarter Decisions.**