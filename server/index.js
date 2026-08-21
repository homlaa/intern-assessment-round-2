const { createDb } = require("./db");
const { createApp } = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
  const db = await createDb();
  const app = createApp(db);

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
