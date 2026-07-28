# Mastery and review

Cangjie and Quick character mastery are separate. Each method tracks attempts, first-try success, correct/incorrect totals, hints, last code, streak, heuristic mastery score and review timestamps.

Root records track exposure, correctness, streak, score, last/next review and response-time EMA.

The documented product heuristic adds points for correct and first-try answers, reduces gains after hints and subtracts for errors. It is not psychometrically validated.

Successful review intervals are 10 minutes, 1 day, 3 days, 7 days, 14 days and 30 days. Errors schedule an earlier retry; wrong-order errors receive a less severe interval than unrelated wrong keys. Time is injectable in tests.

Local retention is bounded to 100 sessions and 500 attempt events.
