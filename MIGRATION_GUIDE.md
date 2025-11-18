# React Query Migration Guide

## Overview

This guide explains how to migrate from the global DataContext pattern to React Query for better scalability and performance.

## Why Migrate?

### Problems with Current Approach
1. **Loads entire database on app start** - Every user downloads all customers, transactions, suppliers, and fabrics
2. **Slow performance** - As data grows, initial load time increases dramatically
3. **High Firebase costs** - Unnecessary data transfer
4. **Memory issues** - Large datasets can cause browser slowdowns

### Benefits of React Query
1. **On-demand data fetching** - Only fetch what you need, when you need it
2. **Automatic caching** - Reduces redundant API calls
3. **Pagination support** - Load data in chunks
4. **Optimistic updates** - Better UX with instant feedback
5. **Background refetching** - Keep data fresh automatically
6. **Built-in loading/error states** - Simpler state management

## Architecture Changes

### Before (Global Context)
```javascript
// Loads ALL data at app root
<DataProvider>
  <App />
</DataProvider>

// Every page uses the same global data
const { customers, transactions } = useData();
```

### After (React Query)
```javascript
// Only provides query client
<QueryProvider>
  <App />
</QueryProvider>

// Each page fetches only what it needs
const { data: customers } = useCustomers({ page: 1, limit: 20 });
```

## Migration Steps

### Step 1: Setup (Already Done)
- ✅ Installed `@tanstack/react-query`
- ✅ Created `QueryProvider` wrapper
- ✅ Created Firebase service layer
- ✅ Created custom hooks for each data type

### Step 2: Update Your Pages

#### Old Pattern (data-context.js)
```javascript
import { useData } from "@/app/data-context";

function CustomerPage() {
  const { customers, addCustomer, updateCustomer } = useData();
  
  // customers contains ALL customers from database
  return <div>{customers.map(...)}</div>;
}
```

#### New Pattern (React Query)
```javascript
import { useCustomers, useAddCustomer, useUpdateCustomer } from "@/hooks/useCustomers";

function CustomerPage() {
  const [page, setPage] = useState(1);
  
  // Only fetches 20 customers at a time
  const { data, isLoading } = useCustomers({ page, limit: 20 });
  const addMutation = useAddCustomer();
  const updateMutation = useUpdateCustomer();
  
  const handleAdd = async (customerData) => {
    await addMutation.mutateAsync(customerData);
  };
  
  return (
    <div>
      {isLoading ? <Spinner /> : data.data.map(...)}
      <Pagination 
        currentPage={page} 
        totalPages={data.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Step 3: Available Hooks

#### Customers
```javascript
import {
  useCustomers,        // Fetch paginated customers
  useCustomer,         // Fetch single customer
  useAddCustomer,      // Add customer mutation
  useUpdateCustomer,   // Update customer mutation
  useDeleteCustomer,   // Delete customer mutation
} from "@/hooks/useCustomers";

// Usage
const { data, isLoading, error } = useCustomers({
  page: 1,
  limit: 20,
  searchTerm: "john",
  filter: "due"
});

const addMutation = useAddCustomer();
await addMutation.mutateAsync(customerData);
```

#### Transactions
```javascript
import {
  useTransactions,           // Fetch paginated transactions
  useCustomerTransactions,   // Fetch transactions for specific customer
  useCustomerDue,            // Calculate customer due amount
  useAddTransaction,         // Add transaction mutation
  useUpdateTransaction,      // Update transaction mutation
  useDeleteTransaction,      // Delete transaction mutation
} from "@/hooks/useTransactions";

// Usage
const { data } = useTransactions({ page: 1, limit: 20 });
const { due } = useCustomerDue(customerId);
```

#### Suppliers
```javascript
import {
  useSuppliers,
  useAddSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/useSuppliers";
```

#### Fabrics
```javascript
import {
  useFabrics,
  useAddFabric,
  useUpdateFabric,
  useDeleteFabric,
} from "@/hooks/useFabrics";
```

### Step 4: Pagination Pattern

```javascript
function MyPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data, isLoading } = useCustomers({
    page: currentPage,
    limit: 20,
    searchTerm,
  });
  
  return (
    <div>
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table data={data.data} />
          <Pagination
            currentPage={currentPage}
            totalPages={data.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
```

### Step 5: Mutations Pattern

```javascript
function AddCustomerForm() {
  const addMutation = useAddCustomer();
  
  const handleSubmit = async (formData) => {
    try {
      await addMutation.mutateAsync(formData);
      // Success toast is shown automatically
      // Customer list is automatically refetched
    } catch (error) {
      // Error toast is shown automatically
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button disabled={addMutation.isPending}>
        {addMutation.isPending ? "Adding..." : "Add Customer"}
      </button>
    </form>
  );
}
```

## Migration Checklist

### Pages to Migrate
- [ ] `/customers` - Customer list page
- [ ] `/customers/[id]` - Customer detail page
- [ ] `/transactions` - Transactions page
- [ ] `/suppliers` - Suppliers page
- [ ] `/inventory` - Inventory/Fabrics page
- [ ] `/cashbook` - Daily cash page
- [ ] `/dashboard` - Dashboard (summary stats)

### For Each Page
1. [ ] Replace `useData()` with specific hooks
2. [ ] Add pagination state
3. [ ] Update loading states to use `isLoading`
4. [ ] Update mutations to use mutation hooks
5. [ ] Remove manual error handling (hooks handle it)
6. [ ] Test pagination
7. [ ] Test search/filters
8. [ ] Test CRUD operations

## Common Patterns

### Loading States
```javascript
const { data, isLoading, error } = useCustomers();

if (isLoading) return <Spinner />;
if (error) return <Error message={error.message} />;
return <Table data={data.data} />;
```

### Search with Debouncing
```javascript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

const { data } = useCustomers({
  searchTerm: debouncedSearch,
  page: 1,
});
```

### Optimistic Updates
```javascript
const updateMutation = useUpdateCustomer();

// The mutation automatically invalidates and refetches
// You can also do optimistic updates:
updateMutation.mutate(
  { customerId, updatedData },
  {
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['customers']);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['customers']);
      
      // Optimistically update
      queryClient.setQueryData(['customers'], (old) => ({
        ...old,
        data: old.data.map(c => 
          c.id === customerId ? { ...c, ...newData } : c
        ),
      }));
      
      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['customers'], context.previous);
    },
  }
);
```

## Performance Tips

1. **Use pagination everywhere** - Never fetch all records
2. **Set appropriate staleTime** - Reduce unnecessary refetches
3. **Use keepPreviousData** - Smooth pagination transitions
4. **Prefetch next page** - Better UX
5. **Use React Query DevTools** - Debug cache and queries

## Testing

```javascript
// Test with React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

render(<CustomerPage />, { wrapper });
```

## Troubleshooting

### Data not updating after mutation
- Check that mutation is invalidating correct query keys
- Use React Query DevTools to inspect cache

### Infinite loading
- Check that query is enabled: `enabled: !!someValue`
- Check Firebase rules and permissions

### Stale data
- Adjust `staleTime` in query options
- Use `refetchOnMount` or `refetchOnWindowFocus`

## Next Steps

1. Start with the customers page (example provided in `page-new.js`)
2. Migrate one page at a time
3. Test thoroughly before moving to next page
4. Once all pages migrated, remove old DataContext global subsc