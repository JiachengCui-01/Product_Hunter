"""
Short entrypoint for the market-data refresh.

Equivalent to `python -m app.seed.refresh_market_data`, but as a plain
script so the command line stays short. The `-m module.path` form is
easy to mangle when pasted into a terminal (a wrapped line turns into
`python.exe -m` followed by a stray `app.seed.refresh_market_data`
command), which is a needless failure mode for an operation that is
usually run by hand against a production database.

Running this file also puts `backend/` on sys.path automatically, so the
`app.*` imports resolve without setting PYTHONPATH.

Usage (from backend/):
    .venv\\Scripts\\python.exe refresh.py
    .venv\\Scripts\\python.exe refresh.py --dry-run
    .venv\\Scripts\\python.exe refresh.py --category "Laundry Room"
"""

from app.seed.refresh_market_data import main

if __name__ == "__main__":
    main()
