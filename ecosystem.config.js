module.exports = {
  apps : [{
    name: "my-app",
    script: "./server.js",
    watch: false,
    instances: 1,
    ignore_watch: ["node_modules", "logs", "public/uploads"],
    watch_options: {
      "followSymlinks": false
    },
    env: {
      NODE_ENV: "production",
      PORT: 80
    },
    max_memory_restart: "300M",
    wait_ready: true,
    listen_timeout: 10000
  }]
}
