module.exports = {
  apps: [{
    name: 'cyarika-backend',
    script: './backend/dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
