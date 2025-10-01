export const depositRequests = [
  { id: 'd1', email: 'user1@mail.com', amount: 300, requestedAt: '2025-02-01 10:35' },
  { id: 'd2', email: 'player99@mail.com', amount: 1200, requestedAt: '2025-02-01 12:10' },
]

export const withdrawRequests = [
  {
    id: 'w1',
    email: 'pro@mail.com',
    phone: '01711-000000',
    method: 'bKash',
    amount: 850,
    requestedAt: '2025-02-02 09:15',
  },
  {
    id: 'w2',
    email: 'rapid@mail.com',
    phone: '01822-111111',
    method: 'Nagad',
    amount: 450,
    requestedAt: '2025-02-02 11:02',
  },
]

export const history = [
  {
    id: 'h1',
    type: 'DEPOSIT',
    email: 'demo@mail.com',
    amount: 500,
    action: 'ACCEPTED',
    at: '2025-01-31 18:10',
  },
  {
    id: 'h2',
    type: 'WITHDRAW',
    email: 'pro@mail.com',
    phone: '01711-000000',
    method: 'bKash',
    amount: 850,
    action: 'REJECTED',
    at: '2025-02-02 09:15',
  },
]
export const myBalance = 3000
