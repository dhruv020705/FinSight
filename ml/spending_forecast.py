import os
import joblib
import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


# ==========================================================
# PATHS
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "monthly_expenses.csv",
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models",
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "spending_forecast_model.pkl",
)


# ==========================================================
# LOAD DATA
# ==========================================================

print("\n========================================")
print("SPENDING FORECAST MODEL")
print("========================================")

data = pd.read_csv(DATA_PATH)

print("\nDataset loaded successfully.")

print(
    f"Total months: {len(data)}"
)

print("\nData:\n")

print(data)


# ==========================================================
# FEATURES / TARGET
# ==========================================================

X = data[["month"]]

y = data["total_expense"]


# ==========================================================
# TIME-ORDERED TRAIN / TEST SPLIT
# ==========================================================

split_index = int(
    len(data) * 0.8
)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


print("\n========================================")
print("TRAIN / TEST SPLIT")
print("========================================")

print(
    f"\nTraining months: {len(X_train)}"
)

print(
    f"Testing months: {len(X_test)}"
)


# ==========================================================
# CREATE MODEL
# ==========================================================

model = LinearRegression()


# ==========================================================
# TRAIN
# ==========================================================

print("\n========================================")
print("TRAINING MODEL")
print("========================================")

model.fit(
    X_train,
    y_train,
)

print(
    "\nLinear Regression model trained."
)


# ==========================================================
# TEST PREDICTIONS
# ==========================================================

predictions = model.predict(
    X_test
)


# ==========================================================
# EVALUATION
# ==========================================================

mae = mean_absolute_error(
    y_test,
    predictions,
)

mse = mean_squared_error(
    y_test,
    predictions,
)

rmse = mse ** 0.5

r2 = r2_score(
    y_test,
    predictions,
)


print("\n========================================")
print("MODEL EVALUATION")
print("========================================")

print(
    f"\nMAE  : ₹{mae:.2f}"
)

print(
    f"MSE  : {mse:.2f}"
)

print(
    f"RMSE : ₹{rmse:.2f}"
)

print(
    f"R²   : {r2:.4f}"
)


# ==========================================================
# TEST RESULTS
# ==========================================================

print("\n========================================")
print("TEST PREDICTIONS")
print("========================================\n")


for month, actual, predicted in zip(
    X_test["month"],
    y_test,
    predictions,
):

    print(
        f"Month {month}"
    )

    print(
        f"Actual    : ₹{actual:.2f}"
    )

    print(
        f"Predicted : ₹{predicted:.2f}"
    )

    print(
        f"Difference: "
        f"₹{abs(actual - predicted):.2f}"
    )

    print(
        "-" * 40
    )


# ==========================================================
# NEXT MONTH FORECAST
# ==========================================================

next_month = (
    int(data["month"].max()) + 1
)

next_month_data = pd.DataFrame(
    {
        "month": [
            next_month
        ]
    }
)

next_month_prediction = (
    model.predict(
        next_month_data
    )[0]
)


print("\n========================================")
print("NEXT MONTH FORECAST")
print("========================================")

print(
    f"\nMonth {next_month}"
)

print(
    f"Predicted Expense: "
    f"₹{next_month_prediction:.2f}"
)


# ==========================================================
# RETRAIN ON ALL DATA BEFORE SAVING
# ==========================================================

final_model = LinearRegression()

final_model.fit(
    X,
    y,
)


# Recalculate next-month forecast using
# the final model trained on all available data.

final_prediction = (
    final_model.predict(
        next_month_data
    )[0]
)


print(
    "\nFinal forecast after training "
    "on all available months:"
)

print(
    f"₹{final_prediction:.2f}"
)


# ==========================================================
# SAVE MODEL
# ==========================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True,
)

joblib.dump(
    final_model,
    MODEL_PATH,
)


print("\n========================================")
print("MODEL SAVED")
print("========================================")

print(
    f"\n{MODEL_PATH}"
)

print(
    "\nSpending forecast model "
    "completed successfully."
)