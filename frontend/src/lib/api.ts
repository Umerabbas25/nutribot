import axios from 'axios';

// The base URL of the NestJS backend
export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
