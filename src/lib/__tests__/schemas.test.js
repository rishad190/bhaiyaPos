import { transactionSchema, supplierSchema, customerSchema } from "../schemas";

describe("Validation Schemas", () => {
  describe("transactionSchema", () => {
    it("validates a correct transaction", () => {
      const validData = {
        date: "2023-01-01",
        total: 100,
        deposit: 50,
        storeId: "store1",
      };
      const result = transactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("fails when total is missing", () => {
      const invalidData = {
        date: "2023-01-01",
        deposit: 50,
      };
      const result = transactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
