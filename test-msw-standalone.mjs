// Simple standalone MSW test script
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Create a simple handler for testing
const handlers = [
  http.get('http://localhost:3000/api/health', () => {
    console.log('🎯 MSW intercepted /api/health request!');
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      source: 'MSW Mock Server',
      message: 'MSW is working correctly!'
    });
  }),
  
  http.get('http://localhost:3000/api/test', () => {
    console.log('🎯 MSW intercepted /api/test request!');
    return HttpResponse.json({
      message: 'Hello from MSW!',
      data: { foo: 'bar' }
    });
  })
];

// Create and start the MSW server
const server = setupServer(...handlers);

console.log('🚀 Starting MSW server...');
server.listen({
  onUnhandledRequest: 'warn'
});

console.log('✅ MSW server is running and ready to intercept requests!');
console.log('📝 Try these commands in another terminal:');
console.log('   curl http://localhost:3000/api/health');
console.log('   curl http://localhost:3000/api/test');
console.log('');
console.log('Press Ctrl+C to stop the server');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping MSW server...');
  server.close();
  console.log('✅ MSW server stopped');
  process.exit(0);
});

// Make a test request from within the same process to verify it works
setTimeout(async () => {
  console.log('\n🧪 Testing MSW from within the same process...');
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('✅ Internal test successful:', data);
  } catch (error) {
    console.log('❌ Internal test failed:', error.message);
  }
}, 1000);
