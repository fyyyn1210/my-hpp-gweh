const path = require("path");

const serverDir = path.join(__dirname, "server");

module.exports = {
    apps: [
        {
            name: "myhpp-server",
            cwd: serverDir,
            script: "bun",
            args: `--env-file=${path.join(serverDir, ".env")} src/index.ts`,
            interpreter: "none",
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
