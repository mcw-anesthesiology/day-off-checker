from pymongo import MongoClient
from bson import decode
from bson.json_util import dumps, loads
import csv, sys, os


def main():
    client = MongoClient(os.getenv("MONGO_URL"))
    db = client["day-off-checker"]
    dor = db["dayOffRequests"]
    approved = dor.find({"dayOffType": "iDay"})

    residents = {}
    for request in approved:
        email = request["requestorEmail"].lower()
        if email not in residents:
            residents[email] = []

        residents[email].append(request)

    writer = csv.writer(sys.stdout)
    writer.writerow(
        [
            "Email",
            "Name",
            "Request start",
            "Request end",
            "Request reason",
            "Status",
            "Denial reasons",
        ]
    )

    l = sorted(list(residents.items()), key=lambda p: p[0])
    for email, requests in l:
        for request in requests:
            denial_reasons = []
            if request["status"] == "denied":
                print(request, file=sys.stderr)
                denial_reasons = [
                    r["reason"]
                    for r in request["confirmationRequests"]
                    if r["status"] == "denied"
                ]

            writer.writerow(
                [
                    email,
                    request["requestorName"],
                    request["requestedDate"][0],
                    request["requestedDate"][1],
                    request["requestReason"],
                    request["status"],
                    "\n\n".join(denial_reasons),
                ]
            )


if __name__ == "__main__":
    main()
