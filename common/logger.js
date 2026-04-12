const log = {
  info: (tag, message) => {
    console.log(`[${new Date().toISOString()}] [${tag}] ${message}`);
  },
  error: (tag, message) => {
    console.error(`[${new Date().toISOString()}] [${tag}] ERROR: ${message}`);
  }
};

module.exports = log;
