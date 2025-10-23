import { UserCheck, UserPlus, Users, UserRoundPen, MessageSquare } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { fetchConnections } from '../features/connections/connectionsSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const Connections = () => {
  const [currentTab, setCurrentTab] = useState('followers');
  const navigate = useNavigate();
  const {getToken} = useAuth();
  const dispatch = useDispatch();

  const {connections, pendingConnections, followers, following, loading, error} = useSelector((state) => state.connections);

  // Debug log
  useEffect(() => {
    console.log('🔍 Current state:', {
      connections: connections?.length,
      pendingConnections: pendingConnections?.length,
      followers: followers?.length,
      following: following?.length
    });
  }, [connections, pendingConnections, followers, following]);

  const dataArray = [
    { id: 'followers', label: 'Followers', value: followers || [], icon: Users },
    { id: 'following', label: 'Following', value: following || [], icon: UserCheck },
    { id: 'pending', label: 'Pending', value: pendingConnections || [], icon: UserRoundPen },
    { id: 'connections', label: 'Connections', value: connections || [], icon: UserPlus },
  ];

  const handleUnfollow = async (userId) => {
    try {
      const token = await getToken();
      const {data} = await api.post('/api/user/unfollow', {id: userId}, {
        headers: {Authorization: `Bearer ${token}`}
      });
      
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const acceptConnection = async (userId) => {
    try {
      const token = await getToken();
      const {data} = await api.post('/api/user/accept', {id: userId}, {
        headers: {Authorization: `Bearer ${token}`}
      });
      
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const token = await getToken();
        console.log('🚀 Fetching connections with token:', token ? 'exists' : 'missing');
        dispatch(fetchConnections(token));
      } catch (error) {
        console.error('❌ Error getting token:', error);
      }
    };
    
    loadConnections();
  }, [dispatch, getToken]); // Added dependencies

  const activeTabData = dataArray.find((item) => item.id === currentTab);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Connections</h1>
          <p className="text-slate-600">Manage your network and discover new connections</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-600">Loading connections...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 flex flex-wrap gap-6">
          {dataArray.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md"
            >
              <b>{item.value?.length || 0}</b>
              <p className="text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm">
          {dataArray.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                currentTab === tab.id ? 'bg-white font-medium text-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="ml-1">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* User Cards */}
        <div className="flex flex-wrap gap-6 mt-6">
          {activeTabData?.value?.length === 0 && !loading && (
            <div className="w-full text-center py-8 text-slate-500">
              No {currentTab} found
            </div>
          )}
          
          {activeTabData?.value?.map((user) => (
            <div
              key={user._id}
              className="w-full sm:max-w-md flex gap-5 p-6 bg-white shadow rounded-md"
            >
              <img
                src={user.profile_picture}
                alt="profile pic"
                className="rounded-full w-12 h-12 shadow-md mx-auto"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-700">{user.full_name}</p>
                <p className="text-slate-500">@{user.username}</p>
                <p className="text-sm text-gray-600">
                  {user.bio?.length > 30 ? `${user.bio.slice(0, 30)}...` : user.bio}
                </p>

                <div className="flex max-sm:flex-col gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer"
                  >
                    View Profile
                  </button>

                  {currentTab === 'following' && (
                    <button onClick={() => handleUnfollow(user._id)} className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-sky-200 text-black active:scale-95 transition cursor-pointer">
                      Unfollow
                    </button>
                  )}

                  {currentTab === 'pending' && (
                    <button onClick={() => acceptConnection(user._id)} className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-sky-200 text-black active:scale-95 transition cursor-pointer">
                      Accept
                    </button>
                  )}

                  {currentTab === 'connections' && (
                    <button
                      onClick={() => navigate(`/messages/${user._id}`)}
                      className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-sky-200 text-black active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;