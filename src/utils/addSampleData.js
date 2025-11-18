import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";

export const addSampleData = async () => {
  try {
    // Sample customers
    const customers = {
      1: {
        name: "John Doe",
        phone: "1234567890",
        address: "123 Main St",
        storeId: "STORE1",
        createdAt: new Date().toISOString(),
      },
      2: {
        name: "Jane Smith",
        phone: "9876543210",
        address: "456 Oak Ave",
        storeId: "STORE2",
        createdAt: new Date().toISOString(),
      },
    };

    // Sample transactions
    const transactions = {
      1: {
        customerId: "1",
        date: new Date().toISOString(),
        memoNumber: "2024/001",
        details: "Initial purchase",
        total: 1500,
        deposit: 500,
        due: 1000,
        storeId: "STORE1",
      },
    };

    // Add data to Firebase
    await set(ref(db, "customers"), customers);
    await set(ref(db, "transactions"), transactions);

    logger.info("Sample data added successfully", "SampleData");
  } catch (error) {
    logger.error(`Error adding sample data: ${error.message}`, "SampleData");
  }
};
