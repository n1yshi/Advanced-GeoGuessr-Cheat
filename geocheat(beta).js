let globalCoordinates = {
    lat: 0,
    lng: 0
}

let embeddedMapContainer = null;
let overlayMarker = null;

// Intercept Google Street View API calls to get coordinates
var originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
    if (method.toUpperCase() === 'POST' &&
        (url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') ||
            url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch'))) {

        this.addEventListener('load', function () {
            let interceptedResult = this.responseText
            const pattern = /-?\d+\.\d+,-?\d+\.\d+/g;
            let match = interceptedResult.match(pattern)[0];
            let split = match.split(",")

            let lat = Number.parseFloat(split[0])
            let lng = Number.parseFloat(split[1])

            globalCoordinates.lat = lat
            globalCoordinates.lng = lng
            
            // Update embedded map with new coordinates
            updateEmbeddedMap(lat, lng);
            
            // Remove old overlay marker for new round
            removeOverlayMarker();
        });
    }
    return originalOpen.apply(this, arguments);
};

// ====================================Overlay Marker====================================

function createOverlayMarker() {
    const {lat, lng} = globalCoordinates;
    if (!lat || !lng) {
        updateStatus("❌ Keine Koordinaten verfügbar");
        return;
    }

    // Find the map canvas
    let mapCanvas = document.querySelectorAll('[class^="guess-map_canvas__"]')[0];
    if (!mapCanvas) {
        // Try streaks mode
        mapCanvas = document.getElementsByClassName("region-map_mapCanvas__0dWlf")[0];
    }
    
    if (!mapCanvas) {
        updateStatus("❌ Karte nicht gefunden");
        return;
    }

    // Remove existing overlay marker
    removeOverlayMarker();

    // Get map bounds and convert lat/lng to pixel position
    const mapPosition = getMapPixelPosition(lat, lng, mapCanvas);
    if (!mapPosition) {
        updateStatus("❌ Position konnte nicht berechnet werden");
        return;
    }

    // Create overlay marker element
    overlayMarker = document.createElement('div');
    overlayMarker.id = 'geoguessr-overlay-marker';
    overlayMarker.style.cssText = `
        position: absolute;
        left: ${mapPosition.x - 15}px;
        top: ${mapPosition.y - 30}px;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle, #ff0000 0%, #ff0000 40%, transparent 40%);
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        animation: pulse 2s infinite;
    `;

    // Add pulsing animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: rotate(-45deg) scale(1); opacity: 1; }
            50% { transform: rotate(-45deg) scale(1.2); opacity: 0.7; }
            100% { transform: rotate(-45deg) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Add marker to map container
    const mapContainer = mapCanvas.parentElement;
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(overlayMarker);

    updateStatus(`✅ Overlay-Marker gesetzt bei ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
}

function removeOverlayMarker() {
    if (overlayMarker) {
        overlayMarker.remove();
        overlayMarker = null;
    }
}

function getMapPixelPosition(lat, lng, mapCanvas) {
    try {
        // Get the React fiber to access map instance
        const reactKeys = Object.keys(mapCanvas);
        const reactKey = reactKeys.find(key => key.startsWith("__reactFiber$"));
        const elementProps = mapCanvas[reactKey];
        
        // Try to get map instance
        let mapInstance = null;
        try {
            mapInstance = elementProps.return.return.memoizedProps.map;
        } catch (e) {
            // Alternative path for different React structure
            try {
                mapInstance = elementProps.return.memoizedProps.map;
            } catch (e2) {
                console.log("Could not access map instance");
                return null;
            }
        }

        if (mapInstance && mapInstance.getProjection) {
            const projection = mapInstance.getProjection();
            const bounds = mapInstance.getBounds();
            const zoom = mapInstance.getZoom();
            
            // Convert lat/lng to pixel coordinates
            const scale = Math.pow(2, zoom);
            const worldCoordinate = {
                x: (lng + 180) / 360 * 256 * scale,
                y: (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 256 * scale
            };

            const mapRect = mapCanvas.getBoundingClientRect();
            const mapCenter = mapInstance.getCenter();
            const mapCenterWorldCoord = {
                x: (mapCenter.lng() + 180) / 360 * 256 * scale,
                y: (1 - Math.log(Math.tan(mapCenter.lat() * Math.PI / 180) + 1 / Math.cos(mapCenter.lat() * Math.PI / 180)) / Math.PI) / 2 * 256 * scale
            };

            const pixelX = (worldCoordinate.x - mapCenterWorldCoord.x) + mapRect.width / 2;
            const pixelY = (worldCoordinate.y - mapCenterWorldCoord.y) + mapRect.height / 2;

            return { x: pixelX, y: pixelY };
        }
    } catch (error) {
        console.log("Error calculating pixel position:", error);
    }

    // Fallback: simple approximation
    const mapRect = mapCanvas.getBoundingClientRect();
    return {
        x: mapRect.width / 2,
        y: mapRect.height / 2
    };
}

// ====================================Embedded Map====================================

function createEmbeddedMap() {
    if (embeddedMapContainer) {
        embeddedMapContainer.remove();
    }

    embeddedMapContainer = document.createElement('div');
    embeddedMapContainer.id = 'embedded-helper-map';
    embeddedMapContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        width: 400px;
        height: 320px;
        background: white;
        border: 3px solid #333;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: #333;
        color: white;
        padding: 8px 12px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    header.innerHTML = `
        <span>🗺️ Korrekte Position</span>
        <div>
            <button id="toggle-map-size" style="background: #555; color: white; border: none; padding: 4px 8px; margin-right: 5px; border-radius: 3px; cursor: pointer;">↔</button>
            <button id="close-map" style="background: #d32f2f; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">✕</button>
        </div>
    `;

    // Status display
    const statusDiv = document.createElement('div');
    statusDiv.id = 'marker-status';
    statusDiv.style.cssText = `
        background: #f0f0f0;
        padding: 5px 12px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        border-bottom: 1px solid #ddd;
    `;
    statusDiv.textContent = 'Bereit...';

    // Map container
    const mapContainer = document.createElement('div');
    mapContainer.id = 'helper-map-container';
    mapContainer.style.cssText = `
        width: 100%;
        height: calc(100% - 60px);
        background: #f0f0f0;
        position: relative;
    `;

    embeddedMapContainer.appendChild(header);
    embeddedMapContainer.appendChild(statusDiv);
    embeddedMapContainer.appendChild(mapContainer);
    document.body.appendChild(embeddedMapContainer);

    // Event listeners
    document.getElementById('close-map').addEventListener('click', () => {
        embeddedMapContainer.style.display = 'none';
    });

    let isLarge = false;
    document.getElementById('toggle-map-size').addEventListener('click', () => {
        if (isLarge) {
            embeddedMapContainer.style.width = '400px';
            embeddedMapContainer.style.height = '320px';
        } else {
            embeddedMapContainer.style.width = '600px';
            embeddedMapContainer.style.height = '470px';
        }
        isLarge = !isLarge;
    });

    makeDraggable(embeddedMapContainer, header);
    return embeddedMapContainer;
}

function updateEmbeddedMap(lat, lng) {
    if (!embeddedMapContainer) {
        createEmbeddedMap();
    }

    const mapContainer = document.getElementById('helper-map-container');
    if (mapContainer && lat && lng) {
        embeddedMapContainer.style.display = 'block';
        
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;

        mapContainer.innerHTML = `
            <iframe 
                src="${mapUrl}" 
                style="width: 100%; height: 100%; border: none;"
                frameborder="0">
            </iframe>
        `;
        
        const header = embeddedMapContainer.querySelector('div');
        const coordSpan = header.querySelector('span');
        coordSpan.innerHTML = `🗺️ ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

function updateStatus(message) {
    const statusDiv = document.getElementById('marker-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.style.background = message.includes('✅') ? '#d4edda' : 
                                   message.includes('❌') ? '#f8d7da' : '#f0f0f0';
    }
}

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;
    handle.style.cursor = 'move';

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function toggleEmbeddedMap() {
    if (!embeddedMapContainer) {
        createEmbeddedMap();
        if (globalCoordinates.lat && globalCoordinates.lng) {
            updateEmbeddedMap(globalCoordinates.lat, globalCoordinates.lng);
        }
    } else {
        embeddedMapContainer.style.display = 
            embeddedMapContainer.style.display === 'none' ? 'block' : 'none';
    }
}

function openInGoogleMaps() {
    const {lat, lng} = globalCoordinates;
    if (!lat || !lng) {
        alert('Keine Koordinaten verfügbar!');
        return;
    }
    window.open(`https://www.google.com/maps/@${lat},${lng},15z`, '_blank');
}

// Remove cheat detection scripts
const scripts = document.querySelectorAll('script');
scripts.forEach(script => {
    if (script.id === "google-maps-cheat-detection-script") {
        script.remove()
    }
});

// Key event handler
let onKeyDown = (e) => {
    if (e.keyCode === 49) { // Key 1 - Toggle embedded map
        e.stopImmediatePropagation();
        toggleEmbeddedMap();
    }
    if (e.keyCode === 50) { // Key 2 - Show overlay marker on map
        e.stopImmediatePropagation();
        createOverlayMarker();
    }
    if (e.keyCode === 51) { // Key 3 - Hide overlay marker
        e.stopImmediatePropagation();
        removeOverlayMarker();
        updateStatus("🙈 Overlay-Marker entfernt");
    }
    if (e.keyCode === 52) { // Key 4 - Open in Google Maps
        e.stopImmediatePropagation();
        openInGoogleMaps();
    }
    if (e.keyCode === 53) { // Key 5 - Copy coordinates
        e.stopImmediatePropagation();
        copyCoordinates();
    }
}

// Copy coordinates to clipboard
function copyCoordinates() {
    const {lat, lng} = globalCoordinates;
    if (!lat || !lng) {
        updateStatus("❌ Keine Koordinaten verfügbar");
        return;
    }
    
    const coordText = `${lat}, ${lng}`;
    navigator.clipboard.writeText(coordText).then(() => {
        updateStatus(`📋 Koordinaten kopiert: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }).catch(() => {
        // Fallback if clipboard API doesn't work
        prompt("Koordinaten (Strg+C zum Kopieren):", coordText);
        updateStatus("📋 Koordinaten angezeigt");
    });
}

document.addEventListener("keydown", onKeyDown);

// Auto-create map after page load
setTimeout(() => {
    createEmbeddedMap();
}, 3000);

// Update overlay marker position when map moves/zooms
let lastMapUpdate = 0;
setInterval(() => {
    if (overlayMarker && globalCoordinates.lat && globalCoordinates.lng) {
        const now = Date.now();
        if (now - lastMapUpdate > 1000) { // Update max once per second
            const mapCanvas = document.querySelectorAll('[class^="guess-map_canvas__"]')[0] || 
                            document.getElementsByClassName("region-map_mapCanvas__0dWlf")[0];
            
            if (mapCanvas) {
                const newPosition = getMapPixelPosition(globalCoordinates.lat, globalCoordinates.lng, mapCanvas);
                if (newPosition) {
                    overlayMarker.style.left = `${newPosition.x - 15}px`;
                    overlayMarker.style.top = `${newPosition.y - 30}px`;
                }
            }
            lastMapUpdate = now;
        }
    }

}, 500);

