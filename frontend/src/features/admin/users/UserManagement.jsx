import React, { useState, useEffect } from 'react';
import { api, API_URL } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { UserPlus, Users, Shield, ShieldCheck, User, Mail, Phone, Search, ChevronDown, Edit, Trash2, Eye, X } from 'lucide-react';

// ─── Member Invite Form ─────────────────────────────────────────
function MemberInviteForm({ onInvited }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/api/admin/invite', form);
            showToast(res.data.message || 'Member invited successfully!', 'success');
            setForm({ name: '', email: '', phone: '' });
            if (onInvited) onInvited();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to send invite';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950/20">
            <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <UserPlus size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Invite New Member</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Send dashboard access via email</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="Full Name *"
                            placeholder="e.g. Priya Sharma"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email Address *"
                            type="email"
                            placeholder="priya@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Phone Number *"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading} className="gap-2 px-6">
                            {loading ? (
                                <>
                                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                    Sending Invite...
                                </>
                            ) : (
                                <>
                                    <Mail size={16} />
                                    Send Invite
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Role Badge ──────────────────────────────────────────────────
function RoleBadge({ role }) {
    const config = {
        admin: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: ShieldCheck },
        member: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: Shield },
        user: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: User },
    };
    const c = config[role] || config.user;
    const Icon = c.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
            <Icon size={12} />
            {role}
        </span>
    );
}

// ─── Role Selector Dropdown ──────────────────────────────────────
function RoleSelector({ currentRole, userId, onRoleChanged }) {
    const [loading, setLoading] = useState(false);

    const handleChange = async (newRole) => {
        if (newRole === currentRole) return;
        setLoading(true);

        try {
            await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
            showToast(`Role updated to ${newRole}`, 'success');
            if (onRoleChanged) onRoleChanged();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update role', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Admin accounts can't be modified
    if (currentRole === 'admin') {
        return <RoleBadge role="admin" />;
    }

    return (
        <div className="relative inline-flex">
            <select
                value={currentRole}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    currentRole === 'member'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
                <option value="user">User</option>
                <option value="member">Member</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
    );
}

// ─── User Detail Modal ──────────────────────────────────────────
function UserDetailModal({ user, onClose }) {
    if (!user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <X size={20} />
                </button>
                <div className="flex flex-col items-center mb-6 pt-4">
                    {user.profile_picture ? (
                        <img 
                            src={`${API_URL}${user.profile_picture}`} 
                            alt={user.name} 
                            className="w-20 h-20 rounded-full object-cover mb-4 shadow-lg shadow-blue-500/20 border-4 border-white dark:border-slate-700"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-blue-500/20">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{user.name}</h3>
                    <div className="text-slate-500 mb-2">{user.email}</div>
                    <RoleBadge role={user.role} />
                </div>
                
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <div className="text-xs uppercase font-bold text-slate-400 mb-1">Phone Number</div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{user.phone || 'Not Provided'}</div>
                    </div>
                    {user.unique_id && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <div className="text-xs uppercase font-bold text-slate-400 mb-1">Maverick ID</div>
                            <div className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{user.unique_id}</div>
                        </div>
                    )}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <div className="text-xs uppercase font-bold text-slate-400 mb-1">Joined On</div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                    {user.prn && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <div className="text-xs uppercase font-bold text-slate-400 mb-1">PRN</div>
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{user.prn}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main User Management Component ──────────────────────────────
export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewUser, setViewUser] = useState(null);
    const [editModal, setEditModal] = useState({ isOpen: false, user: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/api/admin/users/${editModal.user.id}`, { name: editModal.user.name, phone: editModal.user.phone });
            showToast('User details updated', 'success');
            setEditModal({ isOpen: false, user: null });
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error');
        }
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/api/admin/users/${deleteModal.user.id}`);
            showToast('User deleted successfully', 'success');
            setDeleteModal({ isOpen: false, user: null });
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed', 'error');
        }
    };

    const filteredUsers = users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q)
        );
    });

    const roleStats = {
        admin: users.filter((u) => u.role === 'admin').length,
        member: users.filter((u) => u.role === 'member').length,
        user: users.filter((u) => u.role === 'user').length,
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Invite Section */}
            <MemberInviteForm onInvited={fetchUsers} />

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Admins', count: roleStats.admin, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { label: 'Members', count: roleStats.member, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Users', count: roleStats.user, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
                ].map((stat) => (
                    <div key={stat.label} className={`flex items-center gap-3 p-4 rounded-xl ${stat.bg}`}>
                        <stat.icon size={20} className={stat.color} />
                        <div>
                            <div className="text-xl font-bold text-slate-800 dark:text-white">{stat.count}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* User Table */}
            <Card>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users size={18} /> All Users ({users.length})
                    </h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Phone</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-slate-400">
                                        {searchQuery ? 'No users match your search.' : 'No users found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="p-4">
                                            <button onClick={() => setViewUser(u)} className="flex items-center gap-3 text-left group">
                                                {u.profile_picture ? (
                                                    <img 
                                                        src={`${API_URL}${u.profile_picture}`} 
                                                        alt={u.name} 
                                                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" 
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-primary transition-colors">{u.name}</div>
                                                    <div className="text-xs text-slate-500 group-hover:text-slate-400">{u.email}</div>
                                                </div>
                                            </button>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {u.phone || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                        </td>
                                        <td className="p-4">
                                            <RoleSelector currentRole={u.role} userId={u.id} onRoleChanged={fetchUsers} />
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(u.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="p-4 text-right">
                                            {u.role !== 'admin' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditModal({ isOpen: true, user: { ...u } })} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors" title="Edit User">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleteModal({ isOpen: true, user: u })} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Delete User">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Protected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* View Modal */}
            <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />

            {/* Edit Modal */}
            {editModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditModal({ isOpen: false, user: null })}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full">
                        <h3 className="text-2xl font-bold mb-4">Edit User</h3>
                        <form onSubmit={handleEditUser} className="space-y-4">
                            <Input label="Name" value={editModal.user.name} onChange={(e) => setEditModal({ ...editModal, user: { ...editModal.user, name: e.target.value } })} required />
                            <Input label="Phone" value={editModal.user.phone || ''} onChange={(e) => setEditModal({ ...editModal, user: { ...editModal.user, phone: e.target.value } })} />
                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" type="button" onClick={() => setEditModal({ isOpen: false, user: null })} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, user: null })}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
                        <Trash2 className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-2xl font-bold mb-2 break-all">{deleteModal.user?.name}</h3>
                        <p className="text-slate-500 mb-6">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, user: null })} className="flex-1">Cancel</Button>
                            <Button variant="danger" onClick={handleDeleteUser} className="flex-1">Delete User</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
