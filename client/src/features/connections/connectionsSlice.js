import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import api from '../../api/axios.js'

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: [],
    loading: false,
    error: null
}

export const fetchConnections = createAsyncThunk(
    'connections/fetchConnections', 
    async (token, { rejectWithValue }) => {
        try {
            const {data} = await api.get('/api/user/connections', {
                headers: {Authorization: `Bearer ${token}`},
            })
            console.log('✅ API Response:', data); // Debug log
            return data;
        } catch (error) {
            console.error('❌ Error fetching connections:', error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
)

const connectionsSlice = createSlice({
    name: 'connections',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchConnections.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConnections.fulfilled, (state, action) => {
                state.loading = false;
                console.log('📦 Payload received:', action.payload); // Debug log
                
                if (action.payload && action.payload.success) {
                    state.connections = action.payload.connections || [];
                    state.pendingConnections = action.payload.pendingConnections || [];
                    state.followers = action.payload.followers || [];
                    state.following = action.payload.following || [];
                    
                    console.log('✨ State updated:', {
                        connections: state.connections.length,
                        pending: state.pendingConnections.length,
                        followers: state.followers.length,
                        following: state.following.length
                    });
                } else {
                    console.warn('⚠️ API returned success: false');
                }
            })
            .addCase(fetchConnections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                console.error('💥 Fetch rejected:', action.payload);
            });
    }
})

export default connectionsSlice.reducer;