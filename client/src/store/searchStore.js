import { create } from 'zustand';
import api from '@/lib/api';

const useSearchStore = create((set, get) => ({
  searches: [],
  currentSearch: null,
  results: [],
  loading: false,
  polling: false,
  error: null,

  startSearch: async (params) => {
    set({ loading: true, error: null, results: [] });
    try {
      const { data } = await api.post('/search', params);
      set({ currentSearch: data, loading: false });
      // Start polling for results
      get().pollStatus(data.searchId);
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Search failed', loading: false });
    }
  },

  pollStatus: async (searchId) => {
    set({ polling: true });
    const poll = async () => {
      try {
        const { data } = await api.get(`/search/${searchId}/status`);
        if (data.status === 'completed') {
          set({ polling: false });
          await get().fetchResults(searchId);
        } else if (data.status === 'failed') {
          set({ polling: false, error: data.error || 'Search failed' });
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        set({ polling: false });
      }
    };
    poll();
  },

  fetchResults: async (searchId) => {
    try {
      const { data } = await api.get(`/search/${searchId}`);
      set({ currentSearch: data, results: data.papers || [] });
    } catch (err) {
      set({ error: 'Failed to fetch results' });
    }
  },

  fetchHistory: async (page = 1) => {
    try {
      const { data } = await api.get(`/search/history?page=${page}`);
      set({ searches: data.searches });
      return data;
    } catch (err) {
      set({ error: 'Failed to fetch history' });
    }
  },

  clearResults: () => set({ results: [], currentSearch: null }),
}));

export default useSearchStore;
