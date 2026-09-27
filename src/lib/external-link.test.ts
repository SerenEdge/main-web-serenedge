import { describe, expect, it } from "vitest";
import { externalLinkProps } from "./external-link";

describe("externalLinkProps", () => {
  it("opens http(s) links in a new tab, safely", () => {
    expect(externalLinkProps("https://platform.serenedge.com")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
    expect(externalLinkProps("http://example.com")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  it("leaves internal paths in the same tab", () => {
    expect(externalLinkProps("/contact")).toEqual({});
    expect(externalLinkProps("#section")).toEqual({});
  });

  it("leaves mailto and tel links alone (they don't navigate a tab)", () => {
    expect(externalLinkProps("mailto:sales@serenedge.com")).toEqual({});
    expect(externalLinkProps("tel:+94704888440")).toEqual({});
  });
});
