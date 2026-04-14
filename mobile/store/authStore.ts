import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { Config } from '../constants/Config';

const API_URL = Config.API_URL;

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  loginAction: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  registerAction: (username: string, email: string, password: string) => Promise<{success: boolean; error?: string}>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,

  hydrate: async () => {
    const token = await AsyncStorage.getItem('token');
    const userString = await AsyncStorage.getItem('user');
    if (token) set({ token });
    if (userString) set({ user: JSON.parse(userString) });
  },

  setUser: (user) => {
    AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  loginAction: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { token, user } = response.data;
      if (user) user.id = Number(user.id);
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ token, user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const msg = error.response?.data?.error || error.message || 'Login failed';
      console.log('Login Error:', msg);
      return { success: false, error: msg };
    }
  },

  registerAction: async (username, email, password) => {
    set({ isLoading: true });
    try {
      await axios.post(`${API_URL}/register`, { username, email, password });
      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const msg = error.response?.data?.error || error.message || 'Registration failed';
      console.log('Register Error:', msg);
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
