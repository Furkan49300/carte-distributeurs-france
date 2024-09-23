let allDistributeurs = [];

/// Function to parse the zones from distributor data
function parseZone(zone) {
    return zone.split(' - ').flatMap(z => z.split(' '));
}

// Function to find and group overlapping zones
function findOverlappingZones(distributors) {
    let zoneMap = new Map();
    distributors.forEach(distributor => {
        parseZone(distributor.Zone).forEach(zone => {
            if (!zoneMap.has(zone)) {
                zoneMap.set(zone, []);
            }
            zoneMap.get(zone).push(distributor);
        });
    });
    return zoneMap;
}

document.addEventListener('DOMContentLoaded', function () {
    var mymap = L.map('mapid').setView([46.2276, 2.2137], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(mymap);

    fetch('data.json')
        .then(response => response.json())
        .then(distributors => {
            const zoneMap = findOverlappingZones(distributors);
            fetch('regions.geojson')
                .then(response => response.json())
                .then(geojsonData => {
                    L.geoJson(geojsonData, {
                        onEachFeature: onEachFeature(distributors, zoneMap),
                        style: function (feature) {
                            const departmentCode = feature.properties.code.padStart(2, '0');
                            let hasDistributor = zoneMap.has(departmentCode);
                            return {
                                color: 'white',
                                weight: 2,
                                opacity: 1,
                                fillOpacity: hasDistributor ? 0.3 : 0.3, // Reduced opacity for areas without distributors
                                fillColor: hasDistributor ? (zoneMap.get(departmentCode).length > 1 ? 'blue' : 'green') : '#004899'
                            };
                        }

                    }).addTo(mymap);
                });
        });
});

function onEachFeature(distributors, zoneMap) {
    return function (feature, layer) {
        const departmentCode = feature.properties.code.padStart(2, '0');
        const distributorsInZone = zoneMap.get(departmentCode);

        if (distributorsInZone) {
            let popupContent = '<b>Distributors:</b><br><br>';
            distributorsInZone.forEach(d => {
                popupContent += `<b>${d.Distributeur}</b><br> Products : ${d.Produit}<br>
            Address: ${d.Adresse}<br>
            Responsible: ${d.Responsable}<br>
            Email: <a href="mailto:${d.mail}">${d.mail}</a><br>
            Phone: ${d.Téléphone}<br><br>`;
            });
            layer.bindPopup(popupContent);
        }


        layer.on({
            mouseover: function (e) {
                var layer = e.target;
                layer.setStyle({
                    fillOpacity: 1  // Increase opacity on hover
                });
            },
            mouseout: function (e) {
                var layer = e.target;
                layer.setStyle({
                    fillOpacity: 0.3  // Return to lower opacity on mouse out
                });
            }
        });
    }
};