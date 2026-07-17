import { describe, expect, it } from "vitest";
import { formatYen } from "@/lib/format-yen";

describe("formatYen", () => {
  it("formats positive and negative JPY", () => {
    expect(formatYen(1200)).toBe("¥1,200");
    expect(formatYen(-500)).toBe("−¥500");
  });
});
