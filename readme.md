A simple promise based function repeater.

**Example**

```typescript
import { repeat } from '@stater/repeat';

// Repeat console log 10 times.
repeat(console.log).repeat(10);

// Repeat console log until finished = true.
let finished = false;
repeat(rt => {
  console.log(rt);

  if (rt >= 10) {
    finished = true;
  }
}).every('5s').until(() => finished);

// Run maintenance checker every 5s.
let complete = false;
await repeat(async (rt) => {
  console.log(`[Retries: ${rt}] Checking maintenance state.`);
  complete = await server.checkMaintenance();
}).every('5s').until(complete);
console.log('Server maintenance completed!');
```
