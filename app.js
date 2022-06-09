const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const app = express();

dotenv.config();
app.use(bodyParser.json());

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Travel Planner API",
			version: "1.0.0",
			description: "API for travel planner"
		},
		servers: [
			{
				url: "http:/localhost:8081"
			}
		]
	},
	apis: ["/getroutes"]
}

const specs = swaggerJsDoc(options);

var savedTrips = [{"name": "Trim to Blair","start_stop": "3029", "end_stop": "3027"}]; //Array of trips, composed of start and end stops

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.get('/getroutes', async (req, res) =>{
	var result;
	try{
		var startStop = req.query.start;
		var endStop = req.query.end;
		var startData = await loadNextTripsForStop(startStop);
		var endData = await loadAllRoutesForStop(endStop);
		var commonRoutes = findCommonRoutes(startData, endData);
		result = {"Status": "200", "Routes": commonRoutes}
	}
	catch(error){
		console.log("Error occured in API module")
		console.log(error)
		result = {"Status": "500"}
	}

	res.json(result);

});

app.get('/validatestop', async (req, res) =>{
	var result;
	try{
		var stopQuery = req.query.stop;
		var stop = await loadAllRoutesForStop(stopQuery);
		if(stop.data.GetRouteSummaryForStopResult.Error != ""){
			result = {"Status": "500"};
		}
		else{
			result = {"Status": "200"};
		}
	}
	catch(error){
		console.log(error);
		result = {"Status": "500"}
	}
	res.json(result);
});

app.get('/savedtrips', (req, res) =>{
	var result;
	try{
		result = {"Status": "200", "Trips": savedTrips}
	}
	catch(error){
		console.log(error);
		result = {"Status": "500"}
	}
	res.json(result);

});

app.post('/savedtrips', (req, res) =>{
	var result;
	try{
		savedTrips.push({"name": req.body.name, "start_stop": req.body.start_stop, "end_stop": req.body.end_stop});
		result = {"Status": "200", "Trips": savedTrips}
	}
	catch(error){
		console.log(error);
		result = {"Status": "500"}
	}
	console.log(savedTrips);
	console.log(req.body);
	res.json(result);
});

app.delete('/savedtrips/:id', (req, res) =>{
	var result;
	try{
		savedTrips.splice(req.params.id, 1);
		result = {"Status": "200", "Trips": savedTrips}
	}
	catch(error){
		console.log(error);
		result = {"Status": "500"}
	}
	res.json(result);
});

app.listen(8081, ()=>{
	console.log("API listening on port 8081");
});

const loadNextTripsForStop = async (stopNumber) => {
	try{
		var url = "https://api.octranspo1.com/v2.0/GetNextTripsForStopAllRoutes?appID=" + APP_ID + "&apiKey=" + API_KEY + "&stopNo=" + stopNumber + "&format=JSON";
		const response = await axios.get(url);
		return response;
	}
	catch(error){
		console.log('Error occured during while calling the OC Transpo API');
	}
	
}

const loadAllRoutesForStop = async (stopNumber) => {
	try{
		var url = "https://api.octranspo1.com/v2.0/GetRouteSummaryForStop?appID=" + APP_ID + "&apiKey=" + API_KEY + "&stopNo=" + stopNumber + "&format=JSON";
		console.log(url);
		const response = await axios.get(url);
		return response;
	}
	catch(error){
		console.log('Error occured during while calling the OC Transpo API');
	}
}

const findCommonRoutes = (startRoutes, endRoutes) => {
	commonRoutes = [];
	var start = startRoutes.data.GetRouteSummaryForStopResult.Routes.Route;
	var end = endRoutes.data.GetRouteSummaryForStopResult.Routes.Route;
	if(Array.isArray(start)){
		start.forEach(function(startRoute, startIndex){
			if(Array.isArray(end)){
				end.forEach(function(endRoute, endIndex){
					if(startRoute.RouteNo == endRoute.RouteNo && startRoute.RouteHeading == endRoute.RouteHeading){
						commonRoutes.push(startRoute);
					}
				});
			}
			else{
				if(startRoute.RouteNo == end.RouteNo && startRoute.RouteHeading == end.RouteHeading){
					commonRoutes.push(startRoute);
				}	
			}

		});
	}
	else{
		if(Array.isArray(end)){
			end.forEach(function(endRoute, endIndex){
				if(start.RouteNo == endRoute.RouteNo && start.RouteHeading == endRoute.RouteHeading){
					commonRoutes.push(startRoute);
				}
			});
		}
		else{
			if(start.RouteNo == end.RouteNo && start.RouteHeading == end.RouteHeading){
				commonRoutes.push(startRoute);
			}
		}

	}
	return commonRoutes
}