const express = require("express");
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express();
const port = 4004;

app.use(cors())
app.use(bodyParser.json())

// we just need a number not a real distance, so we are dont calculating the sqrt of points.
const calculatePointsDistance = (p1, p2) => {
    return (p2.latitude - p1.latitude)**2 + (p2.longitude - p1.longitude)**2
}

// calculating points total distance with given route
const calculateRouteDistance = (points, route) => {
    let len = 0
    for(let i = 0; i < route.length-1; i++) {
        len += calculatePointsDistance(points[route[i]], points[route[i+1]])
    }
    return len
}

// calculating shortest route on given points
const calculateBestRoute = (points) => {
    // initialized route with points following sequentially
    let route = points.map((_, i)=> i)
    let hasNewRoute = true
    let routeLength = Number.MAX_VALUE
    let newRoute = null
    let tmpLength = -1
    let loop = 0
    //console.log("given ->", route)
    while(hasNewRoute) {
        hasNewRoute = false
        //console.log("while ---->", route)
        f:for(let i = 1; i < points.length; i++) {
            for(let j = i+1; j < points.length+1; j++) {
                loop++;
                newRoute = [route[0], ...route.slice(1, i) , ...route.slice(i, j).reverse() , ...route.slice(j)]
                //console.log("\t route ---->", newRoute)
                tmpLength = calculateRouteDistance(points, newRoute)
                if(routeLength > tmpLength) {
                    routeLength = tmpLength
                    route = newRoute
                    hasNewRoute = true
                    //break f
                }
            }
        }
    }
    //console.log("selected ->", route)
    console.log("total loop", loop)
    console.log("route length", routeLength*100000)

    return route.map(r => points[r])
}

const generateMapsUrl = (points, route) => {
    let url = "https://www.google.com/maps/dir/"
    url += `${points[0].latitude},${points[0].longitude}/`
    for (let i=1; i<route.length; i++) {
        url += `'${points[route[i]].latitude},${points[route[i]].longitude}'/`
    }
    return url
}

app.post("/route", (req, res) => {
    const data = req.body
    const route = calculateBestRoute(data)
    res.json({route})
})


app.listen(port, () => {
    console.log(`Started on port ${port}`);
});