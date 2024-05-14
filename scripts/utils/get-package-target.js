const os = require('os');

module.exports = () => {
  const platform = os.platform(); // "darwin", "win32" or "linux"
  const arch = os.arch(); // "x64", "arm", "arm64", etc.

  // darwin-arm64, win32-x64, ...
  return `${platform}-${arch}`;
};
