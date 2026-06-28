async function test() {
  const query = `[out:json][timeout:15];(node["amenity"="veterinary"](around:5000,28.6139,77.2090);node["amenity"="animal_shelter"](around:5000,28.6139,77.2090););out body;`;
  const params = new URLSearchParams();
  params.append('data', query);
  
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PawRescueApp/1.0 (contact@example.com)'
      },
      body: params.toString()
    });
    const data = await res.json();
    console.log("SUCCESS:", data.elements.length);
  } catch (err) {
    console.error(err);
  }
}
test();
