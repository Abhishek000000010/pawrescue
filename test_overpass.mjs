async function test() {
  const centerLat = 28.6139;
  const centerLng = 77.2090;
  const radius = 5000;
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="veterinary"](around:${radius},${centerLat},${centerLng});
      node["amenity"="animal_shelter"](around:${radius},${centerLat},${centerLng});
    );
    out body;
  `;
  try {
    const url = 'https://overpass-api.de/api/interpreter';
    const params = new URLSearchParams();
    params.append('data', query);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const text = await res.text();
    console.log("Response starts with:", text.substring(0, 100));
  } catch (err) {
    console.error(err);
  }
}
test();
