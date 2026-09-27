import { describe, expect, it } from "vitest";
import { sceneFor } from "./routes";

describe("sceneFor", () => {
  it("mounts the 3D scene on the home page only", () => {
    expect(sceneFor("/")).toBe("home");
  });

  it("mounts the ambient dots on About, Services and Contact", () => {
    expect(sceneFor("/about")).toBe("ambient");
    expect(sceneFor("/services")).toBe("ambient");
    expect(sceneFor("/contact")).toBe("ambient");
  });

  it("mounts nothing anywhere else", () => {
    expect(sceneFor("/not-a-page")).toBe("none");
    expect(sceneFor("/about/team")).toBe("none");
  });
});
