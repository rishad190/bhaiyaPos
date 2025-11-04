/**
 * @typedef {Object} FabricItem
 * @property {string} colorName
 * @property {number} quantity
 */

/**
 * @typedef {Object} FabricBatch
 * @property {string} id
 * @property {string} containerNo
 * @property {string} purchaseDate
 * @property {number} costPerPiece
 * @property {FabricItem[]} items
 */

/**
 * @typedef {Object} Fabric
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string} category
 * @property {string} unit
 * @property {string} description
 * @property {number} lowStockThreshold
 * @property {FabricBatch[]} batches
 */

/** @type {Fabric[]} */
export const mockFabrics = [
  {
    id: "fab001",
    name: "Jimmy Chu",
    code: "JC-01",
    category: "Designer",
    unit: "piece",
    description: "A popular, high-quality fabric.",
    lowStockThreshold: 20,
    batches: [
      {
        id: "b01",
        containerNo: "C-001",
        purchaseDate: "2023-10-15",
        costPerPiece: 850,
        items: [
          { colorName: "Red", quantity: 100 },
          { colorName: "Blue", quantity: 100 },
          { colorName: "Green", quantity: 100 },
          { colorName: "Black", quantity: 100 },
          { colorName: "White", quantity: 100 },
          { colorName: "Yellow", quantity: 100 },
          { colorName: "Purple", quantity: 100 },
          { colorName: "Orange", quantity: 100 },
        ],
      },
      {
        id: "b02",
        containerNo: "C-002",
        purchaseDate: "2023-11-20",
        costPerPiece: 860,
        items: [
          { colorName: "Red", quantity: 50 },
          { colorName: "Blue", quantity: 50 },
          { colorName: "Gold", quantity: 150 },
          { colorName: "Silver", quantity: 150 },
        ],
      },
    ],
  },
  {
    id: "fab002",
    name: "Weightless Georgette",
    code: "WG-05",
    category: "Georgette",
    unit: "piece",
    description: "Light and airy georgette fabric.",
    lowStockThreshold: 20,
    batches: [
      {
        id: "b03",
        containerNo: "C-003",
        purchaseDate: "2023-09-01",
        costPerPiece: 450,
        items: [
          { colorName: "Pink", quantity: 80 },
          { colorName: "Sky Blue", quantity: 40 },
        ],
      },
    ],
  },
  {
    id: "fab003",
    name: "Velvet",
    code: "V-12",
    category: "Velvet",
    unit: "piece",
    description: "Plush and luxurious velvet.",
    lowStockThreshold: 10,
    batches: [
      {
        id: "b04",
        containerNo: "C-004",
        purchaseDate: "2023-12-05",
        costPerPiece: 1200,
        items: [
          { colorName: "Royal Blue", quantity: 50 },
          { colorName: "Maroon", quantity: 75 },
        ],
      },
    ],
  },
];
