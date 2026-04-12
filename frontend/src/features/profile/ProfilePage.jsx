import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, API_URL } from '@/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { Upload, Camera, User } from 'lucide-react';

export default function ProfilePage() {
    const { user, updateUserContext, isAdmin, isMember } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Editable fields
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        prn: user?.prn || '',
        college: user?.college || '',
        branch: user?.branch || '',
        year: user?.year || '',
    });

    const fileInputRef = useRef(null);

    // Rule: Name, Email, Phone are fixed for 'user' and 'member', only Admin can edit
    const canEditFixed = isAdmin;
    // Rule: Profile Picture upload is allowed for Admin and Member
    const canUploadPicture = isAdmin || isMember;

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/api/profile', formData);
            showToast('Profile updated successfully', 'success');
            updateUserContext(res.data.user);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('photo', file);

        setUploading(true);
        try {
            const res = await api.post('/api/profile/picture', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Profile picture updated successfully', 'success');
            // Update global context so navbar updates immediately
            updateUserContext({ profile_picture: res.data.profile_picture });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to upload picture', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    const photoUrl = user.profile_picture ? `${API_URL}${user.profile_picture}` : null; 

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-8">My Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ── Left Column: Avatar & Role ── */}
                <div className="md:col-span-1">
                    <Card className="text-center p-8 flex flex-col items-center border-slate-100 dark:border-slate-800">
                        <div className="relative group mb-6">
                            {photoUrl ? (
                                <img 
                                    src={photoUrl} 
                                    alt={user.name} 
                                    className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-slate-800"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg shadow-blue-500/20">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                </div>
                            )}

                            {/* Hover overlay for upload */}
                            {canUploadPicture && (
                                <div 
                                    className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="text-white mb-1" size={24} />
                                    <span className="text-white text-xs font-semibold">Change</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePictureUpload}
                            />
                        </div>

                        {uploading && <div className="text-sm text-primary animate-pulse mb-4">Uploading...</div>}

                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{user.name}</h2>
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                            user.role === 'member' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {user.role}
                        </div>

                        {user.unique_id && (
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 w-full">
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Maverick ID</div>
                                <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 py-2 rounded-lg">
                                    {user.unique_id}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Right Column: Form fields ── */}
                <div className="md:col-span-2">
                    <Card className="p-8 border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Account Details</h3>
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input 
                                    label="Full Name" 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    disabled={!canEditFixed}
                                    required
                                />
                                <Input 
                                    label="Email Address" 
                                    name="email"
                                    type="email"
                                    value={formData.email} 
                                    onChange={handleInputChange} 
                                    disabled={!canEditFixed}
                                    required
                                />
                                <Input 
                                    label="Phone Number" 
                                    name="phone"
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                    disabled={!canEditFixed}
                                />
                                <Input 
                                    label="PRN Number" 
                                    name="prn"
                                    value={formData.prn} 
                                    onChange={handleInputChange} 
                                    // Admins, members, and users can edit PRN
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                <Input 
                                    label="College" 
                                    name="college"
                                    value={formData.college} 
                                    onChange={handleInputChange} 
                                />
                                <Input 
                                    label="Branch" 
                                    name="branch"
                                    value={formData.branch} 
                                    onChange={handleInputChange} 
                                />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 dark:text-white"
                                    >
                                        <option value="">Select Year</option>
                                        <option value="FY">First Year (FY)</option>
                                        <option value="SY">Second Year (SY)</option>
                                        <option value="TY">Third Year (TY)</option>
                                        <option value="Final">Final Year</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {!canEditFixed && (
                                <p className="text-xs text-slate-500 italic flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                    <User size={14} /> Name, email, and phone number are locked for security reasons. Contact administrative staff to change these details.
                                </p>
                            )}

                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                                <Button type="submit" disabled={loading} className="px-8">
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
