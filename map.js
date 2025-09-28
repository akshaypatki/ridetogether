// Map Module

const MapModule = {
    // Initialize main dashboard map
    initialize(containerId) {
        Utils.log('Initializing map');
        
        const container = document.getElementById(containerId);
        if (!container) {
            Utils.log('Map container not found:', containerId);
            return;
        }
        
        try {
            // Use user location or default
            const center = AppState.userLocation || APP_CONFIG.DEFAULT_LOCATION;
            
            AppState.map = new mapboxgl.Map({
                container: containerId,
                style: APP_CONFIG.MAP_STYLE,
                center: center,
                zoom: 12
            });

            // Add navigation controls
            AppState.map.addControl(new mapboxgl.NavigationControl());
            
            // Add user location marker
            if (AppState.userLocation) {
                this.addUserMarker(AppState.userLocation);
            }
            
            // Load nearby trails when map is ready
            AppState.map.on('load', () => {
                Utils.log('Map loaded successfully');
                this.loadNearbyTrails();
            });
            
            // Handle map errors
            AppState.map.on('error', (e) => {
                Utils.log('Map error:', e);
                this.showMapError(containerId);
            });
            
        } catch (error) {
            Utils.log('Failed to initialize map:', error);
            this.showMapError(containerId);
        }
    },

    // Initialize trails page map
    initializeTrailsMap(containerId) {
        Utils.log('Initializing trails map');
        
        const container = document.getElementById(containerId);
        if (!container) {
            Utils.log('Trails map container not found');
            return;
        }
        
        try {
            const center = AppState.userLocation || APP_CONFIG.DEFAULT_LOCATION;
            
            const trailsMap = new mapboxgl.Map({
                container: containerId,
                style: 'mapbox://styles/mapbox/outdoors-v12', // Outdoor style for trails
                center: center,
                zoom: 11
            });
            
            // Add controls
            trailsMap.addControl(new mapboxgl.NavigationControl());
            trailsMap.addControl(new mapboxgl.ScaleControl());
            
            // Add fullscreen control
            trailsMap.addControl(new mapboxgl.FullscreenControl());
            
            // Add user location control
            trailsMap.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true,
                    showUserHeading: true
                })
            );
            
            // Load trails when map is ready
            trailsMap.on('load', () => {
                this.loadTrailsData(trailsMap);
            });
            
        } catch (error) {
            Utils.log('Failed to initialize trails map:', error);
            this.showMapError(containerId);
        }
    },

    // Add user location marker
    addUserMarker(coordinates) {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.cssText = `
            width: 20px;
            height: 20px;
            background: var(--primary);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .addTo(AppState.map);
    },

    // Load nearby trails
    loadNearbyTrails() {
        // Demo trails data - in production, this would come from an API
        const trails = [
            {
                name: 'Pacific Coast Trail',
                coordinates: [-122.5194, 37.8272],
                distance: '28 miles',
                difficulty: 'moderate',
                elevation: '1,200 ft',
                description: 'Beautiful coastal views with rolling hills'
            },
            {
                name: 'Mountain Ridge Loop',
                coordinates: [-122.2638, 37.8716],
                distance: '15 miles',
                difficulty: 'hard',
                elevation: '2,500 ft',
                description: 'Challenging climbs with rewarding vistas'
            },
            {
                name: 'River Valley Path',
                coordinates: [-122.0838, 37.3861],
                distance: '12 miles',
                difficulty: 'easy',
                elevation: '300 ft',
                description: 'Family friendly path along the river'
            },
            {
                name: 'Redwood Forest Trail',
                coordinates: [-122.1441, 37.4419],
                distance: '8 miles',
                difficulty: 'moderate',
                elevation: '800 ft',
                description: 'Shaded trail through ancient redwoods'
            },
            {
                name: 'Lake Loop Trail',
                coordinates: [-121.9886, 37.4092],
                distance: '5 miles',
                difficulty: 'easy',
                elevation: '150 ft',
                description: 'Scenic loop around the reservoir'
            }
        ];
        
        // Add trail markers
        trails.forEach(trail => {
            this.addTrailMarker(trail, AppState.map);
        });
        
        // Update suggested trails sidebar
        this.updateSuggestedTrails(trails);
    },

    // Load trails data for trails page
    loadTrailsData(map) {
        // More comprehensive trails data
        const trails = [
            {
                name: 'Bay Area Ridge Trail',
                coordinates: [-122.2547, 37.8924],
                distance: '550 miles',
                difficulty: 'hard',
                type: 'ridge',
                description: 'Multi-use trail circling the San Francisco Bay'
            },
            {
                name: 'Iron Horse Regional Trail',
                coordinates: [-122.0689, 37.3688],
                distance: '32 miles',
                difficulty: 'easy',
                type: 'rail-trail',
                description: 'Paved multi-use trail perfect for all skill levels'
            },
            {
                name: 'Mount Diablo Summit',
                coordinates: [-121.9146, 37.8816],
                distance: '13 miles',
                difficulty: 'hard',
                type: 'mountain',
                description: 'Challenging climb to 3,849 ft summit'
            },
            // Add more trails...
        ];
        
        // Add source for trails
        map.addSource('trails', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: trails.map(trail => ({
                    type: 'Feature',
                    properties: trail,
                    geometry: {
                        type: 'Point',
                        coordinates: trail.coordinates
                    }
                }))
            }
        });
        
        // Add layer for trail markers
        map.addLayer({
            id: 'trail-markers',
            type: 'circle',
            source: 'trails',
            paint: {
                'circle-radius': 8,
                'circle-color': [
                    'match',
                    ['get', 'difficulty'],
                    'easy', '#10b981',
                    'moderate', '#f59e0b',
                    'hard', '#ef4444',
                    '#2563eb'
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
            }
        });
        
        // Add trail labels
        map.addLayer({
            id: 'trail-labels',
            type: 'symbol',
            source: 'trails',
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 1.5],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#0f172a',
                'text-halo-width': 1
            }
        });
        
        // Add click interaction
        map.on('click', 'trail-markers', (e) => {
            const trail = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="padding: 10px;">
                        <h3 style="margin: 0 0 10px 0;">${trail.name}</h3>
                        <p style="margin: 5px 0;"><strong>Distance:</strong> ${trail.distance}</p>
                        <p style="margin: 5px 0;"><strong>Difficulty:</strong> ${trail.difficulty}</p>
                        <p style="margin: 5px 0;">${trail.description}</p>
                        <button class="btn-primary" style="margin-top: 10px; padding: 8px 16px; font-size: 14px;" 
                                onclick="MapModule.planRide('${trail.name}')">
                            Plan a Ride Here
                        </button>
                    </div>
                `)
                .addTo(map);
        });
        
        // Change cursor on hover
        map.on('mouseenter', 'trail-markers', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'trail-markers', () => {
            map.getCanvas().style.cursor = '';
        });
    },

    // Add trail marker to map
    addTrailMarker(trail, map) {
        const el = document.createElement('div');
        el.className = 'trail-marker';
        el.style.cssText = `
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            transition: all 0.2s ease;
        `;
        
        // Set color based on difficulty
        const colors = {
            easy: '#10b981',
            moderate: '#f59e0b',
            hard: '#ef4444'
        };
        
        el.style.background = colors[trail.difficulty] || '#2563eb';
        el.innerHTML = trail.distance.split(' ')[0];
        
        const marker = new mapboxgl.Marker(el)
            .setLngLat(trail.coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                    <div style="padding: 10px;">
                        <h4 style="margin: 0 0 10px 0;">${trail.name}</h4>
                        <p style="margin: 5px 0;">${trail.description}</p>
                        <p style="margin: 5px 0;"><strong>${trail.distance}</strong> • ${trail.difficulty}</p>
                        ${trail.elevation ? `<p style="margin: 5px 0;">Elevation gain: ${trail.elevation}</p>` : ''}
                    </div>
                `))
            .addTo(map);
        
        el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.2)';
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
        });
    },

    // Update suggested trails in sidebar
    updateSuggestedTrails(trails) {
        const container = document.getElementById('suggestedTrails');
        if (!container) return;
        
        container.innerHTML = trails.slice(0, 3).map(trail => `
            <div class="trail-card" onclick="MapModule.focusTrail([${trail.coordinates}])">
                <h4>${trail.name}</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0.5rem 0;">
                    ${trail.description} • ${trail.distance}
                </p>
                <span class="trail-difficulty difficulty-${trail.difficulty}">
                    ${trail.difficulty}
                </span>
            </div>
        `).join('');
    },

    // Focus map on specific trail
    focusTrail(coordinates) {
        if (AppState.map) {
            AppState.map.flyTo({
                center: coordinates,
                zoom: 14,
                duration: 1500
            });
        }
    },

    // Plan ride at specific trail
    planRide(trailName) {
        // Navigate to dashboard and pre-fill the trail type
        App.navigateTo('dashboard');
        Utils.showNotification(`Planning ride at ${trailName}`, 'info');
    },

    // Show map error message
    showMapError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="map-error">
                    <svg width="100" height="100" fill="currentColor" opacity="0.2" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <p>Map could not load</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check your internet connection</p>
                </div>
            `;
        }
    },

    // Get directions between two points
    async getDirections(start, end) {
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?` +
                `alternatives=true&geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`
            );
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                return data.routes[0];
            }
            
            return null;
        } catch (error) {
            Utils.log('Error getting directions:', error);
            return null;
        }
    },

    // Draw route on map
    drawRoute(map, route) {
        // Remove existing route if any
        if (map.getSource('route')) {
            map.removeLayer('route');
            map.removeSource('route');
        }
        
        // Add route to map
        map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry
            }
        });
        
        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#2563eb',
                'line-width': 5,
                'line-opacity': 0.75
            }
        });
    },

    // Center map on user location
    centerOnUser() {
        if (AppState.map && AppState.userLocation) {
            AppState.map.flyTo({
                center: AppState.userLocation,
                zoom: 13
            });
        }
    },

    // Toggle map style
    toggleStyle() {
        if (AppState.map) {
            const currentStyle = AppState.map.getStyle().name;
            const newStyle = currentStyle.includes('dark') 
                ? 'mapbox://styles/mapbox/light-v11'
                : 'mapbox://styles/mapbox/dark-v11';
            
            AppState.map.setStyle(newStyle);
        }
    }
};