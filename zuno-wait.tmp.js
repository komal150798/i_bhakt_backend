const { Client } = require('pg');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const passwords = ['postgres', 'admin', 'root', '', 'Password@123', '1234', 'Admin@123'];

(async () => {
  const deadline = Date.now() + 15 * 60 * 1000; // 15 minutes
  let lastState = '';
  while (Date.now() < deadline) {
    for (const password of passwords) {
      const c = new Client({ host: 'localhost', port: 5432, user: 'postgres',
                             password, database: 'postgres',
                             connectionTimeoutMillis: 4000 });
      try {
        await c.connect();
        const dbs = await c.query(
          "select datname from pg_database where datistemplate=false order by datname");
        console.log('DB_UP');
        console.log('WORKING_PASSWORD=' + (password === '' ? '<empty>' : password));
        console.log('DATABASES=' + dbs.rows.map(r => r.datname).join(','));
        await c.end();
        process.exit(0);
      } catch (e) {
        try { await c.end(); } catch {}
        if (/recovery mode|starting up/i.test(e.message)) {
          if (lastState !== 'recovering') { console.log('...still in recovery'); lastState = 'recovering'; }
          break;
        }
        if (/ECONNREFUSED/i.test(e.message)) {
          if (lastState !== 'down') { console.log('...server down (restarting?)'); lastState = 'down'; }
          break;
        }
        if (/password|authentication/i.test(e.message)) continue; // try next password
        if (lastState !== e.message) { console.log('...' + e.message); lastState = e.message; }
        break;
      }
    }
    await wait(5000);
  }
  console.log('TIMEOUT: database never became reachable');
  process.exit(1);
})();
