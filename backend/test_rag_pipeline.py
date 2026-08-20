"""
NestQuest RAG Pipeline Test Harness
=====================================
Run this against your local backend (Flask on :5000, Postgres on :5432)
to exercise the RAG pipeline's edge cases without touching pgAdmin by hand.

WHAT IT DOES
------------
- Talks to your API over HTTP (requests) for search/auth.
- Talks to Postgres directly (psycopg2) ONLY to set up/tear down test
  conditions your Phase 3 CRUD routes don't support yet (e.g. flipping
  availability_status, inserting a property that bypasses the embed hook).
- Every test that mutates real data restores it in a try/finally block,
  and prints a clear warning before doing anything destructive.
- Tests involving dummy data use throwaway properties with a
  'ZZTEST_' prefix so they're never confused with your 20 seeded ones,
  and are deleted at the end.

WHAT IT CANNOT DO (do these manually)
--------------------------------------
- Gemini graceful degradation: the API key is loaded at Flask startup,
  so to test "invalid key -> ai_explanation: null for every result" you
  need to temporarily break GEMINI_API_KEY in .env, restart `python app.py`,
  run this script's `test_gemini_degradation()` alone, then restore + restart.
- Semantic quality: `test_semantic_quality()` prints top-K results for a
  batch of queries so you can eyeball relevance yourself. That judgment
  call isn't automatable.

SETUP
-----
pip install requests psycopg2-binary python-dotenv --break-system-packages
(adjust CONFIG below, or just make sure backend/.env has DATABASE_URL)

USAGE
-----
python test_rag_pipeline.py            # run everything (asks before destructive tests)
python test_rag_pipeline.py --only 1,5 # run specific tests by number
python test_rag_pipeline.py --list     # show test numbers and names
"""

import os
import sys
import time
import json
import argparse
import subprocess
from contextlib import contextmanager

import requests

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("Missing dependency: pip install psycopg2-binary --break-system-packages")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join("backend", ".env"))
    load_dotenv(".env")
except ImportError:
    pass

# ---------------------------------------------------------------------------
# CONFIG - edit these if auto-detection from .env doesn't work
# ---------------------------------------------------------------------------
API_BASE = os.environ.get("NESTQUEST_API_BASE", "http://localhost:5000/api/v1")
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set in environment variables")

SYNC_SCRIPT = os.environ.get("NESTQUEST_SYNC_SCRIPT", 
    os.path.join("utils", "sync_chroma.py") if os.path.exists(os.path.join("utils", "sync_chroma.py")) 
    else os.path.join("backend", "utils", "sync_chroma.py")
)
PYTHON_EXE = os.environ.get("NESTQUEST_PYTHON", sys.executable)

TEST_USER_EMAIL = os.environ.get("NESTQUEST_TEST_USER_EMAIL", "ragtest_user@nestquest.local")
TEST_USER_PASSWORD = os.environ.get("NESTQUEST_TEST_USER_PASSWORD")
if not TEST_USER_PASSWORD:
    raise RuntimeError("NESTQUEST_TEST_USER_PASSWORD must be set in environment variables")
TEST_USER_PHONE = os.environ.get("NESTQUEST_TEST_USER_PHONE", "9999999999")

ADMIN_EMAIL = os.environ.get("NESTQUEST_ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("NESTQUEST_ADMIN_PASSWORD")
if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    raise RuntimeError("NESTQUEST_ADMIN_EMAIL and NESTQUEST_ADMIN_PASSWORD must be set in environment variables")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PASS, FAIL, WARN, INFO = "PASS", "FAIL", "WARN", "INFO"
_results = []


def report(status, name, detail=""):
    _results.append((status, name))
    tag = {"PASS": "\033[92mPASS\033[0m", "FAIL": "\033[91mFAIL\033[0m",
           "WARN": "\033[93mWARN\033[0m", "INFO": "\033[96mINFO\033[0m"}.get(status, status)
    print(f"  [{tag}] {name}" + (f" — {detail}" if detail else ""))


def confirm(prompt):
    resp = input(f"\n{prompt} [y/N]: ").strip().lower()
    return resp == "y"


@contextmanager
def db_conn():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    try:
        yield conn
    finally:
        conn.close()


def db_query(sql, params=None, fetch=True):
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params or ())
            if fetch:
                return cur.fetchall()
            return None


def api_post(path, json_body=None, token=None, expect_json=True):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = requests.post(f"{API_BASE}{path}", json=json_body, headers=headers, timeout=30)
    return r


def get_or_create_test_user_token():
    r = api_post("/auth/login", {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
    if r.status_code == 200:
        return r.json()["data"]["access_token"]
    # not registered yet
    reg = api_post("/auth/register", {
        "name": "RAG Test User",
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "phone": TEST_USER_PHONE,
        "role": "user",
    })
    if reg.status_code != 201:
        raise RuntimeError(f"Could not register test user: {reg.status_code} {reg.text}")
    r = api_post("/auth/login", {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
    r.raise_for_status()
    return r.json()["data"]["access_token"]


def get_admin_token():
    r = api_post("/auth/login", {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        return None
    return r.json()["data"]["access_token"]


def search(query, token):
    return api_post("/search/", {"query": query}, token=token)


def pick_test_broker_id():
    rows = db_query("SELECT broker_id FROM broker LIMIT 1;")
    if not rows:
        raise RuntimeError("No broker exists in DB — can't attach dummy test properties. "
                            "Register at least one broker first.")
    return rows[0]["broker_id"]


def run_sync_script():
    result = subprocess.run(
        [PYTHON_EXE, SYNC_SCRIPT],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.returncode, result.stdout, result.stderr


def insert_dummy_property(broker_id, title, description, broker_notes=None, availability="Available"):
    rows = db_query(
        """
        INSERT INTO property (broker_id, title, description, broker_notes, property_type,
                               price, location, bedrooms, bathrooms, area_sqft, availability_status)
        VALUES (%s, %s, %s, %s, 'Apartment', 15000, 'ZZTEST Location', 2, 1, 800, %s)
        RETURNING property_id;
        """,
        (broker_id, title, description, broker_notes, availability),
    )
    return rows[0]["property_id"]


def delete_dummy_property(property_id):
    db_query("DELETE FROM property WHERE property_id = %s;", (property_id,), fetch=False)


def get_results_list(resp_json):
    if not isinstance(resp_json, dict):
        return []
    data = resp_json.get("data")
    if isinstance(data, dict):
        return data.get("results", [])
    elif isinstance(data, list):
        return data
    return []


def result_ids(resp_json):
    try:
        return {str(item.get("property_id") or item.get("id")) for item in get_results_list(resp_json)}
    except Exception:
        return set()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_1_availability_constraint(token):
    """A property that matches a query must disappear from results the moment
    it's marked unavailable, and reappear when it's marked available again."""
    print("\n== Test 1: Availability constraint ==")
    broker_id = pick_test_broker_id()
    marker = "ZZTEST_AVAILABILITY_MARKER_HOUSEBOAT"
    pid = insert_dummy_property(
        broker_id, f"{marker} property",
        f"A unique {marker} listing for testing availability filtering.",
        broker_notes="Quiet, ideal for remote workers, near tech park.",
        availability="Available",
    )
    try:
        run_sync_script()  # embed it
        time.sleep(1)

        r1 = search(marker, token)
        report(PASS if r1.status_code == 200 and str(pid) in result_ids(r1.json()) else FAIL,
               "Property appears while Available", f"status={r1.status_code}")

        db_query("UPDATE property SET availability_status = 'Rented' WHERE property_id = %s;", (pid,), fetch=False)
        r2 = search(marker, token)
        present = str(pid) in result_ids(r2.json()) if r2.status_code == 200 else None
        report(FAIL if present else PASS, "Property disappears once Rented",
               f"status={r2.status_code}, still_present={present}")

        db_query("UPDATE property SET availability_status = 'Available' WHERE property_id = %s;", (pid,), fetch=False)
        r3 = search(marker, token)
        present3 = str(pid) in result_ids(r3.json()) if r3.status_code == 200 else False
        report(PASS if present3 else FAIL, "Property reappears once Available again")
    finally:
        delete_dummy_property(pid)
        run_sync_script()  # clean orphaned vector


def test_2_zero_available_properties(token):
    """If PostgreSQL has zero Available properties, must short-circuit before
    ever touching ChromaDB, and return the specific empty-result message."""
    print("\n== Test 2: Zero available properties (early-return path) ==")
    print("  This TEMPORARILY sets every property's availability_status to 'Rented'")
    print("  and restores the original values afterward, even if the script crashes.")
    if not confirm("  Proceed with test 2?"):
        report(WARN, "Skipped by user")
        return

    original = db_query("SELECT property_id, availability_status FROM property;")
    try:
        db_query("UPDATE property SET availability_status = 'Rented';", fetch=False)
        r = search("anything at all", token)
        body = r.json() if r.status_code == 200 else {}
        ok = (r.status_code == 200 and body.get("data") == [] and
              "no properties" in (body.get("message") or "").lower())
        report(PASS if ok else FAIL, "Early-return message + empty data on zero availability",
               f"status={r.status_code}, message={body.get('message')!r}")
    finally:
        for row in original:
            db_query("UPDATE property SET availability_status = %s WHERE property_id = %s;",
                      (row["availability_status"], row["property_id"]), fetch=False)
        report(INFO, "Original availability_status values restored")


def test_3_irrelevant_query(token):
    """Nonsense query - check whether Chroma returns low-relevance junk or a clean zero."""
    print("\n== Test 3: Irrelevant / nonsense query ==")
    r = search("spaceship colony on the moon with zero gravity plumbing", token)
    if r.status_code != 200:
        report(FAIL, "Request failed", f"status={r.status_code}")
        return
    data = get_results_list(r.json())
    report(INFO, f"Returned {len(data)} result(s) for a nonsense query — inspect manually:")
    for item in data:
        print(f"        - {item.get('title')} | {item.get('location')} | ai_explanation={item.get('ai_explanation')!r}")
    if data:
        report(WARN, "Non-empty results for a nonsense query",
               "Consider adding a similarity-score cutoff if these look irrelevant")


def test_5_null_broker_notes(token):
    """A property with NULL broker_notes must embed and search without crashing,
    and without literally embedding the string 'None'."""
    print("\n== Test 5: NULL broker_notes handling ==")
    broker_id = pick_test_broker_id()
    marker = "ZZTEST_NULLNOTES_LIGHTHOUSE"
    pid = insert_dummy_property(
        broker_id, f"{marker} property",
        f"A {marker} listing with no broker notes at all.",
        broker_notes=None,
    )
    try:
        rc, out, err = run_sync_script()
        report(FAIL if rc != 0 else PASS, "sync_chroma.py runs cleanly with a NULL broker_notes row",
               f"returncode={rc}" + (f", stderr={err[:200]}" if err else ""))
        time.sleep(1)
        r = search(marker, token)
        ok = r.status_code == 200 and str(pid) in result_ids(r.json())
        report(PASS if ok else FAIL, "Property with NULL broker_notes is searchable, no 500",
               f"status={r.status_code}")
    finally:
        delete_dummy_property(pid)
        run_sync_script()


def test_6_sync_integrity(token):
    """A property inserted by bypassing the API (no embed hook fired) must NOT
    be searchable until sync_chroma.py rebuilds the collection."""
    print("\n== Test 6: ChromaDB sync integrity ==")
    broker_id = pick_test_broker_id()
    marker = "ZZTEST_SYNCGAP_WINDMILL"
    pid = insert_dummy_property(
        broker_id, f"{marker} property",
        f"A {marker} listing inserted directly into Postgres, bypassing the embed hook.",
        broker_notes="Should not be findable until sync runs.",
    )
    try:
        r1 = search(marker, token)
        found_before = r1.status_code == 200 and str(pid) in result_ids(r1.json())
        report(FAIL if found_before else PASS,
               "Not searchable before sync (proves search depends on Chroma, not just Postgres)",
               f"found={found_before}")

        rc, out, err = run_sync_script()
        report(FAIL if rc != 0 else PASS, "sync_chroma.py exits cleanly", f"returncode={rc}")
        time.sleep(1)

        r2 = search(marker, token)
        found_after = r2.status_code == 200 and str(pid) in result_ids(r2.json())
        report(PASS if found_after else FAIL, "Searchable after sync_chroma.py rebuild",
               f"found={found_after}")
    finally:
        delete_dummy_property(pid)
        run_sync_script()


def test_7_role_and_auth_boundaries(user_token):
    """/search/ allows authenticated roles; missing/garbage token should return auth errors."""
    print("\n== Test 7: Role and auth boundaries on /search/ ==")

    admin_token = get_admin_token()
    if admin_token:
        r = search("test query", admin_token)
        report(PASS if r.status_code == 200 else FAIL, "Admin token gets 200 OK (Allowed)", f"status={r.status_code}")
    else:
        report(WARN, "Could not log in as admin — check ADMIN_EMAIL/ADMIN_PASSWORD in this script")

    r_none = search("test query", None)
    report(PASS if r_none.status_code == 401 else FAIL, "No token gets 401", f"status={r_none.status_code}")

    r_garbage = search("test query", "this.is.not.a.jwt")
    report(PASS if r_garbage.status_code in (401, 422) else FAIL,
           "Garbage token gets 401/422 (not 500)", f"status={r_garbage.status_code}")


def test_8_input_validation(token):
    """Empty and whitespace-only queries should 400; very long queries shouldn't crash."""
    print("\n== Test 8: Input validation ==")

    r_empty = search("", token)
    report(PASS if r_empty.status_code == 400 else FAIL, "Empty string query -> 400", f"status={r_empty.status_code}")

    r_ws = search("     ", token)
    report(PASS if r_ws.status_code == 400 else WARN,
           "Whitespace-only query -> 400", f"status={r_ws.status_code} (400 expected; if it's 200, .strip() before validating)")

    r_long = search("quiet apartment " * 500, token)
    report(PASS if r_long.status_code in (200, 400, 413) else FAIL,
           "Very long query doesn't 500", f"status={r_long.status_code}")


def test_9_semantic_quality(token):
    """Not pass/fail — prints top results for a batch of realistic queries so
    you can eyeball relevance against your 20 seeded properties."""
    print("\n== Test 9: Semantic quality (manual eyeball) ==")
    queries = [
        "quiet 2BHK near Infopark suitable for IT professionals",
        "budget friendly place for a single working woman with good safety",
        "spacious villa with a garden for a family with kids",
        "pet friendly apartment with a lift and good ventilation",
        "place with good public transport and low noise for night shift workers",
        "furnished house near a school for a family relocating",
    ]
    for q in queries:
        r = search(q, token)
        print(f"\n  Query: {q!r}")
        if r.status_code != 200:
            print(f"    status={r.status_code} body={r.text[:200]}")
            continue
        for item in get_results_list(r.json()):
            print(f"    - {item.get('title')} | {item.get('location')} | "
                  f"{item.get('bedrooms')}BHK | {item.get('price')} | "
                  f"ai_explanation={ (item.get('ai_explanation') or '')[:90]!r}")


def test_gemini_degradation(token):
    """Run this ONLY after manually breaking GEMINI_API_KEY in .env and
    restarting `python app.py`. Every result should still come back, with
    ai_explanation: null for every single one."""
    print("\n== Gemini degradation (run only with a deliberately broken key + restarted server) ==")
    r = search("quiet apartment near a tech park", token)
    if r.status_code != 200:
        report(FAIL, "Request failed", f"status={r.status_code}")
        return
    data = get_results_list(r.json())
    if not data:
        report(WARN, "No results returned — can't verify degradation, try a broader query")
        return
    all_null = all(item.get("ai_explanation") is None for item in data)
    report(PASS if all_null else FAIL, "Every result has ai_explanation: null",
           f"{sum(1 for i in data if i.get('ai_explanation') is None)}/{len(data)} null")


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

TEST_REGISTRY = {
    1: ("Availability constraint", test_1_availability_constraint, True),
    2: ("Zero available properties", test_2_zero_available_properties, True),
    3: ("Irrelevant query", test_3_irrelevant_query, False),
    5: ("NULL broker_notes", test_5_null_broker_notes, True),
    6: ("ChromaDB sync integrity", test_6_sync_integrity, True),
    7: ("Role and auth boundaries", test_7_role_and_auth_boundaries, False),
    8: ("Input validation", test_8_input_validation, False),
    9: ("Semantic quality (manual review)", test_9_semantic_quality, False),
}
# Note: test 4 (Gemini degradation) is intentionally excluded from the
# default run — call it explicitly with --only 4 after breaking your key.
TEST_REGISTRY_EXTRA = {4: ("Gemini degradation (manual precondition)", test_gemini_degradation, False)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", type=str, help="comma-separated test numbers, e.g. 1,5,6")
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    all_tests = {**TEST_REGISTRY, **TEST_REGISTRY_EXTRA}

    if args.list:
        for n, (name, _, destructive) in sorted(all_tests.items()):
            print(f"  {n}: {name}" + ("  [mutates DB, auto-restored]" if destructive else ""))
        return

    print(f"API_BASE      = {API_BASE}")
    print(f"DATABASE_URL  = {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    print(f"SYNC_SCRIPT   = {SYNC_SCRIPT}")

    try:
        db_query("SELECT 1;")
    except Exception as e:
        print(f"\nCould not connect to Postgres with DATABASE_URL above: {e}")
        print("Edit DATABASE_URL in this script or set it as an env var.")
        sys.exit(1)

    try:
        token = get_or_create_test_user_token()
    except Exception as e:
        print(f"\nCould not get a user token from {API_BASE}: {e}")
        print("Is the Flask server running on the expected host/port?")
        sys.exit(1)

    if args.only:
        selected = [int(x) for x in args.only.split(",")]
    else:
        selected = list(TEST_REGISTRY.keys())  # test 4 excluded by default

    for n in selected:
        if n not in all_tests:
            print(f"Unknown test number: {n}")
            continue
        name, fn = all_tests[n][0], all_tests[n][1]
        try:
            fn(token)
        except Exception as e:
            report(FAIL, f"Test {n} ({name}) raised an exception", str(e))

    print("\n" + "=" * 60)
    passed = sum(1 for s, _ in _results if s == PASS)
    failed = sum(1 for s, _ in _results if s == FAIL)
    warned = sum(1 for s, _ in _results if s == WARN)
    print(f"RESULTS: {passed} passed, {failed} failed, {warned} warnings")
    print("=" * 60)


if __name__ == "__main__":
    main()
