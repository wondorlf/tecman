module.exports = {
  apps: [
    {
      name: 'tecman-backend',
      script: 'npm',
      args: 'run start',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        watch: true,
        script_args: 'run dev',
      },
    },
    {
      name: 'tecman-frontend',
      script: 'npm',
      args: 'run start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        script_args: 'run dev',
      },
    },
  ],
};
