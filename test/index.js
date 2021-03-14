const { repeat } = require('../dist');

const run = async () => {
  await repeat(console.log).repeat(10);
  await repeat(console.log).every('1s').repeat(10);

  let finish = false;
  await repeat(rt => {
    console.log(rt);
    if (rt >= 10) {
      finish = true;
    }
  }).every('1s').until(() => finish);

  const r = repeat(console.log).every(500).infinite();
  setTimeout(() => r.stop(), 5000);
}

run();
