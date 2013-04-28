if(!window.pathgeo){window.pathgeo={}}

pathgeo.service={
	proxy: "",
	
	
	/**
	 * search pathgeo database
	 * @param {String} key
	 * @param {String} radius
	 * @param {String} keyword
	 * @param {Function} callback function(json)
	 */
	search: function(key, radius, keyword, callback){
		var url=(this.proxy!="") ? this.proxy + encodeURIComponent("http://vision.sdsu.edu/suhan/chris/PyMapper.py?key=" + key + "&rad=" + radius + "&keyword=" + keyword) : "http://vision.sdsu.edu/chris/PyMapper.py?key=" + key + "&rad=" + radius + "&keyword=" + keyword
		//replace %20 (space) to %2520 in the url
		url=url.replace("%20", "%2520");
	
		//get json
		$.getJSON(url, function(json){
			var geojson={
				type:"FeatureCollection",
				features:[]
			}
			
			var feature;
			for(var i in json.results){
				feature=json.results[i];
				
				geojson.features.push({
					type:"Feature",
					geometry:{type:"Point", coordinates:[feature.loc[1], feature.loc[0]]},
					properties:{text: feature.text, urls: feature.urls}
				});
			}
			
			if(callback){
				callback(geojson);
			}
		});
	},
	
	
	
	
	
	/**
	 * create demographic layer 
	 * @param {Object} filter, {type:"zipcode" || "city" || "county" || "state", "value": }     
	 * @param {Object} options
	 * @return {Object} 
	 */
	demographicData:function(filter, options){
		var me=this;
		
		//jsons to store all json in different scale, including zipcode, city, county, state
		if(!me.jsons){me.jsons={}}
		
		
		//filter
		if(!filter){filter={}}
		filter.type=filter.type || "zipcode";
		filter.value=filter.value || null;
		
		
		//url
		switch (filter.type){
			case "zipcode":
				me.url="db/CA_ACS11.json";
				filter.column="ZIP"
			break;
			case "city":
				
			break;
			case "county":
				
			break;
			default:
				me.url="db/CA_ACS11.json";
			break;
		}		
		
		
		//options
		if(!options){options={}}
		options.type=options.type || "HC01_VC04";  //if no type, default is the first one
		options.DomID_legend=options.DomID_legend || "";
		options.featureStyle=options.featureStyle || function(feature){return options.styles(feature, options.type)};
		options.popupHTML=options.popupHTML || function(feature){return pathgeo.util.objectToHtml(feature.properties)}
		options.popupMaxWidth=options.popupMaxWidth || 500;
		options.popupMaxHeight=options.poupMaxHeight || 300;
		options.onFeatureMouseover=options.onFeatureMouseover || function(e){e.target.setStyle({weight: 3, color: '#666',dashArray: '',fillOpacity: 0.7});};
		options.onFeatureMouseout=options.onFeatureMouseout || function(e){me.geojsonLayer.resetStyle(e.target);};
		options.onFeatureClick=options.onFeatureClick || function(e){};
		options.colorSchema=options.colorSchema || {
				"HC01_VC04":[{value: 94913, color: "#800026"},{value: 67795, color: "#E31A1C"},{value: 40677, color: "#FD8D3C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}], 
				"HC01_VC20":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC21":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC23":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC28":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC74":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC85":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC86":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC112":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC113":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
				"HC01_VC115":[{value: 94913, color: "#800026"}, {value: 81354, color: "#BD0026"},{value: 67795, color: "#E31A1C"},{value: 54236, color: "#FC4E2A"},{value: 40677, color: "#FD8D3C"},{value: 27118, color: "#FEB24C"}, {value: 13559, color: "#FED976"}, {value: 0, color: "#FFEDA0"}],
		};
		options.labels=options.labels || {
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
		};		
		//getColor
		me.getColor=function(type, d){
			var colorSchema=options.colorSchema[type];
			if(colorSchema){
				var color;
				$.each(colorSchema, function(i, obj){
					if(i==0 && d > obj.value){
						color=obj.color;
						return false;
					}else{
						if(d>obj.value && d<=colorSchema[i-1].value){
							color=obj.color;
							return false;
						}
					}
				});
				return color;
			}
		}
		
		
		//styles
		options.styles=options.styles || function(feature, type){
			if(!type){type=options.type}
			return {
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.6,
				fillColor: me.getColor(type, feature.properties[type])
			}
		}
		
		
		//getLegend
		me.getLegend=function(type){
			var colorSchema=options.colorSchema[type],
				legendHtml="No Legend";
		
			if(colorSchema){
				legendHtml="<div id='legend_title'>"+ options.labels[type] + "<ul>";
				$.each(colorSchema, function(i, obj){
					var to = colorSchema[i - 1] ? colorSchema[i - 1].value : null;
					legendHtml+="<li><span id='legend_image' style='background-color:"+ me.getColor(type, obj.value+1) + "'>&nbsp; &nbsp; &nbsp; &nbsp; </span>&nbsp; <span id='legend_label'>"+ obj.value + (to ? '&ndash;' + to : '+') + "</span></li>";
				});
				legendHtml+="</ul>";
			}
			
			return legendHtml;
		}
		

		
		
		//function to parseJson
		function parseJson(json){
			var zipcodes={}, zipcode;
			
			
			//create leaflet geojson layer
			me.geojsonLayer=new L.GeoJSON(json, {
				onEachFeature: function(jsonFeature, layer){
					//popup html
					//layer.bindPopup(options.popupHTML(jsonFeature),{maxWidth:options.popupMaxWidth, maxHeight:options.popupMaxHeight});
					
					
					//test: insert each layer in to zipcodes array
					//*****************************************************************************************************************************
					zipcode=jsonFeature.properties["ZIP"];
					zipcodes[zipcode]=layer;
					//*****************************************************************************************************************************
					
					
					//event
					layer.on({
						mouseover: function(e){
							options.onFeatureMouseover(e);
							if (!L.Browser.ie) {e.target.bringToFront();}
						},
						mouseout: function(e){options.onFeatureMouseout(e);	},
						click:function(e){options.onFeatureClick(e);}
					});
				},
				
				//filter
				filter: function(jsonFeature, layer){
					//match only one value
					if(filter.type && filter.value && filter.column){
						if(jsonFeature.properties[filter.column]==filter.value){
							return true;
						}
					}else{
						return true;
					}
				},
				
				//style
				style: options.featureStyle,
				
				//customize styles
				styles: options.styles
			});
			
			
			//test: insert each layer in to zipcodes array
			//*****************************************************************************************************************************
			me.geojsonLayer.zipcodes=zipcodes;
			//*****************************************************************************************************************************
			//console.log(me.geojsonLayer)
			
			//add customize function to redraw layers' style
			me.geojsonLayer.redrawStyle=function(type, style, legend_callback){
				var that=this;
				
				if(!style){
					style=function(feature){
						return that.options.styles(feature, type)
					}
				}
				this.options.style=style;
				this.setStyle(style);
				
				if(legend_callback){
					legend_callback(me.getLegend(type))
				}
			}
			

			//callback
			if(options.callback){options.callback(me.geojsonLayer, me.getLegend(options.type))}
			
		}//end parseJson
		
		
		//load data
		if(!me.jsons[filter.type]){
			$.getJSON(me.url, function(json){
				me.jsons[filter.type]=json;
				parseJson(json);
			});
		}else{
			parseJson(me.jsons[filter.type]);
		}
		
	},
	
	
	
	
	/**
	 * @class
	 * drawGoogleChart use Google Chart API to draw openlayer.features 
	 * @param {Array or geojson} chartData	the data sould be the google Data array or a geojson object (must a featureCollection)
	 * @param {Array} charts			Array of Object, {googleChartWrapperOptions: please refer to Google Chart API, callback: callback function, callback_mouseover: callback while mouse moving over the chart, callback_mouseout: callback while mouse moving out the chart
	 * 									For example:  	
	 * 									{googleChartWrapperOptions: {
											chartType: type,
											containerId: "chart_" + type,
											//view:{columns:[0,1]},
											options: {
												width: $("#infoWidget").width() / 2.8,
												height: 350,
												title: "Area v.s. Landuse Type",
												titleX: "X",
												titleY: "Y",
												legend: ""
											}
										 },
										 callback:null,
										 callback_mouseover:null,
										 callback_mouseout:null
										}
	 * @param {Array} ? limited_columns	only read limited fields (columns) in OpenLayers.Feature.Vector attribute
	 * @param {Array} ? controlsOptions	{dashBoardDomID:'', googleChartControlWrappers: [googleChartControlWrapper]}
	 * 									For example:
	 * 									{	dashBoardDomID: "infoContent_spatialquery",
											googleChartControlWrappers:[
												{ 'controlType': 'NumberRangeFilter',
										          'options': {
										            'filterColumnLabel': 'SHAPE_AREA',
										          	'ui': {'labelStacking': ''}
												  }
										        },
										        { 'controlType': 'CategoryFilter',
										          'options': {
										            'filterColumnLabel': 'CATEGORIES',
										          	'ui': {'labelStacking': '','allowTyping': false,'allowMultiple': false}
												  }
										        }
											]
										}
	 */
	drawGoogleChart:function(chartData, charts, limited_columns, controlsOptions, options){
		if(!chartData || !charts){
			console.log("[ERROR]pathgeo.service.drawGoogleChart: data_array, charts are not set!");
			return;
		}
		
		//options
		if(!options){options={}}
		options.sort=options.sort || null;
		
	
		//data for drawing
		var values=[],
			columns=[],
			rows=[];
		if(limited_columns){values[0]=limited_columns};
		
		
		//detenmine which data is 
		if(chartData.type && chartData.type.toUpperCase()=="FEATURECOLLECTION"){
			$.each(chartData.features, function(i,feature){
				rows=[];
				
				//read column and rows
				if(limited_columns){
					$.each(limited_columns, function(j,obj){
						rows.push(feature.properties[obj]);	
					});	
				}else{
					$.each(feature.properties, function(k,v){
						if(i==0){columns.push(k);}
						rows.push(v);
					});
				}
				
				if(!values[0]){values.push(columns);}
				values.push(rows);
			});	
		}else{
			if(chartData instanceof Array){
				values=chartData;
			}else{
				console.log("pathgeo.service.drawGoogleChart: the data is not geojson object (must be a FeatureCollection) or a google chart array");
				return;
			}
		}
		
		
		var data = new google.visualization.arrayToDataTable(values);
		
		if(options.sort){
			data.sort(options.sort);
		}
		
		
		
		
		//determine google chart lib
		//if no google chart lib, it will load it first.
		if(typeof(google.visualization)=='undefined'){
			$.getScript("https://www.google.com/jsapi", function(){
				$.getScript('https://www.google.com/uds/api/visualization/1.0/d7d36793f7a886b687850d2813583db9/format+zh_TW,default,table,corechart.I.js',function(){
					return draw();
				});
			});	
		}else{
			return draw();
		}
		
		
		
		
		//draw
		function draw(){
			var gChart, chartType, containerID;
			var gCharts=[], returnCharts=[];
			
			$.each(charts, function(i, chart){
				if (!chart.googleChartWrapperOptions) {
					console.log("[ERROR]kiein.service.drawGoogleChart: no googleChartWrapperOptions!");
					return;
				}
				if (!chart.googleChartWrapperOptions.chartType) {
					console.log("[ERROR]kiein.service.drawGoogleChart: no googleChartWrapperOptions.chartType!");
					return;
				}
				if (!chart.googleChartWrapperOptions.containerId) {
					console.log("[ERROR]kiein.service.drawGoogleChart: no googleChartWrapperOptions.containerId!");
					return;
				}
				
				//chart options
				chart.loadingImage = chart.loadingImage || "images/loading.gif";
				chart.loadingImage_width = chart.loadingImage_width || "25px";
				chart.callback = chart.callback || null;
				chart.callback_mouseover = chart.callback_mouseover || null;
				chart.callback_mouseout = chart.callback_mouseout || null;
				chart.googleChartWrapperOptions.options.width = chart.googleChartWrapperOptions.options.width || 500;
				chart.googleChartWrapperOptions.options.height = chart.googleChartWrapperOptions.options.height || 350;
				chart.googleChartWrapperOptions.options.title = chart.googleChartWrapperOptions.options.title || "";
				chart.googleChartWrapperOptions.options.titleX = chart.googleChartWrapperOptions.options.titleX || "X";
				chart.googleChartWrapperOptions.options.titleY = chart.googleChartWrapperOptions.options.titleY || "Y";
				chart.googleChartWrapperOptions.options.legend = chart.googleChartWrapperOptions.options.legend || "";
				chart.googleChartWrapperOptions.options.is3D = chart.googleChartWrapperOptions.options.is3D || true;
				
				chartType = chart.googleChartWrapperOptions.chartType;
				containerID = chart.googleChartWrapperOptions.containerId;
				
				//show loading image
				$("#" + containerID).html("<img src='" + chart.loadingImage + "' width='" + chart.loadingImage_width + "' />");
				
				containerID = document.getElementById(containerID);
				
				//draw
				if(!controlsOptions){
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
					gChart.draw(data, chart.googleChartWrapperOptions.options);
					
					//select callback
					if (chart.callback_select) {
						google.visualization.events.addListener(gChart, 'select', function(param){
							var selection=gChart.getSelection()[0];
								
							if(selection){
								chart.callback_select({
									gChart:gChart,
									row: selection.row,
									column: selection.column,
									value: chartData.features[selection.row],
									param:param
								});
							}
							
						});
					}
						
					//mouseover callback
					if (chart.callback_mouseover) {
						google.visualization.events.addListener(gChart, 'onmouseover', function(e){
							e.gChart=gChart;
							e.value = chartData.features[e.row];
							chart.callback_mouseover(e);
						});
					}
						
					//mouseout callback
					if (chart.callback_mouseout) {
						google.visualization.events.addListener(gChart, 'onmouseout', function(e){
							e.gChart=gChart;
							e.value = chartData.features[e.row];
							chart.callback_mouseout(e);
						});
					}
						
					//callback
					if (chart.callback) {
						chart.callback();
					}
					
					returnCharts.push(gChart);
					
				//if controlsOptions
				}else{
					var gChart=new google.visualization.ChartWrapper(chart.googleChartWrapperOptions);
				
					//mouseover callback
					if(chart.callback_mouseover){
					      google.visualization.events.addListener(gChart, 'ready', function(){
					      	  google.visualization.events.addListener(gChart.getChart(), 'onmouseover', function(e){
								  e.gChart=gChart.getChart();
								  e.value=chartData.features[e.row];
					          	  chart.callback_mouseover(e);
					      	  });
					      });
					}
					            
					//mouseout callback
					if(chart.callback_mouseout){
					       google.visualization.events.addListener(gChart, 'ready', function(){
					       	  google.visualization.events.addListener(gChart.getChart(), 'onmouseout', function(e){
					              e.gChart=gChart.getChart();
					              e.value=chartData.features[e.row];
					              chart.callback_mouseout(e);
					       	  });
					       });
					}
					
					gCharts.push(gChart);
					returnCharts.push(gChart.getChart());
				}
			});
			
		
			
			//controlOptions
			if(controlsOptions){
				if(!controlsOptions.dashBoardDomID){console.log("[ERROR]kiein.service.drawGoogleChart: dashBoardDomID is needed!!");return;}
				if(!controlsOptions.googleChartControlWrappers){console.log("[ERROR]kiein.service.drawGoogleChart: googleChartControlWrappers is needed!!");return;}
				
				var controls=[];
				$.each(controlsOptions.googleChartControlWrappers, function(i, control){
					if(!control.controlType){console.log("[ERROR]kiein.service.drawGoogleChart: needed googleChartControlWrapper.controlType");return;}
					controls.push(new google.visualization.ControlWrapper(control));
				});
	
				// Create the dashboard.
			  	new google.visualization.Dashboard(document.getElementById(controlsOptions.dashBoardDomID)).bind(controls, gCharts).draw(data);
			}
			
			
			return returnCharts;
		}
	}
	
	
	
}
