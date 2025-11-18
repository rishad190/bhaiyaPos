# React Query Quick Reference

## Quick Start

All pages now use React Query for data fetching. Here's how to use it:

## Basic Pattern

```javascript
// 1. Import the hook
import { useCustomers } from '@/hooks/useCustomers';

// 2. Use in component
const { data, isLoading, error } = useCustomers({ page: 1, limit: 20 });

// 3. Access data
const customers = data?.data || [];
```

## Available Hooks

### Customers
```javascript
import {
  useCustomers,              // Fetch paginated customers
  useCustomer,               // Fetch single customer
  useAddCustomer,            // Add customer
  useUpdateCustomer,         // Update customer
  useDeleteCustomer,         // Delete customer
  useCustomersWithDues,      // Customers with calculated dues
} from '@/hooks/useCustomers';
```

### Transactions
```javascript
import {
  useTransactions,           // Fetch paginated transactions
  useCustomerTransactions,   // Fetch customer's transactions
  useCustomerDue,            // Calculate customer due
  useAddTransaction,         // Add transaction
  useUpdateTransaction,      // Update transaction
  useDeleteTransaction,      // Delete transaction
} from '@/hooks/useTransactions';
```

### Suppliers
```javascript
import {
  useSuppliers,              // Fetch paginated suppliers
  useAddSupplier,            // Add supplier
  useUpdateSupplier,         // Update supplier
  useDeleteSupplier,         // Delete supplier
  useSuppliersWithTransactions, // Suppliers with totals
} from '@/hooks/useSuppliers';
```

### Fabrics
```javascript
import {
  useFabrics,                // Fetch paginated fabrics
  useAddFabric,              // Add fabric
  useUpdateFabric,           // Update fabric
  useDeleteFabric,           // Delete fabric
} from '@/hooks/useFabrics';
```

### Daily Cash
```javascript
import {
  useDailyCashTransactions,  // Fetch paginated transactions
  useAllDailyCashTransactions, // Fetch all transactions
  useAddDailyCashTransaction,  // Add transaction
  useUpdateDailyCashTransaction, // Update transaction
  useDeleteDailyCashTransaction, // Delete transaction
} from '@/hooks/useDailyCash';
```

## Common Patterns

### Fetching Data
```javascript
const { data, isLoading, error } = useCustomers({
  page: 1,
  limit: 20,
  searchTerm: 'john',
  filter: 'due'
});

if (isLoading) return <Spinner />;
if (error) return <Error message={error.message} />;

const customers = data.data;
const totalPages = data.totalPages;
```

### Adding Data
```javascript
const addMutation = useAddCustomer();

const handleAdd = async (customerData) => {
  try {
    await addMutation.mutateAsync(customerData);
    // Success toast shown automatically
    // List refetched automatically
  } catch (error) {
    // Error toast shown automatically
  }
};

// Check if mutation is pending
<Button disabled={addMutation.isPending}>
  {addMutation.isPending ? 'Adding...' : 'Add Customer'}
</Button>
```

### Updating Data
```javascript
const updateMutation = useUpdateCustomer();

const handleUpdate = async (customerId, updatedData) => {
  try {
    await updateMutation.mutateAsync({ customerId, updatedData });
  } catch (error) {
    console.error(error);
  }
};
```

### Deleting Data
```javascript
const deleteMutation = useDeleteCustomer();

const handleDelete = async (customerId) => {
  if (window.confirm('Are you sure?')) {
    try {
      await deleteMutation.mutateAsync(customerId);
    } catch (error) {
      console.error(error);
    }
  }
};
```

### Pagination
```javascript
const [currentPage, setCurrentPage] = useState(1);

const { data } = useCustomers({
  page: currentPage,
  limit: 20,
});

<Pagination
  currentPage={currentPage}
  totalPages={data?.totalPages || 0}
  onPageChange={setCurrentPage}
/>
```

### Search
```javascript
const [searchTerm, setSearchTerm] = useState('');

const { data } = useCustomers({
  page: 1,
  limit: 20,
  searchTerm, // Automatically filters on server
});

<Input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search..."
/>
```

## Hook Return Values

### Query Hooks
```javascript
{
  data,           // The fetched data
  isLoading,      // True while loading
  error,          // Error object if failed
  refetch,        // Function to manually refetch
  isFetching,     // True while fetching (including background)
}
```

### Mutation Hooks
```javascript
{
  mutate,         // Function to trigger mutation
  mutateAsync,    // Async version (returns promise)
  isPending,      // True while mutation in progress
  isSuccess,      // True if mutation succeeded
  isError,        // True if mutation failed
  error,          // Error object if failed
}
```

## Tips

### 1. Use `mutateAsync` for async/await
```javascript
// Good
await addMutation.mutateAsync(data);

// Also works
addMutation.mutate(data);
```

### 2. Check loading states
```javascript
if (isLoading) return <Spinner />;
if (error) return <Error />;
return <DataTable data={data.data} />;
```

### 3. Disable buttons during mutations
```javascript
<Button disabled={mutation.isPending}>
  {mutation.isPending ? 'Saving...' : 'Save'}
</Button>
```

### 4. Use optional chaining for data
```javascript
const customers = data?.data || [];
const total = data?.total || 0;
```

### 5. Combine multiple queries
```javascript
const { data: customers } = useCustomers();
const { data: transactions } = useTransactions();

// Both load in parallel
```

## React Query DevTools

Press the React Query icon (bottom-left) to open DevTools:
- View all queries and their states
- Inspect cached data
- Manually refetch queries
- Clear cache
- Debug performance

## Common Issues

### Data not updating after mutation
✅ Mutations automatically invalidate queries
✅ Check React Query DevTools to verify

### Slow performance
✅ Reduce page size (limit parameter)
✅ Increase staleTime in queryClient config
✅ Check for redundant queries in DevTools

### Stale data
✅ Adjust staleTime (default: 5 minutes)
✅ Use refetch() to manually refresh
✅ Enable refetchOnWindowFocus if needed

## Configuration

Edit `src/lib/queryClient.js` to change defaults:

```javascript
{
  staleTime: 1000 * 60 * 5,  // 5 minutes
  gcTime: 1000 * 60 * 10,    // 10 minutes
  retry: 1,                   // Retry once on failure
  refetchOnWindowFocus: false,
}
```

## Examples

### Complete Page Example
```javascript
'use client';
import { useState } from 'react';
import { useCustomers, useAddCustomer } from '@/hooks/useCustomers';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useCustomers({ page, limit: 20, searchTerm });
  const addMutation = useAddCustomer();
  
  const handleAdd = async (customerData) => {
    await addMutation.mutateAsync(customerData);
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <table>
        {data.data.map(customer => (
          <tr key={customer.id}>
            <td>{customer.name}</td>
          </tr>
        ))}
      </table>
      
      <button onClick={() => setPage(p => p - 1)}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

---

**Quick Reference Version**: 1.0
**Last Updated**: November 18, 2025
