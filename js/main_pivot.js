//Load Google Charts and set callback
google.load("visualization", "1", {packages:["corechart", "table"]});

var app={
	map:null,
	basemaps:{
			"Cloudmade": L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png", {styleId: 22677}),
			"OpenStreetMap": L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
			"Google Streetmap":L.tileLayer("https://mts{s}.googleapis.com/vt?lyrs=m@207265067&src=apiv3&hl=zh-TW&x={x}&y={y}&z={z}&s=Ga&style=api%7Csmartmaps",{subdomains:"123", attribution:"Map Source from Google"})
	},
	layers: {
			"demographicData":null
	},
	searchResult:{
			name: "searchResult", 
			type: "GEOJSON", 
			url: "db/demo-data300.json",
			srs: "EPSG:4326",
			title: "Demo Data",
			keywords:[]
	},
	controls:{
		toc:{},
		mapGallery: L.Control.extend({
		    options: {collapsed: true,position: 'topright',text: 'Map Gallery',},
			initialize: function (options) {L.Util.setOptions(this, options);},
		    onAdd: function (map) {
		        // create the control container with a particular class name
		        var container = L.DomUtil.create('div', 'leaflet-control-mapGallery');
				$(container).html($("#div_gallery").html())
				
				//mouseevent
				if(this.options){
					L.DomEvent.addListener(container, 'mouseover', function(){$("#mapGallery").show();}, this);
					L.DomEvent.addListener(container, 'mouseout', function(){$("#mapGallery").hide();}, this);
				}
		        return container
		    }
		}),
		legend: L.Control.extend({
		    options: {position: 'bottomleft',text: 'Legend',},
			initialize: function (options) {L.Util.setOptions(this, options);},
		    onAdd: function (map) {
		        // create the control container with a particular class name
		        return L.DomUtil.create('div', 'leaflet-control-legend');
		    }
		})
	},
	popup:null,
	initCenterLatLng:[35,-100],
	initCenterZoom:4,
	showLayers:[], //layers are shown in the map
	dataTable:null
}




//init
$(document).on("pageshow", function(){	  

    init_map();
    
	init_UI();
		
	//directly shoing demo data
	showLayer(app.searchResult,true)
	
	
	$("#submit_button").click(function (e) {
		$("#img_loading").show();
	});
	
	$('#upload_excel').ajaxForm({
		dataType:  'json',
		timeout: 20000,  
		success: function(data) { 
			
			if (data.length <= 0) return;
			
			 app.searchResult={
				 name: "searchResult", 
				 type: "GEOJSON",
				 json: data,
				 srs: "EPSG:4326",
				 title: "keyword",
				 fieldName:{username:null, text:"text"},
				 keywords: "testing"
			 };

			showLayer(app.searchResult, true);
			
			app.map.fitBounds(app.searchResult.geoJsonLayer.getBounds());
		}
	});
});




//init openlayers
function init_map(){
	//adjust map height
	//var map_height=((($(document).height()-$("#header").height()) / $(document).height())*100*0.45)+"%";
	//$("#div_map").css({height:300});

	
	app.map = L.map("div_map", {
        center: app.initCenterLatLng,
		zoom: app.initCenterZoom,
		layers:[app.basemaps["Cloudmade"]],
		attributionControl:false,
		trackResize:true
    }); 
	
	//move the location of zoomcontrol to the top right
	app.map.zoomControl.setPosition("topright")
	
	//layers control
	app.controls.toc=L.control.layers(app.basemaps);

	//map gallery control
	app.map.addControl(new app.controls.mapGallery()).addControl(new app.controls.legend());;
	
	
	//read demographic
	pathgeo.service.demographicData({
		callback:function(geojsonLayer){
			//geojsonLayer.redrawStyle("HC01_VC85")
			app.layers.demographicData=geojsonLayer;
		}
	});
}



//init UI
function init_UI(){
	$("#div_gallery ul li").click(function(){
		$(this).css("background-color", "#222222").siblings().css("background-color","");
	});
	
	//init popup
	$("div[data-role='popup']").popup();
	
	//adjust dataPanel
	$("#dataPanel").css({"margin-top":$("#header").height()+$("#div_map").height()});
	

}



//load geojson
function showLayer(obj, isShow){
		//show title
		if(obj.title){$("#lbl_dataName").html(obj.title);}
		
		//feature count
		obj.featureCount=0;
		
		//show layer
		switch(obj.type){
			case "GEOJSON":
				if(!obj.json){
					$.getJSON(obj.url, function(json){
						obj.json=json;
						showGeojson(obj);
					});
				}else{
					showGeojson(obj);
				}
				
				
				//show geojson
				function showGeojson(object){
					parseGeojson(object);
					addLayer(object);
					
				
					//show table
					//convert geojson properties to array
					if(!obj.dataTable){
						obj.dataTable=pathgeo.util.geojsonPropertiesToArray(obj.json);
						showTable(obj.dataTable);
					}
					

					//hide loadData dialog
					$("#dialog_uploadData").popup("close");
				}
				
				
				//parse geojson
				function parseGeojson(obj){
					//create layer
					if(!obj.geoJsonLayer){
						var layers=[];
						obj.geoJsonLayer=L.geoJson(obj.json, {
								onEachFeature:function(feature,layer){
									var html=pathgeo.util.objectToHtml(feature.properties);
									
									//highlight keyword
									html=pathgeo.util.highlightKeyword(obj.keywords,html);
									//info window
									layer.bindPopup(html,{maxWidth:500, maxHeight:300});
									
								
									//based on _DT_RowIndex to insert layer into layers
									if(feature.properties._DT_RowIndex>=0){
										layers[feature.properties._DT_RowIndex]=layer;
									}
									
									
									//event
									layer.on({
										mouseover: function(e){
											
										},
										mouseout: function(e){
											obj.geoJsonLayer.resetStyle(e.target);
										}
									})
								},
								
								//style
								style: {}
						});
						obj.geoJsonLayer.layers=layers;
						
						app.controls.toc.addOverlay(obj.geoJsonLayer, "GeoJSON");
						obj.layer=obj.geoJsonLayer;
					}
					
					
					//marker cluster
					if(!obj.markerClusterLayer){
						obj.markerClusterLayer = pathgeo.layer.markerCluster(obj.json, {
								onEachFeature: function (feature, layer) {
									var props = feature.properties;
									var popupText = '';
									
									for (var prop in props) { 
										var fieldName = prop.charAt(0).toUpperCase() + prop.slice(1);
										
										if (fieldName.toLowerCase() != "loc") {
											popupText += "<b>" + fieldName + "</b>: " + feature.properties[prop] + "<br>";
										}
									}
									
									layer.bindPopup(popupText, { maxWidth: 500, maxHeight: 300 } );
								}
							},{
								//clusterclick event
								clusterclick: function(e){
									if(!e.layer._popup){
										var properties=pathgeo.util.readClusterFeatureProperies(e.layer, []);
										var html="<div class='popup'>There are <b>" + e.layer._childCount + "</b> twitters:<p></p><ul>";
										$.each(properties, function(i, property){
											html+="<li><img src='images/1359925009_twitter_02.png' width=20px />&nbsp; &nbsp; <b>"+ property[obj.fieldName.username]+"</b>: "+ property[obj.fieldName.text]+"</li>";
										});
										html+="</ul></div>";
										html=html.replace(/undefined/g, "Tweet");
											
										//highlight keyword
										html=pathgeo.util.highlightKeyword(obj.keywords,html);
													
										e.layer.bindPopup(html,{maxWidth:500, maxHeight:300}).openPopup();
									}else{
										e.layer.openPopup();
									}
								}
							}
						);
						app.controls.toc.addOverlay(obj.markerClusterLayer, "MarkerCluster");
					}
					
					
					//heat map				
					if(!obj.heatMapLayer){
						obj.heatMapLayer=pathgeo.layer.heatMap(obj.json);
						app.controls.toc.addOverlay(obj.heatMapLayer, "Heatmap");
					}
				}//end parseGeojson
				
			break;
			case "WMS":
				//default param
				if(obj.param && obj.param.layers){
					obj.param.format= obj.param.format || 'image/png';
					obj.param.transparent=obj.param.transparent || true
					
					obj.layer = L.tileLayer.wms(obj.url, obj.param);
					
					//events
					obj.layer.on("load", function(e){
						console.log("loaded");
					});
					
					//obj.layer.setOpacity(0.75).addTo(app.map).bringToFront();
					addLayer(obj);
					app.controls.toc.addOverlay(obj.layer, obj.name);
				}
			break;
		}
		
		
		
		function addLayer(obj){
			if(isShow){
				obj.layer.addTo(app.map);
				app.showLayers.push(obj.layer);
				
				app.map.fitBounds(app.searchResult.geoJsonLayer.getBounds());
			}

			//close dialog
			//$("#div_dialog").dialog("destroy");
			$("#img_loading").hide();
		}
}




//switch layer
function switchVisualization(types){
	//remove all shown layers on the map
	removeLayers();
	
	var layer;
	$.each(types, function(i,type){
		switch(type){
			case "MARKERCLUSTER":
				layer=app.searchResult.markerClusterLayer.addTo(app.map);
			break;
			case "HEATMAP":
				layer=app.searchResult.heatMapLayer.addTo(app.map);
			break;
			case "GEOJSON":
				layer=app.searchResult.geoJsonLayer.addTo(app.map);
			break;
		}
		app.showLayers.push(layer);
	});
}




//remove all layers on the map
function removeLayers(){
	if(app.showLayers.length>0){
		$.each(app.showLayers, function(i,layer){
			app.map.removeLayer(layer);
		});
		app.showLayers=[];
	}
}



//switch basemap
function switchBaseLayer(layer){
	if(app.map.hasLayer(layer)){
		app.map.removeLayer(layer)
	}else{
		layer.addTo(app.map);}
}




//drawChart
function drawChart(chartType, data, domID, options){
	if(!chartType || !data ||!domID){console.log("[ERROR] drawChart: no chartType, data, or domID"); return;}
	
	if(!options){options={}}
	options.title=options.title || "";
    options.width=options.width || "";
    options.height=options.height || "";
    options.backgroundColor=options.backgroundColor || {};
    options.is3D=options.is3D || true;
	
	
	data = google.visualization.arrayToDataTable(data);
	
	var gChart, containerID=document.getElementById(domID);
	switch (chartType) {
		case "ColumnChart":gChart = new google.visualization.ColumnChart(containerID);break;
		case "AreaChart":gChart = new google.visualization.AreaChart(containerID);break;
		case "LineChart":gChart = new google.visualization.LineChart(containerID);break;
		case "PieChart":gChart = new google.visualization.PieChart(containerID);break;
		case "BarChart":gChart = new google.visualization.BarChart(containerID);break;
		case "BubbleChart":gChart = new google.visualization.BubbleChart(containerID);break;
		case "CandlestickChart":gChart = new google.visualization.CandlestickChart(containerID);break;
		case "ComboChart":gChart = new google.visualization.ComboChart(containerID);break;
		case "MotionChart":gChart = new google.visualization.MotionChart(containerID);break; //must include  google.load('visualization', '1', {packages: ['motionchart']});
		case "Table":gChart = new google.visualization.Table(containerID);break; //must include google.load('visualization', '1', {packages: ['table']});
	}
	gChart.draw(data, options);
}


//show pivot table
function showTable(obj){
		
		$('#dataPanel').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="dataTable"></table>' );
		app.dataTable=$('#dataTable').dataTable({
			"aaData": obj.datas,
			"aoColumns": obj.columns,
			"bJQueryUI": false,
			"sPaginationType": "full_numbers",
			"sDom": 'C<"clear">lfrtip', //show colVis
			fnDrawCallback: function(){
				//backup orginal json to defaultJSON
				if(!app.searchResult.defaultJSON){
					app.searchResult.defaultJSON=app.searchResult.json;
				}
				
				
				//get filter data,
				var	me=this,
					features=app.searchResult.defaultJSON.features,
					geojson={
						type:"FeatureCollection",
						features:[]
					},
					feature,
					$selectedData=me.$('tr', {"filter": "applied"});
				
				//to avoid refresh too frequently to mark high CPU usage
				setTimeout(function(){
					if(me.$('tr', {"filter": "applied"}).length==$selectedData.length){
					
						//read selected layers
						me.$('tr', {"filter": "applied"}).each(function(){
							feature=features[this._DT_RowIndex];
							feature.properties._DT_RowIndex=this._DT_RowIndex;
							geojson.features.push(feature);
						});
						
						
						//overwrite app.searchResult.json and showlayer again
						//remove geojsonLayer
						if(geojson.features.length>0 && app.searchResult.geoJsonLayer){
							app.map.removeLayer(app.searchResult.geoJsonLayer);
							app.searchResult.geoJsonLayer=null;
							app.searchResult.markerClusterLayer=null;
							app.searchResult.heatMapLayer=null;
							
							app.searchResult.json=geojson;
							showLayer(app.searchResult, true);
						}
					}
				},500)

			}
		});	
		
		

		//click on rows
		$("#dataTable").delegate("tr:not([role='row'])", "click", function(){
			var id=$(this).context._DT_RowIndex,
				layer=app.searchResult.geoJsonLayer.layers[id];

			layer.openPopup();
		})
		
}





function showDialog(dom_id){
	$("#"+dom_id).popup("open");
}



