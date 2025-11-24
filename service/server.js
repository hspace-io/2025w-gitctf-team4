require('dotenv').config();

const config = require('./config/config');
const app = require('./app');

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 ${config.serviceName} server running on http://localhost:${PORT} (${config.env})`,
  );
});
