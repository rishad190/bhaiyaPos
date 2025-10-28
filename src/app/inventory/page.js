
"use client";
import { useState } from "react";
import { useInventoryData } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const { fabrics, addFabric, updateFabric } = useInventoryData();
  const [newFabric, setNewFabric] = useState({ name: "", category: "", colors: [{ color: "", quantity: "" }] });

  const handleAddFabric = () => {
    addFabric(newFabric);
    setNewFabric({ name: "", category: "", colors: [{ color: "", quantity: "" }] });
  };

  const handleAddColor = () => {
    setNewFabric({ ...newFabric, colors: [...newFabric.colors, { color: "", quantity: "" }] });
  };

  const handleColorChange = (index, field, value) => {
    const newColors = [...newFabric.colors];
    newColors[index][field] = value;
    setNewFabric({ ...newFabric, colors: newColors });
  };

  const handleRemoveColor = (index) => {
    const newColors = [...newFabric.colors];
    newColors.splice(index, 1);
    setNewFabric({ ...newFabric, colors: newColors });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add New Fabric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Fabric Name"
              value={newFabric.name}
              onChange={(e) => setNewFabric({ ...newFabric, name: e.target.value })}
            />
            <Input
              placeholder="Category"
              value={newFabric.category}
              onChange={(e) => setNewFabric({ ...newFabric, category: e.target.value })}
            />
            {newFabric.colors.map((color, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Color"
                  value={color.color}
                  onChange={(e) => handleColorChange(index, "color", e.target.value)}
                />
                <Input
                  placeholder="Quantity"
                  type="number"
                  value={color.quantity}
                  onChange={(e) => handleColorChange(index, "quantity", e.target.value)}
                />
                <Button variant="destructive" size="icon" onClick={() => handleRemoveColor(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button onClick={handleAddColor}>
              <Plus className="mr-2 h-4 w-4" /> Add Color
            </Button>
            <Button onClick={handleAddFabric}>Add Fabric</Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Existing Fabrics</h2>
        <div className="space-y-4">
          {fabrics.map((fabric) => (
            <Card key={fabric.id}>
              <CardHeader>
                <CardTitle>{fabric.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Category: {fabric.category}</p>
                <ul>
                  {fabric.colors.map((color, index) => (
                    <li key={index}>
                      {color.color}: {color.quantity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
