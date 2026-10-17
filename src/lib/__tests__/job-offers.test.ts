import { describe, expect, it } from "vitest";
import { parseOffer, parseReply } from "../job-offers";

describe("parseOffer", () => {
  it("needs a real message and makes the job optional", () => {
    expect(parseOffer({ message: "  Salam, bizdə elektrik işi var.  ", jobId: "" })).toEqual({
      success: true,
      data: { message: "Salam, bizdə elektrik işi var.", jobId: null },
    });
    expect(parseOffer({ message: "Salam, iş var", jobId: "job1" })).toMatchObject({ success: true, data: { jobId: "job1" } });
    expect(parseOffer({ message: "   salam   " })).toEqual({ success: false, errors: { message: "messageShort" } });
    expect(parseOffer({ message: "x".repeat(1001) })).toEqual({ success: false, errors: { message: "messageLong" } });
  });
});

describe("parseReply", () => {
  it("accepts only accept/decline and an optional short answer", () => {
    expect(parseReply({ decision: "ACCEPTED", reply: "" })).toEqual({ success: true, data: { status: "ACCEPTED", reply: null } });
    expect(parseReply({ decision: "DECLINED", reply: " Təşəkkürlər " })).toEqual({ success: true, data: { status: "DECLINED", reply: "Təşəkkürlər" } });
    expect(parseReply({ decision: "PENDING" })).toEqual({ success: false, errors: { decision: "decisionRequired" } });
    expect(parseReply({ decision: "ACCEPTED", reply: "x".repeat(1001) })).toEqual({ success: false, errors: { reply: "replyLong" } });
  });
});
