// utils/api.js
import axios from 'axios'

// wallet + result time
export const postWallet = (email, signal) => axios.post('/api/users/wallet', { email }, { signal })

// place bet
export const placeBet = (payload) => axios.post('/api/bets/place', payload)
