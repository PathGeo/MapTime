//Load Google Charts and set callback
google.load("visualization", "1", {packages:["corechart", "table"]});

//var locationY;
//var locationX;

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
		toc:null,
//		mapGallery: L.Control.extend({
//		    options: {collapsed: true,position: 'topright',text: 'Map Gallery',},
//			initialize: function (options) {L.Util.setOptions(this, options);},
//		    onAdd: function (map) {
//		        // create the control container with a particular class name
//		        var container = L.DomUtil.create('div', 'leaflet-control-mapGallery');
//				$(container).html($("#div_gallery").html())
//				
//				//mouseevent
//				if(this.options){
//					L.DomEvent.addListener(container, 'mouseover', function(){$("#mapGallery").show();}, this);
//					L.DomEvent.addListener(container, 'mouseout', function(){$("#mapGallery").hide();}, this);
//				}
//		        return container
//		    }
//		}),
		legend: L.Control.extend({
		    options: {position: 'bottomright',text: 'Legend',},
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
	dataTable:null,
	demographicData:{
		"HC01_VC04":"Population 16 years and over",
		"HC01_VC20":"Own children under 6 years",
		"HC01_VC21":"All parents in family in labor force",
		"HC01_VC23":"Own children 6 to 17 years",
		"HC01_VC28":"Workers 16 years and over",
		"HC01_VC74":"Total households",
		"HC01_VC85":"Median household income",
		"HC01_VC86":"Mean household income",
		"HC01_VC112":"Median family income",
		"HC01_VC113":"Mean family income",
		"HC01_VC115":"Per capita income"
	},
	geojsonReader: new jsts.io.GeoJSONReader(),
	mapGalleryHtml:"",
	css:{
		"dataTable_highlightRow":{"background-color":"#ED3D86", "color":"#ffffff"}
	}
}




//init
$(document).on("pageshow", function(){	  
	init_UI();
    
    init_map();
    
	
	//directly shoing demo data
	showLayer(app.searchResult,true)
	

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
	
	//move the location of zoomcontrol to the bottom right
	app.map.zoomControl.setPosition("bottomright");
	
	//layers control
	app.controls.toc=L.control.layers(app.basemaps).setPosition("bottomright");

	//map gallery control
	$.each(app.controls, function(k,v){
		//toc is hidden in the map
		if(k=="toc"){
			app.map.addControl(v);
		}else{
			app.map.addControl(new v());
		}
	});
	
	
	//create maxminMap DIV
	$("#div_map").append("<div id='maxminMap' title='Maximum Map'>Maximum Map</div>");
	
	//maximum or mimimum map
	$("#maxminMap").click(function(){
		var $this=$(this);
		
		//maximum map
		if($this.html()=='Maximum Map'){
			$("#div_map").animate({height:"80%"}, 500, function(){
				//resize map
				app.map.invalidateSize(false);
				
				$("#dataPanel").css({height:"17%"});
	
				$this.html("Minimum Map").attr("title", "Mimimum Map");
			});
		}else{
			$("#div_map").animate({height:"53%"}, 500, function(){
				//resize map
				app.map.invalidateSize(false);
				
				$("#dataPanel").css({height:"45%"});
	
				$this.html("Maximum Map").attr("title", "Maximum Map");
			});
		}
	});
}



//init UI
function init_UI(){
	//content height
	$("#content").height($(window).height()-$("#header").height());
	
	$("#div_gallery ul li").click(function(){
		$(this).css("background-color", "#222222").siblings().css("background-color","");
	});
	
	//init popup
	$("div[data-role='popup']").popup();
	
	//dataFilter
//	$("#dataFilter").css({"margin-top":$("#div_map").height()}).find(">ul li").click(function(){
//		$(this).find("span").toggle();
//	})
	
	//adjust dataPanel
	//$("#dataPanel").css({"margin-top":$("#div_map").height()+10, height: $(document).height()-$("#div_map").height()-$("#header").height()-30});
	
	//adjust localInfo
	$("#localInfo").css({height:$("#content").height()-30});
	
	
	
	//when window resize
	$(window).resize(function(){
		$("#content").height($(window).height()-$("#header").height());
		$("#localInfo").css({height:$("#content").height()-30});
	})
	
	
	//when mouse click on otherplace, hide dataTable_menu
	$(document).mouseup(function(e){
		var $container=$(".dataTable_menu, #dataTable_chartControlMenu");
		if(!$container.is(e.target) && $container.has(e.target).length===0){
			$container.hide();
		}
	});
	
	
	//event when users select a file to upload
	$("#uploadData_input").change(function(){
		var value=$(this).val();
		//if user select a file
		if(value){
			$("#uploadData_description").hide();
			$("#uploadData_confirm").show();
			//$(this).closest("form").submit();
		}
	});
	
	
	//form
	$('#uploadData_form').ajaxForm({
		dataType:  'json',
		timeout: 20000,
		uploadProgress: function(e, position, total, percentComplete){
			console.log(percentComplete)
		},
		success: function(data) { 
			if (!data || data.length <= 0) return;
			
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
		},
		error: function(e){
			console.log("error upload file")
			console.log(e)
		}
	});
	
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
				//show geojson
				//need to be prior than the main part, otherwise this function will not be triggered in Firefox
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
						obj.geoJsonLayer=new L.geoJson(obj.json, {
								onEachFeature:function(feature,layer){
									var html=pathgeo.util.objectToHtml(feature.properties);
									
									//highlight keyword
									html=pathgeo.util.highlightKeyword(obj.keywords,html);
									
									//info window
									//layer.bindPopup(html,{maxWidth:500, maxHeight:300});
									
								
									//based on _DT_RowIndex to insert layer into layers
									if(feature.properties._DT_RowIndex>=0){
										layers[feature.properties._DT_RowIndex]=layer;
									}
									
									
									//default icon
									layer.defaultIcon=layer.options.icon;
									
									//event
									layer.on({
										mouseover: function(e){
											
										},
										mouseout: function(e){
											obj.geoJsonLayer.resetStyle(e.target);
										},
										click:function(e){
											//show local info
											showLocalInfo(e.target.feature.properties._DT_RowIndex, true);
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
				
				
				
				//main part
				if(!obj.json){
					$.getJSON(obj.url, function(json){
						obj.json=json;
						showGeojson(obj);
					});
				}else{
					showGeojson(obj);
				}
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





//show pivot table
function showTable(obj){
		//hide columns
		var hiddenColumns=["Coordinates"];
		$.each(obj.columns_dataTable, function(i,column){
			$.each(hiddenColumns, function(j, columnName){
				if(columnName==column.sTitle){column.bVisible=false; column.bSearchable=false}
			});
		});
	

		app.dataTable=$('#dataTable').dataTable({
			"aaData": obj.datas,	//data
			"aoColumns": obj.columns_dataTable, //column
			"bJQueryUI": false,
			"sPaginationType": "full_numbers", //page number
			"sDom": '<"dataTable_toolbar"<"dataTable_nav"><"dataTable_tools"f><"dataTable_menu"<"infobox_triangle"><"infobox">>><"dataTable_table"rti<pl>>', //DOM
			fnDrawCallback: function(){
				
				//backup orginal json to defaultJSON
				if(!app.searchResult.defaultJSON){
					app.searchResult.defaultJSON=app.searchResult.json;
				}
				
				//if jumpPage==true, The datatable only jumps to the page. Don't need to re-read the geojson and redraw the table
				if(!app.jumpPage){
					//get filter data,
					var	me=this,
						features=app.searchResult.defaultJSON.features,
						geojson={
							type:"FeatureCollection",
							features:[]
						},
						feature,
						$selectedData=me.$('tr', {"filter": "applied"});
					
					//remove demographic data
					if(app.layers.demographicData){
						app.map.removeLayer(app.layers.demographicData);
					}
					
					//reset table style
					var $tr=$("#dataTable tr");
					$.each(app.css["dataTable_highlightRow"], function(k,v){$tr.css(k,"");});
					
					//to avoid refresh too frequently to mark high CPU usage
					setTimeout(function(){
						if(me.$('tr', {"filter": "applied"}).length==$selectedData.length){
							//remove layers
							removeLayers();
						
							//read selected layers
							me.$('tr', {"filter": "applied"}).each(function(){
								$(this).attr("_dt_rowindex", this._DT_RowIndex);
	
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
								
								//re-draw Chart
								showDataTableChart(app.searchResult.json);
							}
						}
					},500)
				}
				

			}
		});	
		
		//set all columns in to app.dataTable. Should have another way to get columns
		app.dataTable.columns=obj.columns;
		
		
		//add dataTable tools and click event
		var html="<ul>"+
				 //"<li><img src='images/1365859519_cog.png' title='setting'/></li>"+
				 "<li><img src='images/1365858910_download.png' title='download'/></li>"+
				 "<li><img src='images/1365858892_print.png' title='print'/></li>"+
				 "<li><img src='images/1365859564_3x3_grid_2.png' title='show / hide columns'/></li>"+
				 //"<li><img src='images/1365860337_cube.png' title='canned report'/></li>"+
				 //"<li><img src='images/1365860260_chart_bar.png' title='demographic data'/></li>"+
				 "<li><img src='images/1365978110_gallery2.png' title='map gallery'/></li>"+
				 //"<li><img src='images/1365872733_sq_br_down.png' title='maximum map'/></li>"+
				 "</ul>";
		$(".dataTable_tools")
			.append(html)
			.find("ul li").click(function(){
				//show content in the infobox
				showInfobox($(this).find("img").attr('title'), {left: $(this).offset().left, top: $(this).offset().top+15}, this);	
			});
		
		
		
		
		//dataTable nav bar
		$(".dataTable_nav").html($("#dataTable_nav").html())
		
		
		//copy dataTable toolbar html to dataTable_control
		$("#dataTable_control").html($(".dataTable_toolbar"));
		

		//click on rows
		$("#dataTable").delegate("tr:not([role='row'])", "click", function(){
			showLocalInfo($(this).context._DT_RowIndex);
		});
		
		
		
		//draw Chart
		//add values to the select X and Y
		var html=""
		$.each(obj.columns, function(i,columnName){
			html+="<option>"+columnName+"</option>";
		});
		
		//add events
		var onchange=function(){
			//show chart
			showDataTableChart(app.searchResult.json);
		}//end onchange event
			
		
		//give the html and onchange event to the selects and trigger change event
		$("#dataTable_chart #select_x").append(html).change(onchange).val("name").change();
		$("#dataTable_chart #select_y").append(html).change(onchange).val("sales").change();
		$(".dataTable_chartType").click(onchange);
			
		
}



//show info box while user click on dataTable tools
function showInfobox(type, css, dom){
	var $dom=$(dom);
	var html=type+"<br><ul>";
	switch(type){
		case "show / hide columns":	
			//get all columns name from table
			$.each(app.dataTable.columns, function(i,columnName){
				//check if the columnName is visible in the dataTable
				var isShow=($("#dataTable th:contains('"+ columnName + "')").length > 0) ? 'checked' : '';
				html+="<li><input type='checkbox' id="+i+" " + isShow + " onclick='app.dataTable.fnSetColumnVis(this.id, this.checked); ColVis.fnRebuild(app.dataTable);' />&nbsp; &nbsp; "+columnName +"</li>";
			});
		break;
		case "demographic data":
			//get all columns name from table
			$.each(app.demographicData, function(k,v){
				html+="<li><input type='radio' name='demographic' value="+k+" onclick='if(this.checked){app.layers.demographicData.redrawStyle(this.value); app.layers.demographicData.addTo(app.map);}' />&nbsp; &nbsp; "+ v +"</li>";
			});
		break;
		case "map gallery":
			var mapGalleries=[
				{label: "marker map", value: "GEOJSON", layerName:"geoJsonLayer"}, 
				{label: "cluster map", value:"MARKERCLUSTER", layerName:"markerClusterLayer"},
				{label: "heat map", value:"HEATMAP", layerName:"heatMapLayer"}
			];
						
			$.each(mapGalleries, function(i,gallery){
				html+="<li><input type='radio' name='mapGallery' value='" + gallery.value + "' " + ((app.searchResult[gallery.layerName]._map)?"checked=checked":"") + " onclick='if(this.checked){switchVisualization([this.value]);}' />&nbsp; &nbsp; "+ gallery.label +"</li>";
			});
		break;
		case "canned report":
			var reports=["demographic data report", "social media report"];
			$.each(reports, function(i,report){
				html+="<li><input type='radio' name='mapGallery' value='" + report + "' " + " onclick='' />&nbsp; &nbsp; "+ report +"</li>";
			});
		break;
		
	}	
	html+="</ul>";
	
	$(".dataTable_menu .infobox").html(html);
	$(".dataTable_menu").css(css).show();

}




//show local info
function showLocalInfo(id, jumpToDataTablePage){
	var layer=app.searchResult.geoJsonLayer.layers[id],
		feature=layer.feature;
	
	
	//jump to the page in the dataTable
	if(jumpToDataTablePage){
		app.jumpPage=true;
		app.dataTable.fnPageChange(Math.floor(parseFloat(id)/10), true);
		app.jumpPage=false;
	}
	
	//highlight the tr in the dataTable
	var $tr=$("#dataTable tr");
	$.each(app.css["dataTable_highlightRow"], function(k,v){$tr.css(k,"");});
	$tr.closest("[_dt_rowindex=" + id +"]").css(app.css["dataTable_highlightRow"]);
	
	
	//zoom to the layer, shift lng a little bit to east
	var latlng=layer._latlng;
	app.map.setView(new L.LatLng(latlng.lat, latlng.lng-0.0025), 16)
			
			
	//reset layer to default style and change the selected layer icon
	app.searchResult.geoJsonLayer.eachLayer(function(layer){
		layer.setIcon(layer.defaultIcon).setOpacity(0.5);
	});

	layer.setIcon(new L.icon({
		iconUrl: "images/1365900599_Map-Marker-Marker-Outside-Pink.png",
		iconSize: [36, 36],
    	iconAnchor: [18, 36]
	})).setOpacity(1);
			
	
	//layer.openPopup();
	
			
	//demographic Data
	var $obj=$("#demographic_type").html("");
	$.each(app.demographicData, function(k,v){
		$obj.append("<div data-role='collapsible'><h3 value='" + k + "'>"+v+"</h3><p><div id='localInfo_chart' style='overflow-y:auto; overflow-x:hidden'></div></p></div>");
	});
	
	$obj.collapsibleset("refresh").find("div[data-role='collapsible'] h3").click(function(){ //while clicking on the colllapse, redraw the demographic data and show on the map
		var value=$(this).attr("value");
		
		if(app.layers.demographicData){
			app.layers.demographicData.redrawStyle(value); 
		}
	});
	
	//read demographic
	pathgeo.service.demographicData({type:"zipcode", value:feature.properties["zip"]}, {
		callback:function(geojsonLayer, legendHtml){
			//remove previous
			if(app.layers.demographicData){
				app.map.removeLayer(app.layers.demographicData);
			}
			
			app.layers.demographicData=geojsonLayer;
			app.layers.demographicData.addTo(app.map);
			//app.map.fitBounds(app.layers.demographicData.getBounds());

			//chart
			var sexData=[
					['Sex', 'Population'],
					['Male',  25678],
					['Female',  28734]
			];
			//draw chart
			showLocalInfoChart(sexData);
			
			//show legend
			$(".leaflet-control-legend").html(legendHtml);
		}
	});
	
	
	
	//select options for social media
	//$select_media
	var location=app.geojsonReader.read(feature.geometry);
	var locationX = location.coordinate.x;
	var locationY = location.coordinate.y;
	//document.getElementById("lng").value = locationY;
	//document.getElementById("lat").value = locationX;
	$("#lng").val(locationY);
	$("#lat").val(locationX);
	var $select_media=$("#localInfo_socialMedia");
	//$select_media.html("<br/>Lat: <input type='text' id=lat value=" + locationX + "> <br/>Long: <input type='text' id=lng value=" + locationY + "> <br/>Keyword: <input type='text' id='keyword' value='shoes'><br><button type='button' onclick='callPython()'>Search</button>");
	

	
	
	//show localInfo
	$("#localInfo").show();
	
	
	//using jsts jts topology suite to find out the polygon the point is within
	var point=app.geojsonReader.read(feature.geometry);
	var polygon, withinLayer;

	if(app.layers.demographicData){
		$.each(app.layers.demographicData._layers, function(k,layer){
			polygon=app.geojsonReader.read(layer.feature.geometry);
			if(point.within(polygon)){
				withinLayer=layer;
				return false; //break the loop
			}
		});
		
		if(withinLayer){
			// $select.change(function(){
				// console.log(withinLayer.feature.properties[this.value]);
			// });
		}
	}
	
	
	
}
	
	

//show chart in the dataTable
function showDataTableChart(geojson){
	var x=$("#dataTable_chart #select_x").val(),
		y=$("#dataTable_chart #select_y").val(),
		type=$(".dataTable_chartType:checked").val();
	
	if(!x || !y){
		alert("Please select the x and y axis first");
		return;
	}
	
	if(x=='none' || y=='none'){return;}
			
	
	//draw chart
	var chartOptions={
		googleChartWrapperOptions: {
			chartType: type,
			containerId: "dataTable_chartContent",
			view:{columns:[0,1]},
			options: {
				width: $("#dataTable_chart").width()-20,
				height: 225,
				title: "",
				titleX: x,
				titleY: y,
				legend: {position: 'right'},
				chartArea: {width: '85%', height: '84%', top:20},
				fontSize: 12,
				vAxes:{},
				hAxes:{},
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:null,
		callback_mouseout:null,
		callback_select:function(obj){
			showLocalInfo(obj.value.properties._DT_RowIndex, true)
		}
	};
	//pathgeo.service.drawGoogleChart(geojson, [chartOptions], [x, y], null, {sort:[{column: 1}]}); //sort, but the sequence of the chart data will be different with the geojson
	pathgeo.service.drawGoogleChart(geojson, [chartOptions], [x, y], null);

}




//show chart in the localInfo
function showLocalInfoChart(data){
	var chartOptions={
		googleChartWrapperOptions: {
			chartType: "PieChart",
			containerId: "localInfo_chart",
			view:{columns:[0,1]},
			options: {
				width: 300,
				height: 200,
				title: "",
				titleX: "",
				titleY: "",
				legend: "",
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:null,
		callback_mouseout:null,
		callback_select:function(obj){
			console.log(obj)
		}
	};
	pathgeo.service.drawGoogleChart(data, [chartOptions], null, null);
}



function showDialog(dom_id){
	$("#"+dom_id).popup("open");
}



