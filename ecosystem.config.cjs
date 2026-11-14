module.exports = {
    apps: [
        {
            name: "myhpp-server",
            cwd: "./server",
            script: "src/index.ts",
            interpreter: "bun",
            exec_mode: "fork",
            instances: 1,
            autorestart: true,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
