import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';

function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: async () => { const { data } = await api.get('/users'); return data.data ?? []; } });
}
function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: async () => { const { data } = await api.get('/users'); return data.data ?? []; }, select: () => ['super_admin','admin','franchise_owner','branch_manager','shop_assistant','driver','clerk','accountant','logistics_manager'] });
}
function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (p: any) => { const { data } = await api.post('/users', p); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });
}
function usePatchUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...p }: any) => { const { data } = await api.patch(`/users/${id}`, p); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700', admin: 'bg-orange-100 text-orange-700',
  franchise_owner: 'bg-purple-100 text-purple-700', branch_manager: 'bg-blue-100 text-blue-700',
  driver: 'bg-green-100 text-green-700', shop_assistant: 'bg-teal-100 text-teal-700',
  clerk: 'bg-slate-100 text-slate-700', accountant: 'bg-yellow-100 text-yellow-700',
  logistics_manager: 'bg-indigo-100 text-indigo-700',
};

export function UsersPage() {
  const notify = useToast();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const patchUser = usePatchUser();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'clerk' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const filtered = users.filter((u: any) => {
    const role: any = Array.isArray(u.role) ? u.role[0] : u.role;
    const fullName = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase());
    const matchRole = !roleFilter || role?.name === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAdd = async () => {
    if (!form.firstName || !form.email || !form.phone || !form.password) { notify('All fields are required', 'error'); return; }
    try {
      await createUser.mutateAsync(form);
      notify(`User ${form.firstName} created`, 'success');
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'clerk' });
    } catch (err: any) { notify(err?.response?.data?.error || 'Failed to create user', 'error'); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await patchUser.mutateAsync({ id, isActive: !isActive });
    notify(isActive ? 'User deactivated' : 'User activated', 'success');
  };

  const ALL_ROLES = ['super_admin','admin','franchise_owner','branch_manager','shop_assistant','driver','clerk','accountant','logistics_manager'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">{users.length} platform users</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">+ Add User</button>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setRoleFilter('')} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${!roleFilter ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All ({users.length})</button>
        {ALL_ROLES.map(r => {
          const count = users.filter((u: any) => { const role: any = Array.isArray(u.role) ? u.role[0] : u.role; return role?.name === r; }).length;
          if (!count) return null;
          return <button key={r} onClick={() => setRoleFilter(r === roleFilter ? '' : r)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${roleFilter === r ? 'bg-brand-500 text-white' : `${ROLE_COLORS[r] ?? 'bg-slate-100 text-slate-600'} hover:opacity-80`}`}>{r.replace(/_/g,' ')} ({count})</button>;
        })}
      </div>

      {/* Search */}
      <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:border-brand-400 focus:outline-none shadow-sm" />

      {/* User table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">Role</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">Phone</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && [1,2,3].map(i => <tr key={i}><td colSpan={5}><div className="mx-5 my-3 h-5 animate-pulse rounded bg-slate-100" /></td></tr>)}
            {filtered.map((u: any) => {
              const role: any = Array.isArray(u.role) ? u.role[0] : u.role;
              return (
                <tr key={u.id} className={`hover:bg-slate-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ROLE_COLORS[role?.name] ?? 'bg-slate-100 text-slate-600'}`}>{role?.name?.replace(/_/g, ' ') ?? '—'}</span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-700 md:table-cell">{u.phone}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => toggleActive(u.id, u.is_active)} className={`rounded-lg border px-3 py-1 text-xs font-medium ${u.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-slate-400">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">Create User Account</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First name *" value={form.firstName} onChange={e => set('firstName', e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
                <input placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <input placeholder="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <input placeholder="Phone *" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <input placeholder="Password *" type="password" value={form.password} onChange={e => set('password', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <select value={form.role} onChange={e => set('role', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none">
                {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleAdd} disabled={createUser.isPending} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{createUser.isPending ? 'Creating…' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
