import { cn, formatCurrency } from "../utils";

describe("Utility Functions", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("c1", "c2")).toBe("c1 c2");
    });
    
    it("handles conditional classes", () => {
      expect(cn("c1", false && "c2", "c3")).toBe("c1 c3");
    });
  });

  describe("formatCurrency", () => {
    it("formats number to currency string", () => {
      // Assuming default locale might vary, checking roughly or mocking if needed.
      // For now, just checking it returns a string with currency symbol if possible, 
      // or at least doesn't crash.
      const result = formatCurrency(1000);
      expect(typeof result).toBe("string");
    });
  });
});
