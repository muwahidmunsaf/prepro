
import React, { useState } from 'react';
// FIX: The useAppContext hook is exported from 'hooks/useAppContext', not from the context file.
import { useAppContext } from '../hooks/useAppContext';
import { PlusIcon, EditIcon, TrashIcon, UserIcon, ChevronRightIcon, LockIcon } from './icons';
import * as supabaseService from '../services/supabaseService';
import type { Category, Test, Question, User, TestAccess } from '../types';

type AdminView = 'categories' | 'tests' | 'questions' | 'users';

// Reusable Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [currentView, setCurrentView] = useState<AdminView>('categories');

  // State for modals and forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | Test | Question | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<Test | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // State for search and filtering
  const [categorySearch, setCategorySearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [viewingCategoryTests, setViewingCategoryTests] = useState<Category | null>(null);
  // Users management state
  const [userSearch, setUserSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  
  // Test Access Management
  const [showTestAccessModal, setShowTestAccessModal] = useState(false);
  const [testAccessSearch, setTestAccessSearch] = useState('');
  const [testAccessPage, setTestAccessPage] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  // Pending UI intents to coordinate cross-view actions
  const [pendingOpenTestModal, setPendingOpenTestModal] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  // Return behavior
  const [returnToCategoryIdOnClose, setReturnToCategoryIdOnClose] = useState<string | null>(null);
  const [previousCategoryIdForQuestions, setPreviousCategoryIdForQuestions] = useState<string | null>(null);
  
  const openModal = (item: Category | Test | Question | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
    setSelectedFile(null);
    setIsUploading(false);
    // If we initiated Add Test from a category view, return to that category's tests
    if (returnToCategoryIdOnClose) {
      const cat = state.categories.find(c => c.id === returnToCategoryIdOnClose) || null;
      setViewingCategoryTests(cat || null);
      setReturnToCategoryIdOnClose(null);
      setTestSearch('');
    }
  };

  // Category Management
  const CategoryManager = () => {
    const [name, setName] = useState( (editingItem as Category)?.name || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          if (!name.trim()) {
            alert('Category name is required.');
            return;
          }
          
          // Check for duplicate category names (case-insensitive)
          if (!editingItem && state.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            alert('A category with this name already exists. Please choose a different name.');
            return;
          }
          
        if (editingItem) {
            // When editing, check if changing the name creates a duplicate
            const otherCategories = state.categories.filter(cat => cat.id !== (editingItem as Category).id);
            if (otherCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
              alert('A category with this name already exists. Please choose a different name.');
              return;
            }
            const updatedCategory = await supabaseService.updateCategory({ 
              id: (editingItem as Category).id, 
              name 
            });
            dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
        } else {
            const newCategory = await supabaseService.createCategory({ name });
            dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
          }
          closeModal();
        } catch (error) {
          console.error('Error saving category:', error);
        }
    };

    // Filter categories based on search
    const filteredCategories = state.categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Manage Categories</h2>
                <button onClick={() => openModal()} className="bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors w-full sm:w-auto">
                    <PlusIcon className="w-4 h-4"/> 
                    <span>Add Category</span>
                </button>
            </div>
            
            <ul className="space-y-3">
                {filteredCategories.map(cat => (
                    <li key={cat.id} className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white text-lg">{cat.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{state.tests.filter(t => t.categoryId === cat.id).length} tests</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-2">
                            <button 
                                onClick={() => { setViewingCategoryTests(cat); setTestSearch(''); }} 
                                className="text-indigo-500 hover:text-indigo-700 text-sm px-3 py-1 rounded-md border border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                                View Tests
                            </button>
                            <button onClick={() => openModal(cat)} className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <EditIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  await supabaseService.deleteCategory(cat.id);
                                  dispatch({type: 'DELETE_CATEGORY', payload: cat.id});
                                } catch (error) {
                                  console.error('Error deleting category:', error);
                                }
                              }} 
                              className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            
            {/* No results message */}
            {filteredCategories.length === 0 && categorySearch && (
                <div className="text-center py-8 text-gray-500">
                    No categories found matching "{categorySearch}"
                </div>
            )}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Category Name" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"/>
                    <button type="submit" className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg w-full font-medium transition-colors">Save</button>
                </form>
            </Modal>
        </div>
    );
  };

  // Users Management
  const UsersManager = () => {
    const filteredUsers = state.users.filter(u =>
      (u.name + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase())
    );

    const openUserModal = (user: User | null = null) => {
      setEditingUser(user);
      setIsUserModalOpen(true);
    };
    const closeUserModal = () => {
      setEditingUser(null);
      setIsUserModalOpen(false);
    };

    const [form, setForm] = useState<User>({
      id: editingUser?.id || '',
      name: editingUser?.name || '',
      email: editingUser?.email || '',
      password: editingUser?.password || '',
      isAdmin: editingUser?.isAdmin || false,
    });

    React.useEffect(() => {
      setForm({
        id: editingUser?.id || '',
        name: editingUser?.name || '',
        email: editingUser?.email || '',
        password: editingUser?.password || '',
        isAdmin: editingUser?.isAdmin || false,
      })
    }, [editingUser]);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingUser) {
          const updated = await supabaseService.updateUser(form);
          dispatch({ type: 'UPDATE_USER', payload: updated });
        } else {
          const created = await supabaseService.createUser({ name: form.name, email: form.email, password: form.password, isAdmin: form.isAdmin });
          dispatch({ type: 'ADD_USER', payload: created });
        }
        closeUserModal();
      } catch (err) {
        alert('Error saving user');
      }
    };

    const handleDelete = async (id: string) => {
      if (!confirm('Delete this user?')) return;
      try {
        await supabaseService.deleteUser(id);
        dispatch({ type: 'DELETE_USER', payload: id });
      } catch {
        alert('Error deleting user');
      }
    };

    // Helper to approve/lock per-category access
    const toggleAccess = async (u: User, cat: Category, status: 'approved' | 'locked') => {
      try {
        await supabaseService.upsertCategoryAccess(u.id, cat.id, status);
        if (status === 'approved') {
          await supabaseService.createNotification(u.id, 'Category approved', `You can now access ${cat.name}.`);
        } else {
          await supabaseService.createNotification(u.id, 'Category locked', `${cat.name} has been locked.`);
        }
        const updatedAccess = await supabaseService.fetchCategoryAccess();
        dispatch({ type: 'SET_CATEGORY_ACCESS', payload: updatedAccess } as any);
      } catch {
        alert('Failed to update access');
      }
    };

    const approveAllPending = async (u: User) => {
      try {
        const pending = (state.categoryAccess || []).filter(a => a.userId === u.id && a.status === 'requested');
        for (const a of pending) {
          const cat = state.categories.find(c=>c.id===a.categoryId);
          if (!cat) continue;
          await supabaseService.upsertCategoryAccess(u.id, a.categoryId, 'approved');
        }
        if (pending.length) await supabaseService.createNotification(u.id, 'All requested categories approved', `${pending.length} categories approved.`);
        const updatedAccess = await supabaseService.fetchCategoryAccess();
        dispatch({ type: 'SET_CATEGORY_ACCESS', payload: updatedAccess } as any);
      } catch { alert('Failed to approve all'); }
    }

    const getAccessStatus = (uId: string, cId: string) => state.categoryAccess?.find(a => a.userId === uId && a.categoryId === cId)?.status || 'locked';

  // Test Access Management Functions (using same pattern as category access)
  const getTestAccessStatus = (uId: string, tId: string) => state.testAccess?.find(a => a.userId === uId && a.testId === tId)?.status || 'locked';

  const toggleTestAccess = async (u: User, test: Test, status: 'approved' | 'locked') => {
    try {
      console.log('DATABASE: Admin toggling test access:', { 
        userId: u.id, 
        testId: test.id, 
        status,
        userString: String(u.id),
        testString: String(test.id)
      });
      
      const result = await supabaseService.upsertTestAccess(u.id, test.id, status);
      console.log('DATABASE: upsertTestAccess result:', result);
      
      if (status === 'approved') {
        await supabaseService.createNotification(u.id, 'Test approved', `You can now access ${test.title}.`);
      } else {
        await supabaseService.createNotification(u.id, 'Test locked', `${test.title} has been locked.`);
      }
      
      const updatedAccess = await supabaseService.fetchTestAccess();
      dispatch({ type: 'SET_TEST_ACCESS', payload: updatedAccess } as any);
      console.log('DATABASE: Admin updated test access:', updatedAccess);
      
    } catch (error) {
      console.error('DATABASE: Failed to update test access:', error);
      alert('Failed to update test access');
    }
  };

  // Dropdown toggle function
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

    // Access Manager Modal state (search + pagination)
    const [accessForUser, setAccessForUser] = useState<User|null>(null);
  const [accessSearch, setAccessSearch] = useState('');
  const [accessPage, setAccessPage] = useState(0);
  const pageSize = 25;
  
    const filteredCats = React.useMemo(()=> state.categories.filter(c=> c.name.toLowerCase().includes(accessSearch.toLowerCase())), [state.categories, accessSearch]);
    const pagedCats = React.useMemo(()=> filteredCats.slice(accessPage*pageSize, accessPage*pageSize+pageSize), [filteredCats, accessPage]);

    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Manage Users</h2>
          <div className="w-full sm:w-auto">
            <button onClick={() => openUserModal(null)} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto flex items-center justify-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {filteredUsers.map(u => (
            <li key={u.id} className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-slate-900 dark:text-white text-lg">{u.name}</p>
                  {u.isAdmin && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Admin</span>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{u.email}</p>
                <div className="text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-slate-400">Category Access</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={()=>approveAllPending(u)} className="text-emerald-500 hover:underline text-xs">Approve All Pending</button>
                      <button onClick={()=>{ setAccessForUser(u); setAccessSearch(''); setAccessPage(0); }} className="text-indigo-400 hover:underline text-xs">Manage…</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-2">
                <button onClick={() => openUserModal(u)} className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <EditIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setHistoryUser(u)} className="text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white text-xs border border-slate-400 dark:border-slate-500 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                  View History
                </button>
              </div>
            </li>
          ))}
        </ul>

        <Modal isOpen={isUserModalOpen} onClose={closeUserModal} title={editingUser ? 'Edit User' : 'Add User'}>
          <form onSubmit={handleSave} className="space-y-4">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base" />
            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base" />
            <label className="flex items-center space-x-2 text-slate-800 dark:text-white p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <input type="checkbox" checked={form.isAdmin} onChange={e => setForm({ ...form, isAdmin: e.target.checked })} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /> 
              <span>Admin</span>
            </label>
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg w-full font-medium transition-colors">Save</button>
          </form>
        </Modal>
        {/* History Modal */}
        <Modal isOpen={!!historyUser} onClose={() => setHistoryUser(null)} title={`History – ${historyUser?.name || ''}`}>
          <div className="max-h-[28rem] overflow-auto pr-2 custom-scroll">
            {(state.results.filter(r => r.userId === (historyUser?.id || ''))).length === 0 ? (
              <p className="text-slate-400">No results for this user.</p>
            ) : (
              state.results
                .filter(r => r.userId === (historyUser?.id || ''))
                .map(r => (
                  <div key={r.id} className="p-3 mb-2 rounded border dark:border-slate-600 bg-slate-800/60 hover:bg-slate-800 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium truncate mr-3">{state.tests.find(t=>t.id===r.testId)?.title || 'Test'}</p>
                      <span className="text-sm text-slate-400 whitespace-nowrap">{new Date(r.date).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-slate-300">Score: {r.score}/{r.totalQuestions} ({Math.round((r.score/r.totalQuestions)*100)}%)</p>
                    </div>
                  </div>
                ))
            )}
          </div>
          <style>{`.custom-scroll{scrollbar-width:thin; scrollbar-color:#475569 transparent;} .custom-scroll::-webkit-scrollbar{width:8px} .custom-scroll::-webkit-scrollbar-thumb{background:#475569;border-radius:8px} .custom-scroll::-webkit-scrollbar-track{background:transparent}`}</style>
        </Modal>

        {/* Test Access Manager Modal */}
        <Modal isOpen={showTestAccessModal} onClose={() => setShowTestAccessModal(false)} title="Manage Test Access">
          <div className="space-y-3">
            <input 
              value={testAccessSearch} 
              onChange={e => { setTestAccessSearch(e.target.value); setTestAccessPage(0); }} 
              placeholder="Search tests..." 
              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"
            />
            <div className="h-96 overflow-auto divide-y divide-slate-200 dark:divide-slate-700 custom-scroll">
              {state.tests
                .filter(test => test.title.toLowerCase().includes(testAccessSearch.toLowerCase()))
                .slice(testAccessPage * pageSize, (testAccessPage + 1) * pageSize)
                .map(test => (
                  <div key={test.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{test.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {state.categories.find(c => c.id === test.categoryId)?.name} • {test.totalQuestions} questions
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {state.users.filter(u => getTestAccessStatus(u.id, test.id) === 'approved').length} / {state.users.length} users
                      </span>
                      <button
                        onClick={() => {
                          // Toggle access for all users
                          state.users.forEach(user => {
                            if (!user.isAdmin) {
                              toggleTestAccess(user, test, 'approved');
                            }
                          });
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Toggle All
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTestAccessPage(Math.max(0, testAccessPage - 1))}
                disabled={testAccessPage === 0}
                className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {testAccessPage + 1} of {Math.ceil(state.tests.length / pageSize)}
              </span>
              <button
                onClick={() => setTestAccessPage(Math.min(Math.ceil(state.tests.length / pageSize) - 1, testAccessPage + 1))}
                disabled={testAccessPage >= Math.ceil(state.tests.length / pageSize) - 1}
                className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </Modal>

        {/* Access Manager Modal */}
        <Modal isOpen={!!accessForUser} onClose={()=> setAccessForUser(null)} title={`Manage Access – ${accessForUser?.name || ''}`}>
          <div className="space-y-3">
            <input value={accessSearch} onChange={e=>{ setAccessSearch(e.target.value); setAccessPage(0); }} placeholder="Search categories" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"/>
            <div className="h-96 overflow-auto divide-y divide-slate-200 dark:divide-slate-700 custom-scroll">
              {pagedCats.map(cat => {
                const status = accessForUser ? getAccessStatus(accessForUser.id, cat.id) : 'locked';
                const categoryTests = state.tests.filter(test => test.categoryId === cat.id);
                const isExpanded = expandedCategories.has(cat.id);
                return (
                  <div key={cat.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCategoryExpansion(cat.id)}
                          className="text-slate-400 hover:text-white transition-colors"
                          disabled={categoryTests.length === 0}
                        >
                          {categoryTests.length > 0 ? (
                            <svg 
                              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </button>
                        <div>
                          <p className="text-slate-800 dark:text-white font-medium">{cat.name}</p>
                          <span className={`text-xs ${status==='approved'?'text-green-600 dark:text-green-400':status==='requested'?'text-yellow-600 dark:text-yellow-400':'text-slate-500 dark:text-slate-400'}`}>{status}</span>
                        </div>
                      </div>
                      <div className="space-x-3">
                        {accessForUser && (<>
                          <button onClick={()=> toggleAccess(accessForUser, cat, 'approved')} className="text-green-500 hover:underline">Approve</button>
                          <button onClick={()=> toggleAccess(accessForUser, cat, 'locked')} className="text-red-500 hover:underline">Lock</button>
                        </>)}
                      </div>
                    </div>
                    
                    {/* Tests Dropdown */}
                    {categoryTests.length > 0 && isExpanded && (
                      <div className="ml-6 mt-2 border-l-2 border-slate-600 pl-4">
                        <div className="text-xs text-slate-400 mb-2">Tests in this category:</div>
                        {categoryTests.map(test => {
                          const testStatus = getTestAccessStatus(accessForUser?.id || '', test.id);
                          return (
                            <div key={test.id} className="flex items-center justify-between py-1 text-sm">
                              <div className="flex-1">
                                <span className="text-slate-700 dark:text-slate-300">{test.title}</span>
                                <span className="ml-2 text-xs text-slate-500">
                                  ({test.totalQuestions} questions, {test.duration}min)
                                </span>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Status: <span className={`font-semibold ${testStatus === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {testStatus}
                                  </span>
                                </div>
                              </div>
                              <div className="space-x-3">
                                {accessForUser && (<>
                                  <button onClick={() => toggleTestAccess(accessForUser, test, 'approved')} className="text-green-500 hover:underline">Approve</button>
                                  <button onClick={() => toggleTestAccess(accessForUser, test, 'locked')} className="text-red-500 hover:underline">Lock</button>
                                </>)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button disabled={accessPage===0} onClick={()=> setAccessPage(p=> Math.max(0, p-1))} className={`px-3 py-1 rounded ${accessPage===0? 'bg-slate-600 text-slate-400 cursor-not-allowed':'bg-slate-500 text-white'}`}>Prev</button>
              <p className="text-slate-400 text-sm">{filteredCats.length} categories • Page {accessPage+1} / {Math.max(1, Math.ceil(filteredCats.length/pageSize))}</p>
              <button disabled={(accessPage+1)*pageSize >= filteredCats.length} onClick={()=> setAccessPage(p=> p+1)} className={`px-3 py-1 rounded ${((accessPage+1)*pageSize >= filteredCats.length)? 'bg-slate-600 text-slate-400 cursor-not-allowed':'bg-slate-500 text-white'}`}>Next</button>
            </div>
          </div>
            </Modal>
        </div>
    );
  };

  // Test Management
  const TestManager = () => {
    const [formState, setFormState] = useState({
        title: (editingItem as Test)?.title || '',
        categoryId: (editingItem as Test)?.categoryId || (pendingOpenTestModal ? (pendingCategoryId || viewingCategoryTests?.id || '') : ''),
        duration: (editingItem as Test)?.duration || '',
        totalQuestions: (editingItem as Test)?.totalQuestions || '',
    });

    // Auto-open modal when navigated from a category with intent to add test
    React.useEffect(() => {
        if (pendingOpenTestModal) {
            setFormState(prev => ({ ...prev, categoryId: pendingCategoryId || viewingCategoryTests?.id || '' }));
            setIsModalOpen(true);
            setPendingOpenTestModal(false);
            // Keep pendingCategoryId for return behavior until modal closes
        }
    }, [pendingOpenTestModal, pendingCategoryId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: name === 'duration' || name === 'totalQuestions' ? 
          (value === '' ? value : parseInt(value) || value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          // Validate required fields for new tests
          if (!editingItem) {
            if (!formState.title.trim()) {
              alert('Test title is required.');
              return;
            }
            if (!formState.categoryId) {
              alert('Please select a category.');
              return;
            }
            if (!formState.duration || formState.duration <= 0) {
              alert('Duration must be a positive number.');
              return;
            }
            if (!formState.totalQuestions || formState.totalQuestions <= 0) {
              alert('Total questions must be a positive number.');
              return;
            }
          }
          
          // Check for duplicate test names only within the same category (case-insensitive)
          const otherTestsSameCategory = state.tests
            .filter(test => test.id !== (editingItem as Test)?.id)
            .filter(test => test.categoryId === formState.categoryId);
          if ((!editingItem || formState.title !== (editingItem as Test)?.title) 
              && otherTestsSameCategory.some(test => test.title.toLowerCase() === formState.title.toLowerCase())) {
            alert('A test with this name already exists in this category. Please choose a different name.');
            return;
          }
          
        if (editingItem) {
            // When editing, allow keeping the same name or changing to a unique name
            const updatedTest = await supabaseService.updateTest({ ...editingItem as Test, ...formState });
            dispatch({ type: 'UPDATE_TEST', payload: updatedTest });
        } else {
            const newTest = await supabaseService.createTest({
              ...formState,
              duration: parseInt(formState.duration.toString()),
              totalQuestions: parseInt(formState.totalQuestions.toString())
            });
            dispatch({ type: 'ADD_TEST', payload: newTest });
          }
          closeModal();
        } catch (error) {
          console.error('Error saving test:', error);
        }
    };

    // Filter tests based on search
    const filteredTests = state.tests.filter(test => {
        const categoryName = state.categories.find(c => c.id === test.categoryId)?.name || '';
        const searchTerm = testSearch.toLowerCase();
        return test.title.toLowerCase().includes(searchTerm) || 
               categoryName.toLowerCase().includes(searchTerm);
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Manage Tests</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <button onClick={() => setShowTestAccessModal(true)} className="bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-700 transition-colors w-full sm:w-auto">
                        <LockIcon className="w-4 h-4"/> 
                        <span>Manage Test Access</span>
                    </button>
                    <button onClick={() => openModal()} className="bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors w-full sm:w-auto">
                        <PlusIcon className="w-4 h-4"/> 
                        <span>Add Test</span>
                    </button>
                </div>
            </div>
            
            <ul className="space-y-3">
                {filteredTests.map(test => (
                    <li key={test.id} className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white text-lg">{test.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{state.categories.find(c => c.id === test.categoryId)?.name} • {state.questions.filter(q => q.testId === test.id).length} questions</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-2">
                           <button onClick={() => { setSelectedTestForQuestions(test); setCurrentView('questions'); }} className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 rounded-md border border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                               Manage Questions
                           </button>
                            <button onClick={() => openModal(test)} className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <EditIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => dispatch({type: 'DELETE_TEST', payload: test.id})} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            
            {/* No results message */}
            {filteredTests.length === 0 && testSearch && (
                <div className="text-center py-8 text-gray-500">
                    No tests found matching "{testSearch}"
                </div>
            )}
             <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'Edit Test' : 'Add Test'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="title" value={formState.title} onChange={handleInputChange} placeholder="Test Title" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"/>
                    <select name="categoryId" value={formState.categoryId} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white">
                        <option value="" className="text-gray-600 bg-slate-700">Select Category</option>
                        {state.categories.map(c => <option key={c.id} value={c.id} className="text-slate-800 dark:text-white bg-slate-700">{c.name}</option>)}
                    </select>
                    <input type="number" name="duration" value={formState.duration} onChange={handleInputChange} placeholder="Duration (mins)" required={!editingItem} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"/>
                    <input type="number" name="totalQuestions" value={formState.totalQuestions} onChange={handleInputChange} placeholder="Total Questions" required={!editingItem} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"/>
                    <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded-lg w-full">Save</button>
                </form>
            </Modal>
        </div>
    );
  };
  
  // Question Management
  const QuestionManager = () => {
    const [formState, setFormState] = useState({
        questionText: (editingItem as Question)?.questionText || '',
        options: (editingItem as Question)?.options || ['', '', '', ''],
        correctAnswer: (editingItem as Question)?.correctAnswer ?? 0,
    });
    
    const questionsForTest = state.questions.filter(q => q.testId === selectedTestForQuestions!.id);
    
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formState.options];
        newOptions[index] = value;
        setFormState(prev => ({ ...prev, options: newOptions }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
        if (editingItem) {
            const updatedQuestion = await supabaseService.updateQuestion({ ...editingItem as Question, ...formState });
            dispatch({ type: 'UPDATE_QUESTION', payload: updatedQuestion });
        } else {
            const newQuestion = await supabaseService.createQuestion({ ...formState, testId: selectedTestForQuestions!.id });
            dispatch({ type: 'ADD_QUESTION', payload: newQuestion });
          }
          closeModal();
        } catch (error) {
          console.error('Error saving question:', error);
        }
    };

    const parseCSV = (csvText: string): Question[] => {
        const lines = csvText.split('\n').filter(line => line.trim());
        const questions: Question[] = [];
        
        lines.slice(1).forEach((line, index) => { // Skip header row
            const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
            if (values.length >= 6) { // question, option1, option2, option3, option4, correctAnswerIndex
                const correctAnswerValue = values[5];
                
                // Ensure correct_answer is a valid integer
                let correctAnswer = 0;
                if (correctAnswerValue !== '' && correctAnswerValue !== 'null' && correctAnswerValue !== null) {
                    const parsedNum = parseInt(correctAnswerValue);
                    if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 3) {
                        correctAnswer = parsedNum;
                    }
                }
                
                // Ensure all fields are filled
                if (values[0] && values[1] && values[2] && values[3] && values[4]) {
                    questions.push({
                        id: '', // Will be generated by the backend
                        testId: selectedTestForQuestions!.id,
                        questionText: values[0],
                        options: [values[1], values[2], values[3], values[4]],
                        correctAnswer: correctAnswer,
                    });
                }
            }
        });
        return questions;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
    };

    const processFileAndUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(selectedFile);
            });

            let questions: Question[] = [];

            if (selectedFile.name.endsWith('.json')) {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    questions = parsed.map((q: any) => ({
                        id: '', // Will be generated by the backend
                        testId: selectedTestForQuestions!.id,
                        questionText: q.questionText || '',
                        options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
                        correctAnswer: q.correctAnswer !== null && q.correctAnswer !== undefined && 
                                     !isNaN(parseInt(q.correctAnswer)) 
                                     ? parseInt(q.correctAnswer) : 0
                    }));
                } else {
                    alert('Invalid JSON format. Expected an array of questions.');
                    return;
                }
            } else if (selectedFile.name.endsWith('.csv')) {
                questions = parseCSV(content);
            } else {
                alert('Only JSON and CSV files are supported.');
                return;
            }

            if (questions.length > 0) {
                const newQuestions = await supabaseService.createMultipleQuestions(questions);
            dispatch({ type: 'BULK_ADD_QUESTIONS', payload: newQuestions });
                alert(`Successfully uploaded ${questions.length} questions!`);
                setIsBulkUploadOpen(false);
                setSelectedFile(null);
            } else {
                alert('No valid questions found in the file.');
            }
        } catch (error) {
            alert('Error processing file: ' + (error as Error).message);
        } finally {
            setIsUploading(false);
        }
    };



    if (!selectedTestForQuestions) {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Manage Questions</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Select a test to manage questions.</p>
          <div className="space-y-2">
            {state.tests.map(test => (
              <button
                key={test.id}
                onClick={() => setSelectedTestForQuestions(test)}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{test.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {state.categories.find(c => c.id === test.categoryId)?.name} • {test.totalQuestions} Questions
                    </p>
                  </div>
                  <span className="text-indigo-600 font-semibold">Select &rarr;</span>
                </div>
              </button>
            ))}
          </div>
          {state.tests.length === 0 && (
            <p className="text-center text-gray-500 py-8">No tests available. Create a test first in the Tests section.</p>
          )}
        </div>
      );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                  <button onClick={() => {
                    if (previousCategoryIdForQuestions) {
                      const cat = state.categories.find(c => c.id === previousCategoryIdForQuestions) || null;
                      setViewingCategoryTests(cat || null);
                      setPreviousCategoryIdForQuestions(null);
                      setCurrentView('categories');
                    } else {
                      setCurrentView('tests');
                    }
                  }} className="text-indigo-600 hover:text-indigo-800 mb-2">&larr; Back</button>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Questions for "{selectedTestForQuestions.title}"</h2>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => openModal()} className="bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"><PlusIcon/> <span>Add Question</span></button>
                    <button onClick={() => setIsBulkUploadOpen(true)} className="bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-700">Bulk Upload</button>
                </div>
            </div>
             <ul className="space-y-2">
                {questionsForTest.map(q => (
                    <li key={q.id} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex justify-between items-center">
                        <span className="font-medium truncate pr-4 text-slate-900 dark:text-white">{q.questionText}</span>
                        <div className="space-x-2 flex-shrink-0">
                            <button onClick={() => openModal(q)} className="text-blue-500 hover:text-blue-700"><EditIcon /></button>
                            <button onClick={() => dispatch({type: 'DELETE_QUESTION', payload: q.id})} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                        </div>
                    </li>
                ))}
            </ul>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'Edit Question' : 'Add Question'}>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea value={formState.questionText} onChange={e => setFormState(p => ({...p, questionText: e.target.value}))} placeholder="Question Text" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"/>
                    {formState.options.map((opt, i) => (
                        <input key={i} type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i+1}`} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400"/>
                    ))}
                    <select value={formState.correctAnswer} onChange={e => setFormState(p => ({...p, correctAnswer: parseInt(e.target.value)}))} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white">
                        {formState.options.map((_, i) => <option key={i} value={i} className="text-slate-800 dark:text-white bg-slate-700">Correct Answer: Option {i+1}</option>)}
                    </select>
                    <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded-lg w-full">Save</button>
                </form>
            </Modal>

            <Modal isOpen={isBulkUploadOpen} onClose={() => {setIsBulkUploadOpen(false); setSelectedFile(null);}} title="Bulk Upload Questions">
                <p className="mb-2 text-sm text-slate-500">Upload a JSON or CSV file.</p>
                <div className="mb-4 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded">
                    <p className="font-bold mb-1">CSV Format:</p>
                    <code>"What is React?","JavaScript library","CSS framework","Database","API",0</code>
                    <p className="mt-2 font-bold">JSON Format:</p>
                    <code>{`[{"questionText": "...", "options": ["a", "b", "c", "d"], "correctAnswer": 0}]`}</code>
                </div>
                <div className="space-y-4">
                    <input 
                        type="file" 
                        accept=".csv,.json" 
                        onChange={handleFileChange} 
                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-white"
                    />
                    {selectedFile && (
                        <div className="text-center">
                            <p className="text-slate-800 dark:text-white mb-2">Selected file: {selectedFile.name}</p>
                            <button
                                onClick={processFileAndUpload}
                                disabled={isUploading}
                                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {isUploading ? 'Uploading...' : 'Upload Questions'}
                    </button>
                        </div>
                    )}
                </div>
            </Modal>


        </div>
    );
  };

  // Category-specific Tests Management (triggered when View Tests is clicked)
  const CategoryTestsManager = () => {
    // Filter tests by the selected category
    const testsForCategory = state.tests.filter(test => test.categoryId === viewingCategoryTests!.id);
    
    // Filter by search within the category
    const filteredTestsForCategory = testsForCategory.filter(test => {
      const categoryName = viewingCategoryTests!.name;
      const searchTerm = testSearch.toLowerCase();
      return test.title.toLowerCase().includes(searchTerm) || 
             categoryName.toLowerCase().includes(searchTerm);
    });

    return (
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <button 
              onClick={() => setViewingCategoryTests(null)} 
              className="text-indigo-600 hover:text-indigo-800 mb-2"
            >
              &larr; Back to Categories
            </button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Tests for "{viewingCategoryTests?.name}"
            </h2>
          </div>
          <button 
            onClick={() => {
              // Switch to Tests view and open Add Test modal with preselected category
              setPendingCategoryId(viewingCategoryTests!.id);
              setReturnToCategoryIdOnClose(viewingCategoryTests!.id);
              setPendingOpenTestModal(true);
              setViewingCategoryTests(null);
              setCurrentView('tests');
            }} 
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
          >
            <PlusIcon/> <span>Add Test to This Category</span>
          </button>
        </div>
        
        <ul className="space-y-2">
          {filteredTestsForCategory.map(test => (
            <li key={test.id} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{test.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Duration: {test.duration} mins • Questions: {test.totalQuestions}</p>
              </div>
              <div className="space-x-2">
                <button onClick={() => { 
                  // Remember which category we came from so back button returns to that filtered view
                  if (viewingCategoryTests) setPreviousCategoryIdForQuestions(viewingCategoryTests.id);
                  setViewingCategoryTests(null); 
                  setSelectedTestForQuestions(test); 
                  setCurrentView('questions'); 
                }} className="text-blue-500 hover:text-blue-700">Manage Questions</button>
                <button onClick={() => openModal(test)} className="text-blue-500 hover:text-blue-700"><EditIcon /></button>
                <button onClick={() => dispatch({type: 'DELETE_TEST', payload: test.id})} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
              </div>
            </li>
          ))}
        </ul>
        
        {/* No results message */}
        {filteredTestsForCategory.length === 0 && testSearch && (
          <div className="text-center py-8 text-gray-500">
            No tests found matching "{testSearch}" in this category
          </div>
        )}
        
        {/* Nothing found in category message */}
        {filteredTestsForCategory.length === 0 && !testSearch && (
          <div className="text-center py-8 text-gray-500">
            No tests found in this category. Add a test to get started!
          </div>
        )}

        
        {/* Reuse existing Modal for Add Test - unified structure */}
        </div>
    );
  };

  const renderView = () => {
    // First handle special case for category tests view
    if (viewingCategoryTests) {
      return <CategoryTestsManager />;
    }
    
    switch(currentView) {
      case 'categories': return <CategoryManager />;
      case 'tests': return <TestManager />;
      case 'questions': return <QuestionManager />;
      case 'users': return <UsersManager />;
      default: return <CategoryManager />;
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6">Admin Panel</h1>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-700 mb-6 gap-4">
        <div className="flex flex-wrap gap-1 sm:gap-0">
          <button onClick={() => { setCurrentView('categories'); setViewingCategoryTests(null); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base ${currentView === 'categories' && !viewingCategoryTests ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Categories</button>
          <button onClick={() => { setCurrentView('tests'); setViewingCategoryTests(null); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base ${currentView === 'tests' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Tests</button>
          <button onClick={() => { setCurrentView('users'); setViewingCategoryTests(null); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base ${currentView === 'users' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Users</button>
        </div>
        <div className="w-full sm:w-64 pb-2">
          {viewingCategoryTests ? (
            <input 
              type="text" 
              placeholder={`Search tests in ${viewingCategoryTests.name}...`} 
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            />
          ) : currentView === 'categories' ? (
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            />
          ) : currentView === 'tests' ? (
            <input 
              type="text" 
              placeholder="Search tests by title or category..." 
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            />
          ) : (
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            />
          )}
        </div>
      </div>
      <div>{renderView()}</div>
    </div>
  );
};

export default AdminDashboard;
