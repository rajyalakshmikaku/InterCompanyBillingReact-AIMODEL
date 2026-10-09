import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser } from '../services/LoginApi';

export const login = createAsyncThunk(
    'ai/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await loginUser(credentials);
            return data;
        } catch (err) {
            return rejectWithValue(err.message || 'Login error');
        }
    }
);


const initialState = {
    user: sessionStorage.getItem('userName')
        ? {
            name: sessionStorage.getItem('name'),
            userName: sessionStorage.getItem('userName'),
            role: sessionStorage.getItem('roleName'),
            companyId: sessionStorage.getItem('companyId'),
            useremail: sessionStorage.getItem('email'),
            screenList: JSON.parse(sessionStorage.getItem('screenList') || '[]'),
        }
        : null,
    loading: false,
    forgotLoading: false,
    loginError: null,
    forgotError: null,
};

const aiSlice = createSlice({
    name: 'ai',
    initialState, // use the above initialState
    reducers: {
        logout: (state) => {
            state.user = null;
            state.loginError = null;
            sessionStorage.clear(); // clear all stored session
        },
    },
    extraReducers: (builder) => {
        builder

            .addCase(login.pending, (state) => {
                state.loading = true;
                state.loginError = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;

                sessionStorage.setItem('Name', action.payload.name);
                sessionStorage.setItem('userName', action.payload.userName);
                sessionStorage.setItem('roleName', action.payload.role);
                sessionStorage.setItem('loginTime', action.payload.loginTime);
                sessionStorage.setItem('userId', action.payload.userId);
                sessionStorage.setItem('password', action.payload.password);
                sessionStorage.setItem('companyId', action.payload.companyId);
                sessionStorage.setItem('useremail', action.payload.email);


            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.loginError = action.payload;
            })

    },
});



export const { logout } = aiSlice.actions;
export default aiSlice.reducer;
