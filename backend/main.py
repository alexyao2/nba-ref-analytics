from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data.csv_loader import load_csv_rows
from services.metrics_service import (
    build_overview_metrics,
    conclusion_scatter_profiles,
    consistency_analysis,
    foul_differential,
    foul_differential_leaders,
    home_bias_index,
    outlier_analysis,
)
from services.referee_service import filter_rows, get_seasons, get_splits

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:4173",
        "http://localhost:4174",
        "http://localhost:4175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:4174",
        "http://127.0.0.1:4175",
        "http://98.81.239.149:3000",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def filtered_csv_rows(season=None, split=None, min_games=None):
    return filter_rows(load_csv_rows(), season, split, min_games)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/referees")
def get_referees(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
):
    return filtered_csv_rows(season, split, min_games)

@app.get("/api/seasons")
def get_available_seasons():
    return {"seasons": get_seasons(load_csv_rows())}

@app.get("/api/splits")
def get_available_splits():
    return {"splits": get_splits(load_csv_rows())}


@app.get("/api/metrics/overview")
def get_overview_metrics(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
):
    return build_overview_metrics(filtered_csv_rows(season, split, min_games))

@app.get("/api/metrics/foul-differential")
def get_foul_differential(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
):
    return {"foul_differential": foul_differential(filtered_csv_rows(season, split, min_games))}


@app.get("/api/metrics/foul-differential/leaders")
def get_foul_differential_leaders(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    limit: int = 10,
):
    return {"leaders": foul_differential_leaders(filtered_csv_rows(season, split, min_games), limit)}


@app.get("/api/metrics/home-bias")
def get_home_bias_index(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    limit: int = 10,
):
    return home_bias_index(filtered_csv_rows(season, split, min_games), limit)


@app.get("/api/metrics/conclusions/scatter")
def get_conclusion_scatter_profiles(
    season: str | None = None,
    split: str = "regular_season",
    min_games: int = 40,
    limit: int = 120,
):
    return conclusion_scatter_profiles(filtered_csv_rows(season, split, min_games), limit)


@app.get("/api/metrics/outliers")
def get_outlier_analysis(
    field: str = "foul_differential_road_minus_home",
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    threshold: float = 2.0,
    limit: int = 20,
):
    try:
        return {
            "field": field,
            "threshold": threshold,
            "outliers": outlier_analysis(filtered_csv_rows(season, split, min_games), field, threshold, limit),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/api/metrics/consistency")
def get_consistency_analysis(
    field: str = "foul_differential_road_minus_home",
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    limit: int = 20,
):
    try:
        return {
            "field": field,
            "results": consistency_analysis(filtered_csv_rows(season, split, min_games), field, limit),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
