import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react';
import UserCard from '../components/UserCard';
import Loading from '../components/Loading';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { fetchUser } from '../features/user/userSlice.js';
import api from '../api/axios.js';

const Discover = () => {

  const dispatch = useDispatch();
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const {getToken} = useAuth();

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && input.trim()) {
      try {
        setUsers([]);
        setLoading(true);
        
        const {data} = await api.post('/api/user/discover', {input}, {
          headers: {Authorization: `Bearer ${await getToken()}`}
        });
        
        if (data.success) {
          setUsers(data.users);
          if (data.users.length === 0) {
            toast('No users found');
          }
        } else {
          toast.error(data.message);
        }
        
        setInput('');
      } catch (error) {
        console.error('Search error:', error);
        toast.error(error.message || 'Failed to search users');
      } finally {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchUser(token));
    });
  }, [dispatch, getToken]);

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover People</h1>
          <p className="text-slate-600">Connect with amazing people and grow your network</p>
        </div>

        {/* Search */}
        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80">
          <div className="p-6">
            <div className="relative">
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
              <input 
                type="text" 
                placeholder='Search people by name, username, bio, or location...' 
                className="pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                onChange={(e) => setInput(e.target.value)} 
                value={input} 
                onKeyUp={handleSearch}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Press Enter to search</p>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <Loading height='60vh' />
        ) : users.length > 0 ? (
          <>
            <p className="text-sm text-slate-600 mb-4">
              Found {users.length} {users.length === 1 ? 'user' : 'users'}
            </p>
            <div className='flex flex-wrap gap-6'>
              {users.map((user) => (
                <UserCard user={user} key={user._id} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Discovering</h3>
            <p className="text-gray-500">Search for people by name, username, or location</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Discover