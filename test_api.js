async function testLogin() {
  const r1 = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bv_lay_001', password: 'pass12026' })
  });
  console.log('bv_lay_001 response:', await r1.json());

  const r2 = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'salama', password: 'electorale@1475963' })
  });
  console.log('salama response:', await r2.json());
}

testLogin();
