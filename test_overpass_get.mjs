async function test() {
  const query = `[out:json][timeout:15];(node["amenity"="veterinary"](around:5000,28.6139,77.2090);node["amenity"="animal_shelter"](around:5000,28.6139,77.2090););out body;`;
  
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter`, {
      method: 'POST',
      body: query
    });
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
test();
