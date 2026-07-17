import { describe, expect, it } from "vitest";
import {
  memberEmail,
  normalizeUsername,
  validatePin,
  validateUsername,
  usernameFromEmail,
} from "./member-auth";

describe("member auth helpers", () => {
  it("normalizes usernames", () => {
    expect(normalizeUsername(" Iwan ")).toBe("iwan");
  });

  it("maps username to internal member email", () => {
    expect(memberEmail("iwan")).toBe("iwan@hartayu.internal");
  });

  it("validates usernames", () => {
    expect(validateUsername("iwan")).toBeNull();
    expect(validateUsername("a")).toMatch(/2–20/);
  });

  it("validates six-digit pins", () => {
    expect(validatePin("123456")).toBeNull();
    expect(validatePin("12345")).toMatch(/6 digits/);
  });

  it("extracts username from member email", () => {
    expect(usernameFromEmail("iwan@hartayu.internal")).toBe("iwan");
    expect(usernameFromEmail("iwan@gmail.com")).toBeNull();
  });
});
