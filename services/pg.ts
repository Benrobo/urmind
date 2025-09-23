// import { PGliteWorker, worker } from "@electric-sql/pglite/worker";
// import { PGlite } from "@electric-sql/pglite";
// // @ts-ignore
// import { vector } from "@electric-sql/pglite/vector";

// let db: PGliteWorker | null = null;
// const getDb = async () => {
//   if (!db) {
//     db = new PGliteWorker("idb://urmind-pg-db", {
//       extensions: {
//         vector,
//       },
//     });
//     await db.waitReady;
//   }
//   return db;
// };

// export const initSchema = async () => {
//   const database = await getDb();
//   await database.exec(`
//     CREATE TABLE IF NOT EXISTS todos (
//       id SERIAL PRIMARY KEY,
//       task TEXT NOT NULL,
//       done BOOLEAN NOT NULL DEFAULT false
//     );
//   `);
// };
