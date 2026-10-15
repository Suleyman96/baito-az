import { describe, expect, it } from "vitest";
import { reviewProblem, reviewSchema, reviewTargets, summarizeRatings } from "../reviews";

const job = { status: "COMPLETED", ownerId: "employer", hiredWorkerIds: ["worker1", "worker2"] };

describe("reviewProblem", () => {
  it("allows both directions between the employer and a hired worker", () => {
    expect(reviewProblem(job, "employer", "worker1")).toBeNull();
    expect(reviewProblem(job, "worker2", "employer")).toBeNull();
  });

  it("requires the job to be completed", () => {
    expect(reviewProblem({ ...job, status: "ACTIVE" }, "employer", "worker1")).toBe("notCompleted");
    expect(reviewProblem({ ...job, status: "CLOSED" }, "worker1", "employer")).toBe("notCompleted");
  });

  it("refuses outsiders, worker-to-worker reviews and self-reviews", () => {
    expect(reviewProblem(job, "stranger", "employer")).toBe("notParticipant");
    expect(reviewProblem(job, "employer", "stranger")).toBe("notParticipant");
    expect(reviewProblem(job, "worker1", "worker2")).toBe("notParticipant");
    expect(reviewProblem(job, "otherEmployer", "worker1")).toBe("notParticipant");
    expect(reviewProblem(job, "employer", "employer")).toBe("selfReview");
  });
});

describe("reviewTargets", () => {
  it("lists every hired worker for the employer and the employer for a worker", () => {
    expect(reviewTargets(job, "employer")).toEqual(["worker1", "worker2"]);
    expect(reviewTargets(job, "worker1")).toEqual(["employer"]);
    expect(reviewTargets(job, "stranger")).toEqual([]);
    expect(reviewTargets({ ...job, status: "ACTIVE" }, "employer")).toEqual([]);
  });
});

describe("reviewSchema", () => {
  it("accepts whole stars 1–5 and a written comment", () => {
    expect(reviewSchema.parse({ rating: "5", comment: "  Çox yaxşı işçi  " })).toEqual({ rating: 5, comment: "Çox yaxşı işçi" });
  });

  it("rejects other ratings and empty or overlong comments", () => {
    const errors = (input: object) => {
      const r = reviewSchema.safeParse(input);
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };
    for (const rating of ["0", "6", "4.5", "abc", ""]) expect(errors({ rating, comment: "Yaxşı iş" })).toEqual(["ratingInvalid"]);
    expect(errors({ rating: "4", comment: "  ok " })).toEqual(["commentShort"]);
    expect(errors({ rating: "4", comment: "x".repeat(1001) })).toEqual(["commentLong"]);
  });
});

describe("summarizeRatings", () => {
  it("averages to one decimal and counts", () => {
    expect(summarizeRatings([5, 4, 5])).toEqual({ average: 4.7, count: 3 });
    expect(summarizeRatings([3])).toEqual({ average: 3, count: 1 });
    expect(summarizeRatings([])).toEqual({ average: null, count: 0 });
  });
});
