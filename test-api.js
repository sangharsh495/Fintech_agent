fetch('http://localhost:3000/api/auth/mfa/disable', { method: 'GET' })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
