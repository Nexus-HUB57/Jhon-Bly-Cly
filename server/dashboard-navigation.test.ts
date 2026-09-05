import { describe, expect, it } from "vitest";
import { dashboardMenuItems } from "../client/src/components/DashboardLayout";

describe("DashboardLayout navigation", () => {
  it("uses a unique stable id for every sidebar item", () => {
    const ids = dashboardMenuItems.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["projects", "production", "orchestration", "references", "fusion"]);
  });
});
