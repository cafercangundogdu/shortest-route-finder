import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Marker, Popup, MapContainer, TileLayer, useMapEvent, useMapEvents, Polyline} from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {Icon} from 'leaflet'
import markerIconPng from "leaflet/dist/images/marker-icon.png"
import 'leaflet/dist/leaflet.css';


function CalculateButton({fetchRoute}) {
    return (
        <div className="leaflet-top leaflet-right">
            <div className="leaflet-control leaflet-bar">
                <button onClick={fetchRoute}>
                    Find Shortest Route
                </button>
            </div>
        </div>
    )
}

function LocationMarker({markers, setMarkers}) {

    const markerIdRef = useRef(null)

    const addMarker = (position) => {
        const id = uuidv4()
        setMarkers(prevState => ({...prevState, [id]: {id, position}}))
    }

    const removeMarker = (id) => {
        setMarkers(prevState => {
            const prev = {...prevState}
            delete prev[id]
            return prev
        })
    }

    const getMarker = (position) => {
        return Object.values(markers).find(marker => (marker.position.lat === position.lat && marker.position.lng === position.lng))
    }

    const updateMarker = (marker) => {
        setMarkers(prevState => ({...prevState, [marker.id]: marker}))
    }

    useMapEvents({
        click(e) {
            if(Object.keys(markers).length >= 100) {
                alert("Max 100 position can be add!")
                return
            }
            addMarker(e.latlng)
            //map.flyTo(e.latlng, map.getZoom())
        }
    })

    const eventHandler = useMemo(
        () => ({
            dragstart(e) {
                markerIdRef.current = getMarker(e.target._latlng).id
            },
            dragend(e) {
                const marker = markers[markerIdRef.current]
                marker.position = e.target._latlng
                updateMarker(marker)
            }
        })
        ,[markers])

    return Object.values(markers).map((marker, i)=>
        <Marker
            key={i}
            draggable={true}
            eventHandlers={eventHandler}
            position={marker.position}
            title={`Pot ${i+1}`}
            icon={new Icon({
                iconUrl: markerIconPng,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                tooltipAnchor: [16, -28],
                shadowSize: [41, 41],})
            }>
            <Popup>
                <span onClick={()=>removeMarker(marker.id)}>Pot {i+1} <br/><br/>
                    latitude: {marker.position.lat} <br/>
                    longitude: {marker.position.lng} <br/> <br/>
                    Click here to remove marker
                </span>
            </Popup>
        </Marker>
    )
}


function MiniMap() {
    const [mapState, setMapState] = useState({currentLocation: { lat: 41.06205, lng: 28.91342 }, zoom: 12})
    const [markers, setMarkers] = useState({})
    const [polyline, setPolyline] = useState([])

    const fetchRoute = useCallback(()=>{
        const markersArr = Object.values(markers)
        if(markersArr.length >= 2) {
            const data = markersArr.map(marker => ({poiName: marker.id, latitude: marker.position.lat, longitude: marker.position.lng}))
            console.log(data)
            axios({
                method: "post",
                url:"http://localhost:4004/route",
                data
            }).then(response => {
                console.log("server-response", response)
                console.log("length", response.data.length)
                let arr = []
                response.data.route.forEach(point => {
                    arr.push([point.latitude, point.longitude])
                })
                setPolyline(arr)
            }).catch(err => {
                console.error(err)
            })
        }
    }, [markers])

    useEffect(()=>{
        fetchRoute();
    }, [markers])


    return (
        <>
            <MapContainer doubleClickZoom={false} center={mapState.currentLocation} zoom={mapState.zoom} closePopupOnClick={false}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                />
                <LocationMarker markers={markers} setMarkers={setMarkers} fetchRoute={fetchRoute}/>
                <Polyline pathOptions={{color: 'black'}} positions={polyline} />
            </MapContainer>
            <CalculateButton fetchRoute={fetchRoute} />
        </>
    );
}

export default MiniMap;