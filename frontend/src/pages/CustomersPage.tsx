import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchCustomers, useCreateCustomer } from '../hooks/useQueries';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().min(9, 'Valid phone number required'),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  customerType: z.enum(['individual', 'corporate']),
  landmarkAddress: z.string().optional(),
  physicalAddress: z.string().optional(),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

function CreateCustomerModal({ onClose }: { onClose: () => void }) {
  const createCustomer = useCreateCustomer();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { customerType: 'individual' }
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      await createCustomer.mutateAsync(data as Record<string, unknown>);
      onClose();
    } catch (err: any) {
      alert('Error creating customer: ' + (err.response?.data?.error || String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">New Customer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">First Name *</label>
              <input
                {...register('firstName')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Last Name</label>
              <input
                {...register('lastName')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone *</label>
              <input
                {...register('phone')}
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
              <input
                {...register('whatsapp')}
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Customer Type</label>
            <select
              {...register('customerType')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Landmark / Delivery Address</label>
            <input
              {...register('landmarkAddress')}
              placeholder="e.g. Near OK Zimbabwe, Avondale"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Physical Address</label>
            <input
              {...register('physicalAddress')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCustomer.isPending}
              className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {createCustomer.isPending ? 'Saving...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: customers, isLoading } = useSearchCustomers(searchQuery);

  return (
    <div className="space-y-6">
      {showCreate && <CreateCustomerModal onClose={() => setShowCreate(false)} />}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
            <p className="mt-1 text-sm text-slate-600">Search and manage customer records</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New Customer
          </button>
        </div>

        <div className="mt-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone (min 3 characters)..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <p className="text-center text-sm text-slate-400">Type at least 3 characters to search</p>
      )}

      {isLoading && <p className="text-center text-slate-500">Searching...</p>}

      {customers && customers.length === 0 && searchQuery.length >= 3 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500">No customers found for "{searchQuery}".</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create New Customer
          </button>
        </div>
      )}

      {customers && customers.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {customers.map((customer: any) => (
              <div key={customer.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {customer.first_name} {customer.last_name}
                      {customer.company_name && ` (${customer.company_name})`}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      customer.customer_type === 'corporate' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {customer.customer_type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{customer.phone}</p>
                  {customer.landmark_address && (
                    <p className="mt-0.5 text-xs text-slate-400">{customer.landmark_address}</p>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-400">{customer.customer_code}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-400">Search for a customer by name or phone number</p>
        </div>
      )}
    </div>
  );
}
