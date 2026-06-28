const fetch = require('node-fetch'); // wait node 22 has built in fetch
async function test() {
  const centerLat = 28.6139;
  const centerLng = 77.2090;
  const radius = 5000;
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="veterinary"](around:${radius},${centerLat},${centerLng});
      node["amenity"="animal_shelter"](around:${radius},${centerLat},${centerLng});
      node["animal_boarding"](around:${radius},${centerLat},${centerLng});
    );
    out body;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    const data = await res.json();
    console.log(data.elements.length);
  } catch (err) {
    console.error(err);
  }
}
test();
