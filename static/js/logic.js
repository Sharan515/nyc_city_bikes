// URLs for Citi Bike station info and status
const infoUrl = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';
const statusUrl = 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json';

// Create map with layer groups
function createMap(layers) {
  const myMap = L.map("map-id", {
    center: [40.73, -74.0059],
    zoom: 13,
    layers: [
      layers.Healthy,
      layers.Low,
      layers.Empty,
      layers.OutOfOrder,
      layers.ComingSoon
    ]
  });

  // Add base tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
  }).addTo(myMap);

  // Add layer control
  const overlayMaps = {
    "Healthy Stations": layers.Healthy,
    "Low Stations": layers.Low,
    "Empty Stations": layers.Empty,
    "Out of Order": layers.OutOfOrder,
    "Coming Soon": layers.ComingSoon
  };
  L.control.layers(null, overlayMaps, { collapsed: false }).addTo(myMap);

  // Add legend
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    div.innerHTML += `<i class="fa fa-bicycle" style="color:green"></i> Healthy<br>`;
    div.innerHTML += `<i class="fa fa-bicycle" style="color:orange"></i> Low<br>`;
    div.innerHTML += `<i class="fa fa-bicycle" style="color:red"></i> Empty<br>`;
    div.innerHTML += `<i class="fa fa-tools" style="color:gray"></i> Out of Order<br>`;
    div.innerHTML += `<i class="fa fa-clock" style="color:blue"></i> Coming Soon<br>`;
    return div;
  };
  legend.addTo(myMap);
}

// Generate custom marker icon
function createIcon(color, iconClass) {
  return L.divIcon({
    className: 'custom-icon',
    html: `<i class="fa ${iconClass}" style="color:${color};font-size:18px;"></i>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -20]
  });
}

// Fetch and process data
function createMarkers(infoData, statusData) {
  const infoMap = {};
  infoData.data.stations.forEach(station => {
    infoMap[station.station_id] = station;
  });

  const layers = {
    Healthy: [],
    Low: [],
    Empty: [],
    OutOfOrder: [],
    ComingSoon: []
  };

  statusData.data.stations.forEach(status => {
    const info = infoMap[status.station_id];
    if (!info) return;

    const popup = `<strong>${info.name}</strong><br>Capacity: ${info.capacity}<br>Bikes: ${status.num_bikes_available}`;
    let icon, layerName;

    if (!status.is_installed) {
      icon = createIcon('blue', 'fa-clock');
      layerName = 'ComingSoon';
    } else if (!status.is_renting) {
      icon = createIcon('gray', 'fa-tools');
      layerName = 'OutOfOrder';
    } else if (status.num_bikes_available === 0) {
      icon = createIcon('red', 'fa-bicycle');
      layerName = 'Empty';
    } else if (status.num_bikes_available < 5) {
      icon = createIcon('orange', 'fa-bicycle');
      layerName = 'Low';
    } else {
      icon = createIcon('green', 'fa-bicycle');
      layerName = 'Healthy';
    }

    const marker = L.marker([info.lat, info.lon], { icon }).bindPopup(popup);
    layers[layerName].push(marker);
  });

  // Convert arrays to LayerGroups
  Object.keys(layers).forEach(key => {
    layers[key] = L.layerGroup(layers[key]);
  });

  createMap(layers);
}

// Load FontAwesome (for icons) if not already present
if (!document.querySelector('link[href*="font-awesome"]')) {
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  document.head.appendChild(fontAwesome);
}

// Fetch both API datasets and kick off rendering
Promise.all([
  d3.json(infoUrl),
  d3.json(statusUrl)
]).then(([info, status]) => {
  createMarkers(info, status);
});
