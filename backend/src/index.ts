console.log("--- MINIMAL TEST START ---");
console.log(`Node.js version: ${process.version}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`HOST: ${process.env.HOST}`);
console.log("This is a minimal test to see if any code executes.");
console.log("The process will be kept alive for 5 minutes.");

// Keep the process alive for 5 minutes to allow the TCP probe to pass
// and to give us time to inspect the logs.
setTimeout(() => {
  console.log("--- MINIMAL TEST END ---");
}, 300000);
