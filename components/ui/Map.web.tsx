import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

export default function MapView({ style, initialRegion, region, onRegionChangeComplete, children }: any) {
    const [LeafletMap, setLeafletMap] = useState<any>(null);
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsBrowser(true);

            // Dynamic imports to avoid 'window is not defined' during bundling/SSR
            const L = require('leaflet');
            const ReactLeaflet = require('react-leaflet');

            // Inject Leaflet CSS
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            // Fix for default marker icons
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            setLeafletMap({ L, ...ReactLeaflet });
        }
    }, []);

    if (!isBrowser || !LeafletMap) {
        return (
            <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }]}>
                <ActivityIndicator color="#0047AB" />
            </View>
        );
    }

    const { MapContainer, TileLayer, Marker: LeafletMarker, useMapEvents } = LeafletMap;

    // Internal component to handle map events and sync with parent
    const MapEvents = ({ onRegionChangeComplete }: { onRegionChangeComplete?: (region: Region) => void }) => {
        const map = useMapEvents({
            moveend: () => {
                if (onRegionChangeComplete) {
                    const center = map.getCenter();
                    const zoom = map.getZoom();
                    // Rough conversion of zoom to delta
                    const delta = 0.1 / Math.pow(2, zoom - 10);
                    onRegionChangeComplete({
                        latitude: center.lat,
                        longitude: center.lng,
                        latitudeDelta: delta,
                        longitudeDelta: delta,
                    });
                }
            },
        });
        return null;
    };

    const currentRegion = region || initialRegion;
    const center: [number, number] = [currentRegion.latitude, currentRegion.longitude];
    // Zoom 14 is roughly standard for a street view
    const zoom = 14;

    return (
        <View style={style}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents onRegionChangeComplete={onRegionChangeComplete} />
                {children}
            </MapContainer>
        </View>
    );
}

export const Marker = ({ coordinate, draggable, onDragEnd }: any) => {
    const [LeafletComponents, setLeafletComponents] = useState<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            const { Marker: LeafletMarker } = require('react-leaflet');
            setLeafletComponents({ L, LeafletMarker });
        }
    }, []);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null && onDragEnd) {
                    const latLng = marker.getLatLng();
                    onDragEnd({
                        nativeEvent: {
                            coordinate: {
                                latitude: latLng.lat,
                                longitude: latLng.lng,
                            },
                        },
                    });
                }
            },
        }),
        [onDragEnd],
    );

    if (!LeafletComponents) return null;

    const { LeafletMarker } = LeafletComponents;

    return (
        <LeafletMarker
            draggable={draggable}
            eventHandlers={eventHandlers}
            position={[coordinate.latitude, coordinate.longitude]}
            ref={markerRef}
        />
    );
};
