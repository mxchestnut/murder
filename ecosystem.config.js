module.exports = {
  apps: [{
    name: 'my1eparty-backend',
    script: './backend/dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      USE_REDIS: 'false', // Disable Redis for local development
      PATHCOMPANION_ENCRYPTION_KEY: '680f22ad4022b0750e8255f58b180237a9396f7737f644c56f9f0d323d80c39b'
    }
  }]
};
