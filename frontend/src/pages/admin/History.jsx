import React, { useState, useEffect } from 'react';
import { 
  MdHistoryEdu, MdFlag, MdEmojiEvents, MdLocationCity, 
  MdSave, MdDelete, MdEdit, MdAdd, MdClose, MdSearch,
  MdCalendarToday, MdTrendingUp, MdRefresh, MdArrowUpward,
  MdArrowDownward, MdCheckCircle, MdCancel
} from 'react-icons/md';
import { Toaster, toast } from 'sonner';

const HistoryAdmin = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMilestones, setFetchingMilestones] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  
  const [formData, setFormData] = useState({
    year: '',
    title: '',
    desc: '',
    icon: 'MdFlag',
    category: 'establishment',
    significance: 'medium'
  });

  const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:5000/api';

  // Icon mapping
  const iconMap = {
    MdLocationCity: MdLocationCity,
    MdFlag: MdFlag,
    MdHistoryEdu: MdHistoryEdu,
    MdEmojiEvents: MdEmojiEvents
  };

  const iconOptions = [
    { value: 'MdLocationCity', label: 'Campus/Location', component: MdLocationCity },
    { value: 'MdFlag', label: 'Foundation/Goal', component: MdFlag },
    { value: 'MdHistoryEdu', label: 'Charter/Academic', component: MdHistoryEdu },
    { value: 'MdEmojiEvents', label: 'Award/Achievement', component: MdEmojiEvents }
  ];

  const categories = [
    { value: 'establishment', label: 'Establishment', color: 'blue' },
    { value: 'infrastructure', label: 'Infrastructure', color: 'purple' },
    { value: 'accreditation', label: 'Accreditation', color: 'green' },
    { value: 'academic', label: 'Academic', color: 'indigo' },
    { value: 'achievement', label: 'Achievement', color: 'orange' },
    { value: 'partnership', label: 'Partnership', color: 'pink' }
  ];

  // Fetch milestones on component mount
  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    setFetchingMilestones(true);
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      const data = await response.json();
      
      if (data.success) {
        setMilestones(data.data || []);
      } else {
        toast.error('Failed to fetch milestones');
      }
    } catch (error) {
      toast.error('Network error while fetching milestones');
      console.error('Fetch error:', error);
    } finally {
      setFetchingMilestones(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = (milestone) => {
    setEditingId(milestone._id || milestone.id);
    setFormData({
      year: milestone.year || '',
      title: milestone.title || '',
      desc: milestone.desc || '',
      icon: milestone.icon || 'MdFlag',
      category: milestone.category || 'establishment',
      significance: milestone.significance || 'medium'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      year: '',
      title: '',
      desc: '',
      icon: 'MdFlag',
      category: 'establishment',
      significance: 'medium'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId 
      ? `${API_BASE_URL}/history/${editingId}`
      : `${API_BASE_URL}/history`;
    
    const method = editingId ? 'PUT' : 'POST';

    const promise = fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    toast.promise(promise, {
      loading: editingId ? 'Updating milestone...' : 'Adding milestone...',
      success: async (response) => {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to save');
        
        handleCancelEdit();
        fetchMilestones();
        return editingId ? 'Milestone updated successfully!' : 'Milestone added successfully!';
      },
      error: (err) => {
        return err.message || 'Network error. Please try again.';
      },
      finally: () => setLoading(false)
    });
  };

  const handleDelete = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/history/${milestoneId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Milestone deleted successfully!');
        fetchMilestones();
      } else {
        toast.error(data.message || 'Failed to delete milestone');
      }
    } catch (error) {
      toast.error('Network error while deleting milestone');
      console.error('Delete error:', error);
    }
  };

  // Filter and sort milestones
  const filteredMilestones = milestones
    .filter(m => {
      const matchesSearch = m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.year?.includes(searchTerm);
      const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return sortOrder === 'desc' ? yearB - yearA : yearA - yearB;
    });

  const stats = {
    total: milestones.length,
    highSignificance: milestones.filter(m => m.significance === 'high').length,
    recentYears: milestones.filter(m => parseInt(m.year) >= 2020).length,
    oldestYear: milestones.length > 0 ? Math.min(...milestones.map(m => parseInt(m.year) || 9999)) : 'N/A'
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Toaster position="top-right" richColors closeButton />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <MdHistoryEdu size={32} className="text-blue-600"/>
                University History Manager
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage institutional milestones and legacy timeline</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchMilestones}
                disabled={fetchingMilestones}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <MdRefresh size={18} className={fetchingMilestones ? 'animate-spin' : ''} /> Refresh
              </button>
              {editingId === null && (
                <button 
                  onClick={() => setEditingId('new')}
                  className="bg-[#1a2b4c] text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#243a5e] transition-colors"
                >
                  <MdAdd size={20}/> Add Milestone
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MdHistoryEdu className="text-blue-600" size={20}/>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total</p>
                  <p className="text-xl font-bold text-slate-800">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <MdEmojiEvents className="text-orange-600" size={20}/>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">High Impact</p>
                  <p className="text-xl font-bold text-orange-600">{stats.highSignificance}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MdTrendingUp className="text-green-600" size={20}/>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Since 2020</p>
                  <p className="text-xl font-bold text-green-600">{stats.recentYears}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <MdCalendarToday className="text-purple-600" size={20}/>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Since</p>
                  <p className="text-xl font-bold text-purple-600">{stats.oldestYear}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {editingId !== null && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-500 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId === 'new' ? 'Add New Milestone' : 'Edit Milestone'}
              </h2>
              <button 
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <MdClose size={24}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Year *
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 1999 or 2024"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Significance *
                  </label>
                  <select
                    name="significance"
                    value={formData.significance}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Milestone Title"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Description *
                  </label>
                  <textarea
                    name="desc"
                    value={formData.desc}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Describe the significance of this milestone..."
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Icon Type *
                  </label>
                  <div className="flex gap-3">
                    {iconOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: opt.value }))}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.icon === opt.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <opt.component size={24} className={formData.icon === opt.value ? 'text-blue-600' : 'text-slate-400'}/>
                        <span className={`text-xs font-semibold ${formData.icon === opt.value ? 'text-blue-600' : 'text-slate-600'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    loading 
                      ? 'bg-slate-400 cursor-not-allowed text-white' 
                      : 'bg-[#1a2b4c] text-white hover:bg-[#243a5e]'
                  }`}
                >
                  <MdCheckCircle size={18}/>
                  {loading ? 'Saving...' : (editingId === 'new' ? 'Add Milestone' : 'Update Milestone')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <MdCancel size={18} className="inline mr-2"/>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MdSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search milestones by title, description, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              {sortOrder === 'desc' ? <MdArrowDownward size={18}/> : <MdArrowUpward size={18}/>}
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        {/* Milestones Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {fetchingMilestones ? (
            <div className="p-12 text-center text-slate-500">
              <MdRefresh size={32} className="animate-spin mx-auto mb-3 text-slate-400" />
              <p className="font-semibold">Loading milestones...</p>
            </div>
          ) : filteredMilestones.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <MdHistoryEdu size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-lg">
                {searchTerm || filterCategory !== 'all' 
                  ? 'No milestones found matching your criteria.' 
                  : 'No milestones yet. Add your first milestone!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Icon</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Year</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Milestone</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Category</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Significance</th>
                    <th className="text-right p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMilestones.map((milestone, index) => {
                    const IconComponent = iconMap[milestone.icon] || MdFlag;
                    const categoryColor = getCategoryColor(milestone.category);
                    
                    return (
                      <tr 
                        key={milestone._id || index} 
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="bg-[#1a2b4c] text-white p-2.5 rounded-lg inline-flex">
                            <IconComponent size={22}/>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MdCalendarToday size={16} className="text-slate-400"/>
                            <span className="font-bold text-slate-800 text-lg">{milestone.year}</span>
                          </div>
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="font-bold text-slate-800 mb-1">{milestone.title}</p>
                          <p className="text-sm text-slate-600 line-clamp-2">{milestone.desc}</p>
                        </td>
                        <td className="p-4">
                          <span className={`bg-${categoryColor}-50 text-${categoryColor}-700 px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
                            {milestone.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            milestone.significance === 'high' 
                              ? 'bg-orange-100 text-orange-700' 
                              : milestone.significance === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {milestone.significance}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleStartEdit(milestone)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit milestone"
                            >
                              <MdEdit size={20}/>
                            </button>
                            <button 
                              onClick={() => handleDelete(milestone._id || milestone.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete milestone"
                            >
                              <MdDelete size={20}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredMilestones.length > 0 && (
          <div className="mt-4 text-center text-sm text-slate-500">
            Showing {filteredMilestones.length} of {milestones.length} milestones
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryAdmin;