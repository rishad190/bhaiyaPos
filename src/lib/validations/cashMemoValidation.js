/**
 * Cash Memo Validation Functions
 * Centralized validation logic for cash memo operations
 */

/**
 * Validate customer data
 * @param {Object} customer - Customer data
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateCustomer(customer) {
  const errors = [];

  if (!customer.customerName || customer.customerName.trim() === "") {
    errors.push("Customer name is required");
  }

  if (!customer.customerPhone || customer.customerPhone.trim() === "") {
    errors.push("Customer phone is required");
  }

  // Validate phone format (basic validation)
  if (customer.customerPhone && !/^\d{10,15}$/.test(customer.customerPhone.replace(/[-\s]/g, ""))) {
    errors.push("Invalid phone number format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate product data
 * @param {Object} product - Product data
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateProduct(product) {
  const errors = [];

  if (!product.name || product.name.trim() === "") {
    errors.push("Product name is required");
  }

  if (!product.fabricId) {
    errors.push("Product must be selected from inventory");
  }

  if (!product.quantity || Number(product.quantity) <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (!product.price || Number(product.price) <= 0) {
    errors.push("Price must be greater than 0");
  }

  // Validate quantity is a number
  if (product.quantity && isNaN(Number(product.quantity))) {
    errors.push("Quantity must be a valid number");
  }

  // Validate price is a number
  if (product.price && isNaN(Number(product.price))) {
    errors.push("Price must be a valid number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete memo data
 * @param {Object} memoData - Memo data
 * @param {Array} products - Products array
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateMemo(memoData, products) {
  const errors = [];

  // Validate customer
  const customerValidation = validateCustomer(memoData);
  if (!customerValidation.valid) {
    errors.push(...customerValidation.errors);
  }

  // Validate products
  if (!products || products.length === 0) {
    errors.push("At least one product is required");
  } else {
    products.forEach((product, index) => {
      const productValidation = validateProduct(product);
      if (!productValidation.valid) {
        errors.push(`Product ${index + 1}: ${productValidation.errors.join(", ")}`);
      }
    });
  }

  // Validate date
  if (!memoData.date) {
    errors.push("Date is required");
  }

  // Validate memo number
  if (!memoData.memoNumber || memoData.memoNumber.trim() === "") {
    errors.push("Memo number is required");
  }

  // Validate deposit
  if (memoData.deposit && isNaN(Number(memoData.deposit))) {
    errors.push("Deposit must be a valid number");
  }

  if (memoData.deposit && Number(memoData.deposit) < 0) {
    errors.push("Deposit cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate deposit amount against total
 * @param {number} deposit - Deposit amount
 * @param {number} total - Total amount
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateDeposit(deposit, total) {
  const errors = [];

  const depositNum = Number(deposit) || 0;
  const totalNum = Number(total) || 0;

  if (depositNum < 0) {
    errors.push("Deposit cannot be negative");
  }

  if (depositNum > totalNum) {
    errors.push("Deposit cannot exceed total amount");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate inventory availability
 * @param {Object} product - Product to check
 * @param {Object} fabric - Fabric data from inventory
 * @returns {Object} - { valid: boolean, errors: string[], availableQuantity: number }
 */
export function validateInventoryAvailability(product, fabric) {
  const errors = [];
  let availableQuantity = 0;

  if (!fabric) {
    errors.push("Product not found in inventory");
    return { valid: false, errors, availableQuantity };
  }

  // Calculate available quantity from batches
  if (fabric.batches && Array.isArray(fabric.batches)) {
    fabric.batches.forEach((batch) => {
      if (batch.items && Array.isArray(batch.items)) {
        batch.items.forEach((item) => {
          // If color is specified, match it; otherwise count all
          if (!product.color || item.colorName === product.color) {
            availableQuantity += Number(item.quantity) || 0;
          }
        });
      }
    });
  }

  const requestedQuantity = Number(product.quantity) || 0;

  if (requestedQuantity > availableQuantity) {
    errors.push(
      `Insufficient stock. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    availableQuantity,
  };
}
