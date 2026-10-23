import os
from typing import List

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from budget_recommendation import generate_budget_recommendations
from anomaly_detection import detect_spending_anomalies
from savings_recommendation import generate_savings_recommendations
from savings_forecast import forecast_savings_goals
from savings_risk import analyze_savings_risk
from savings_optimizer import optimize_savings_allocation


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# ============================================================
# MODEL PATHS
# ============================================================

CATEGORY_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "category_model.pkl"
)

VECTORIZER_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer.pkl"
)

FORECAST_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "spending_forecast_model.pkl"
)


# ============================================================
# LOAD CATEGORY MODEL
# ============================================================

try:
    category_model = joblib.load(
        CATEGORY_MODEL_PATH
    )

    print(
        "Category model loaded successfully."
    )

except Exception as error:
    print(
        "Error loading category model:",
        error
    )

    raise


# ============================================================
# LOAD TF-IDF VECTORIZER
# ============================================================

try:
    vectorizer = joblib.load(
        VECTORIZER_PATH
    )

    print(
        "TF-IDF vectorizer loaded successfully."
    )

except Exception as error:
    print(
        "Error loading TF-IDF vectorizer:",
        error
    )

    raise


# ============================================================
# LOAD FORECAST MODEL
# ============================================================

try:
    forecast_model = joblib.load(
        FORECAST_MODEL_PATH
    )

    print(
        "Spending forecast model loaded successfully."
    )

except Exception as error:
    print(
        "Error loading spending forecast model:",
        error
    )

    raise


print(
    "\nAll FinSight ML models loaded successfully.\n"
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="FinSight ML API",

    description=(
        "Machine Learning API for FinSight "
        "personal finance application."
    ),

    version="3.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://finsight-jmma.onrender.com",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# PYDANTIC MODELS
# ============================================================


# ------------------------------------------------------------
# CATEGORY REQUEST
# ------------------------------------------------------------

class TransactionRequest(BaseModel):
    description: str


# ------------------------------------------------------------
# ONE MONTH OF EXPENSE DATA
# ------------------------------------------------------------

class MonthlyExpense(BaseModel):
    month: int
    total_expense: float


# ------------------------------------------------------------
# FORECAST REQUEST
# ------------------------------------------------------------

class ForecastRequest(BaseModel):
    monthly_expenses: List[MonthlyExpense]

# ------------------------------------------------------------
# Budget recommendation REQUEST
# ------------------------------------------------------------

class BudgetTransaction(BaseModel):
    type: str
    amount: float
    category: str | None = None
    transaction_date: str | None = None


class BudgetRecommendationRequest(BaseModel):
    transactions: list[BudgetTransaction]

# ============================================================
# Anomaly detection request model
# ============================================================

class AnomalyTransaction(BaseModel):
    id: int | None = None
    type: str
    amount: float
    category: str
    description: str | None = None
    transaction_date: str


class AnomalyDetectionRequest(BaseModel):
    transactions: list[AnomalyTransaction]


# ============================================================
# SAVINGS RECOMMENDATION REQUEST MODELS
# ============================================================

class SavingsTransaction(BaseModel):
    type: str
    amount: float
    transaction_date: str


class SavingsGoalRequest(BaseModel):
    id: str
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: str


class SavingsRecommendationRequest(BaseModel):
    transactions: list[SavingsTransaction]
    goals: list[SavingsGoalRequest]


# ============================================================
# SAVINGS FORECAST REQUEST MODELS
# ============================================================

class SavingsForecastGoal(BaseModel):
    id: str
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: str


class SavingsForecastContribution(BaseModel):
    goal_id: str
    amount: float
    contribution_date: str


class SavingsForecastRequest(BaseModel):
    goals: list[SavingsForecastGoal]
    contributions: list[SavingsForecastContribution]


# ============================================================
# SAVINGS Allocation REQUEST MODELS
# ============================================================

from typing import Literal

class SavingsOptimizerGoal(BaseModel):
    id: str
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: str
    priority: Literal["high", "medium", "low"] = "medium"


class SavingsOptimizerRequest(BaseModel):
    monthly_budget: float
    strategy: Literal[
        "deadline_first",
        "priority_first",
        "balanced"
    ] = "deadline_first"
    goals: list[SavingsOptimizerGoal]


# ============================================================
# HOME ROUTE
# ============================================================

@app.get("/")
def home():

    return {
        "message":
            "FinSight ML API is running",

        "version":
            "3.0.0",

        "available_models": {
            "category_prediction": True,
            "personalized_spending_forecast": True,
        },

        "available_endpoints": {
            "category_prediction":
                "POST /predict",

            "spending_forecast":
                "POST /forecast",

            "health":
                "GET /health",
        },
    }


# ============================================================
# MODEL 1
# CATEGORY PREDICTION
# ============================================================

@app.post("/predict")
def predict_category(
    transaction: TransactionRequest
):

    try:

        # ----------------------------------------------------
        # CLEAN DESCRIPTION
        # ----------------------------------------------------

        description = (
            transaction.description
            .strip()
            .lower()
        )


        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not description:

            return {
                "error":
                    "Description cannot be empty."
            }


        # ----------------------------------------------------
        # TF-IDF TRANSFORMATION
        # ----------------------------------------------------

        vector = vectorizer.transform(
            [
                description
            ]
        )


        # ----------------------------------------------------
        # CATEGORY PREDICTION
        # ----------------------------------------------------

        prediction = (
            category_model.predict(
                vector
            )[0]
        )


        # ----------------------------------------------------
        # PROBABILITIES
        # ----------------------------------------------------

        probabilities = (
            category_model.predict_proba(
                vector
            )[0]
        )

        confidence = float(
            max(
                probabilities
            )
        )


        # ----------------------------------------------------
        # CATEGORY PROBABILITY MAP
        # ----------------------------------------------------

        classes = (
            category_model.classes_
        )

        probability_data = {}

        for (
            category,
            probability
        ) in zip(
            classes,
            probabilities
        ):

            probability_data[
                str(category)
            ] = round(
                float(probability),
                4
            )


        # ----------------------------------------------------
        # CONFIDENCE LEVEL
        # ----------------------------------------------------

        if confidence >= 0.70:

            confidence_level = "high"

        elif confidence >= 0.50:

            confidence_level = "medium"

        else:

            confidence_level = "low"


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {

            "description":
                transaction.description,

            "category":
                str(prediction),

            "confidence":
                round(
                    confidence,
                    4
                ),

            "confidence_percentage":
                round(
                    confidence * 100,
                    2
                ),

            "confidence_level":
                confidence_level,

            "probabilities":
                probability_data,
        }


    except Exception as error:

        print(
            "Category prediction error:",
            error
        )

        return {
            "error":
                "Could not predict category.",

            "details":
                str(error),
        }


# ============================================================
# MODEL 2
# PERSONALIZED SPENDING FORECAST
# ============================================================

@app.post("/forecast")
def forecast_spending(
    request: ForecastRequest
):

    try:

        # ----------------------------------------------------
        # CONVERT REQUEST TO PYTHON LIST
        # ----------------------------------------------------

        monthly_data = [
            {
                "month":
                    item.month,

                "total_expense":
                    item.total_expense,
            }

            for item
            in request.monthly_expenses
        ]


        # ----------------------------------------------------
        # CHECK HISTORY LENGTH
        # ----------------------------------------------------

        if len(monthly_data) < 2:

            return {
                "error":
                    (
                        "At least 2 months of expense "
                        "history are required to "
                        "generate a forecast."
                    ),

                "months_available":
                    len(monthly_data),

                "minimum_required":
                    2,
            }


        # ----------------------------------------------------
        # CREATE DATAFRAME
        # ----------------------------------------------------

        data = pd.DataFrame(
            monthly_data
        )


        # ----------------------------------------------------
        # CLEAN DATA
        # ----------------------------------------------------

        data["month"] = pd.to_numeric(
            data["month"],
            errors="coerce"
        )

        data["total_expense"] = (
            pd.to_numeric(
                data["total_expense"],
                errors="coerce"
            )
        )

        data = data.dropna(
            subset=[
                "month",
                "total_expense",
            ]
        )


        if len(data) < 2:

            return {
                "error":
                    (
                        "Not enough valid monthly "
                        "expense data to generate "
                        "a forecast."
                    )
            }


        # ----------------------------------------------------
        # REMOVE NEGATIVE EXPENSES
        # ----------------------------------------------------

        data = data[
            data["total_expense"] >= 0
        ]


        if len(data) < 2:

            return {
                "error":
                    (
                        "At least 2 valid months "
                        "are required."
                    )
            }


        # ----------------------------------------------------
        # SORT MONTHS
        # ----------------------------------------------------

        data = data.sort_values(
            by="month"
        )


        # ----------------------------------------------------
        # NORMALIZE MONTH INDEX
        #
        # Example:
        #
        # 202606, 202607, 202608
        #
        # becomes:
        #
        # 1, 2, 3
        #
        # This allows the saved model to operate on each
        # user's chronological spending history.
        # ----------------------------------------------------

        data = data.reset_index(
            drop=True
        )

        data["model_month"] = (
            data.index + 1
        )


        # ----------------------------------------------------
        # CURRENT MONTH
        # ----------------------------------------------------

        latest_row = (
            data.iloc[-1]
        )

        current_month = int(
            latest_row["month"]
        )

        current_expense = float(
            latest_row[
                "total_expense"
            ]
        )


        # ----------------------------------------------------
        # NEXT MODEL MONTH
        # ----------------------------------------------------

        next_model_month = (
            len(data) + 1
        )


        # ----------------------------------------------------
        # CREATE INPUT FOR SAVED MODEL
        # ----------------------------------------------------

        model_input = pd.DataFrame(
            {
                "month": [
                    next_model_month
                ]
            }
        )


        # ----------------------------------------------------
        # SAVED MODEL PREDICTION
        # ----------------------------------------------------

        model_prediction = (
            forecast_model.predict(
                model_input
            )[0]
        )

        model_prediction = float(
            model_prediction
        )


        # ----------------------------------------------------
        # USER'S PERSONAL SPENDING TREND
        # ----------------------------------------------------

        expenses = (
            data[
                "total_expense"
            ]
            .astype(float)
            .tolist()
        )

        changes = []

        for index in range(
            1,
            len(expenses)
        ):

            change = (
                expenses[index]
                -
                expenses[index - 1]
            )

            changes.append(
                change
            )


        # ----------------------------------------------------
        # AVERAGE MONTHLY CHANGE
        # ----------------------------------------------------

        if changes:

            average_change = (
                sum(changes)
                /
                len(changes)
            )

        else:

            average_change = 0.0


        personal_prediction = (
            current_expense
            +
            average_change
        )


        # ----------------------------------------------------
        # COMBINE GENERAL ML MODEL + PERSONAL HISTORY
        #
        # 40% = saved ML model
        # 60% = user's own spending trend
        # ----------------------------------------------------

        predicted_expense = (
            (
                model_prediction
                * 0.40
            )
            +
            (
                personal_prediction
                * 0.60
            )
        )


        # ----------------------------------------------------
        # PREVENT NEGATIVE PREDICTION
        # ----------------------------------------------------

        predicted_expense = max(
            0,
            predicted_expense
        )


        # ----------------------------------------------------
        # DIFFERENCE
        # ----------------------------------------------------

        difference = (
            predicted_expense
            -
            current_expense
        )


        # ----------------------------------------------------
        # PERCENTAGE CHANGE
        # ----------------------------------------------------

        if current_expense > 0:

            percentage_change = (
                difference
                /
                current_expense
            ) * 100

        else:

            percentage_change = 0.0


        # ----------------------------------------------------
        # TREND
        # ----------------------------------------------------

        if percentage_change > 1:

            trend = "increase"

        elif percentage_change < -1:

            trend = "decrease"

        else:

            trend = "stable"


        # ----------------------------------------------------
        # INSIGHT
        # ----------------------------------------------------

        if trend == "increase":

            insight = (
                "Based on your spending history, "
                "your expenses may increase "
                "next month."
            )

        elif trend == "decrease":

            insight = (
                "Based on your spending history, "
                "your expenses may decrease "
                "next month."
            )

        else:

            insight = (
                "Based on your spending history, "
                "your expenses are expected to "
                "remain relatively stable."
            )


        # ----------------------------------------------------
        # DATA QUALITY
        # ----------------------------------------------------

        months_used = len(
            data
        )

        if months_used >= 6:

            history_quality = "good"

        elif months_used >= 3:

            history_quality = "limited"

        else:

            history_quality = "very_limited"


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {

            "current_month":
                current_month,

            "current_expense":
                round(
                    current_expense,
                    2
                ),

            "predicted_expense":
                round(
                    predicted_expense,
                    2
                ),

            "difference":
                round(
                    difference,
                    2
                ),

            "percentage_change":
                round(
                    percentage_change,
                    2
                ),

            "trend":
                trend,

            "insight":
                insight,

            "months_used":
                months_used,

            "history_quality":
                history_quality,

            "model_details": {

                "general_model_prediction":
                    round(
                        model_prediction,
                        2
                    ),

                "personal_trend_prediction":
                    round(
                        personal_prediction,
                        2
                    ),

                "average_monthly_change":
                    round(
                        average_change,
                        2
                    ),
            },
        }


    except Exception as error:

        print(
            "Forecast error:",
            error
        )

        return {

            "error":
                (
                    "Could not generate "
                    "personalized spending forecast."
                ),

            "details":
                str(error),
        }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {

        "status":
            "healthy",

        "api":
            "FinSight ML API",

        "version":
            "3.0.0",

        "models": {

            "category_model":
                "loaded",

            "tfidf_vectorizer":
                "loaded",

            "forecast_model":
                "loaded",
        },

        "forecast_mode":
            "personalized_user_history",
    }

# ============================================================
# Budget Recommendations Endpoint
# ============================================================

@app.post("/budget-recommendations")
def budget_recommendations(
    request: BudgetRecommendationRequest,
):
    try:
        transactions = [
            transaction.model_dump()
            for transaction in request.transactions
        ]

        result = generate_budget_recommendations(transactions)

        return result

    except Exception as error:
        print("Budget recommendation error:", error)

        return {
            "status": "error",
            "message": str(error),
            "recommendations": [],
        }
    
    # ============================================================
# AI ANOMALY DETECTION
# ============================================================

@app.post("/detect-anomalies")
def detect_anomalies(request: AnomalyDetectionRequest):

    transactions = [
        transaction.model_dump()
        for transaction in request.transactions
    ]

    result = detect_spending_anomalies(
        transactions
    )

    return result



# ============================================================
# PERSONALIZED SAVINGS RECOMMENDATIONS API
# ============================================================

@app.post("/savings-recommendations")
def savings_recommendations(
    request: SavingsRecommendationRequest
):
    transactions = [
        transaction.model_dump()
        for transaction in request.transactions
    ]

    goals = [
        goal.model_dump()
        for goal in request.goals
    ]

    return generate_savings_recommendations(
        transactions=transactions,
        goals=goals,
    )

# ============================================================
# Savings Forecast API
# ============================================================


@app.post("/savings-forecast")
def predict_savings_completion(
    request: SavingsForecastRequest
):
    goals = [
        goal.model_dump()
        for goal in request.goals
    ]

    contributions = [
        contribution.model_dump()
        for contribution in request.contributions
    ]

    return forecast_savings_goals(
        goals=goals,
        contributions=contributions
    )

# ============================================================
# Savings Risk Analysis API
# ============================================================

@app.post("/savings-risk")
def savings_risk_analysis(
    request: SavingsForecastRequest
):
    return analyze_savings_risk(
        goals=[
            goal.model_dump()
            for goal in request.goals
        ],
        contributions=[
            contribution.model_dump()
            for contribution in request.contributions
        ],
    )

# ============================================================
# Savings Allocation Optimization API
# ============================================================

@app.post("/savings-optimize")
def savings_optimize(request: SavingsOptimizerRequest):
    return optimize_savings_allocation(
        goals=[
            goal.model_dump()
            for goal in request.goals
        ],
        monthly_budget=request.monthly_budget,
        strategy=request.strategy,
    )