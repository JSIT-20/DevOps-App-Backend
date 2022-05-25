const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');
const app = express();

dotenv.config();

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

app.get('/getroutes', async (req, res) =>{
	try{
		var startStop = req.query.start;
		var endStop = req.query.end;
		var startData = await loadNextTripsForStop(startStop);
		var endData = await loadAllRoutesForStop(endStop);
		var commonRoutes = findCommonRoutes(startData, endData);
		var result = {"Status": "200", "Routes": commonRoutes}
	}
	catch(error){
		console.log("Error occured in API module")
		console.log(error)
		var result = {"Status": "500"}
	}

	res.json(result);

});

app.get('/validatestop', async (req, res) =>{
	try{
		var stopQuery = req.query.stop;
		var result;
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