//Load Google Charts and set callback
google.load("visualization", "1", {
	packages : ["corechart", "table"]
});


//use json in the cookie
$.cookie.json=true;


var app = {
	map : null,
	basemaps : {
		//"Light map": L.tileLayer("https://tiles.mapbox.com/v3/pathgeo.map-jwxvdo36/{z}/{x}/{y}.png?updated=1374825292888",{attribution:"Map Provided by <a href='http://www.mapbox.com/' target='_blank'>MapBox</a>", title:"Light Map"}),
		//"Terrain map": L.tileLayer("https://tiles.mapbox.com/v3/pathgeo.map-9p1ubd74/{z}/{x}/{y}.png?updated=1374825095067",{attribution:"Map Provided by <a href='http://www.mapbox.com/' target='_blank'>MapBox</a>", title:"Terrain Map"}),
		//"Night map": L.tileLayer("https://tiles.mapbox.com/v3/pathgeo.map-jkiqueqj/{z}/{x}/{y}.png?updated=1374825942470",{attribution:"Map Provided by <a href='http://www.mapbox.com/' target='_blank'>MapBox</a>", title:"Night Map"}),
		"Light Gray Background Map" : L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png", {
			styleId : 22677,
			attribution : "Map Provided by <a href='http://cloudmade.com/' target='_blank'>Cloudmade</a>",
			title : "Cloudmade"
		}),
		"OpenStreet Map" : L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution : "Map Provided by <a href='http://www.openstreetmap.org/' target='_blank'>Open Street Map</a>",
			title : "Open Street Map"
		})
		//"Google Streetmap":L.tileLayer("https://mts{s}.googleapis.com/vt?lyrs=m@207265067&src=apiv3&hl=zh-TW&x={x}&y={y}&z={z}&s=Ga&style=api%7Csmartmaps",{subdomains:"123", attribution:"Map Source from Google"})
	},
	layers : {
		"demographicData" : null,
		selectedZipcodeLayer : null
	},
	zipcodeFieldName : "zip_code",
	geocodingResult : {
		type : "GEOJSON",
		url : null,
		title : null,
		column : {
			statistics : ""
		},
		keywords : [],
		showLayerNames:[]
	},
	controls : {
		mapGallery : L.Control.extend({
			options : {
				"collapsed" : true,
				"position" : 'topright',
				"text" : 'Map Gallery'
			},
			initialize : function(options) {
				L.Util.setOptions(this, options);
			},
			onAdd : function(map) {
				// create the control container with a particular class name
				var container = L.DomUtil.create('div', 'leaflet-control-mapGallery');
				var html = "<ul><li title='Showing markers' layer='geoJsonLayer' style='background-color:#5B92C0'><img src='images/marker-icon.png' /></li><li title='Cluster Map' layer='markerClusterLayer'><img src='images/gallery-cluster.png' /></li><li title='Hotspots' layer='heatMapLayer'><img src='images/gallery-heatmap.png' /></li></ul>";

				//click map gallery event
				$(container).html(html).find("ul li").on({
					click : function() {
						var $this = $(this), value = $this.attr("layer"), layer = app.geocodingResult[value];

						//if this layer is already shown on the map, hide the layer and change the color
						if (layer._map) {
							//if(value=='heatMapLayer') alert(value);
							//document.getElementById('slider').style.opacity = "0";
							app.map.removeLayer(layer);
							$this.css({
								"background-color" : ''
							});
						} else {
							layer.addTo(app.map);
							
							//make the markerclusterlayer more priority
							if(value=='markerClusterLayer'){layer.bringToFront();}
							
							$this.css({
								"background-color" : '#5B92C0'
							});

							//show map popup window
							$("#mapPopup_" + value).show();
						}
					},
					mouseover : function() {
						$(".mapPopupWidget").hide();
						var $this = $(this), value = $this.attr("layer"), layer = app.geocodingResult[value];

						//only the layer is activated
						if (layer._map) {
							//show map popup window
							$("#mapPopup_" + value).show();
						}
					},
					mouseleave : function() {

					}
				});
				return container
			}
		}),
		toc : null,
		legend : L.Control.extend({
			options : {
				"position" : 'bottomright',
				"text" : 'Legend'
			},
			initialize : function(options) {
				L.Util.setOptions(this, options);
			},
			onAdd : function(map) {
				// create the control container with a particular class name
				return L.DomUtil.create('div', 'leaflet-control-legend');
			}
		})
	},
	popup : null,
	initCenterLatLng : [35, -100],
	initCenterZoom : 4,
	showLayers : [], //layers are shown in the map
	dataTable : null,
	demographicData : {
		"fam_size" : "average faimily size",
		"income" : "median household income",
		"age0_9" : "age 5 to 9 years",
		"age10_19" : "age 10 to 19 years",
		"age20_64" : "age 20 to 64 years",
		"age65_abov" : "age 65 years and above",
		"pop" : "population",
		"popDen" : "population density"

		/*
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
		 */
	},
	geojsonReader : new jsts.io.GeoJSONReader(),
	mapGalleryHtml : "",
	css : {
		"dataTable_highlightRow" : {
			"background-color" : "#ED3D86",
			"color" : "#ffffff"
		},
		"dataTable_height" : function() {
			return $("#dataPanel").height() - 70
		}
	},
	$tr : null,
	userInfo : {
		email : null,
		city : null,
		country : null,
		valideCreditcard : false,
		accountType : null,
		credit : null,
		oauth : null
	},
	oauthWindow : null,
	tutorial : null,
	introJS : null,
	geomask : false,
	highlightMarker : new L.Marker([0, 0])
}

//read demographic data
pathgeo.service.demographicData({
	// filter:{
	// type:"zipcode",
	// value:"94131"
	// },
	callback : function(geojsonLayer) {
		app.layers.demographicData = geojsonLayer;
		//showDemo data
		//showDemo('SAN FRANCISCO');
	}
});

//load getSatisfiction help
// $.getScript("https://loader.engage.gsfn.us/loader.js", function(scipt) {
	// if ( typeof GSFN !== "undefined") {
		// GSFN.loadWidget(5632, {
			// "containerId" : "getsat-widget-5632"
		// });
	// }
// });

//init
$(document).on({
	"ready" : function() {

	},
	"pageshow" : function() {
		init_login();

		init_UI();

		init_map();

		//getClientGeo();

		readTutorial();
	},
	"pageinit" : function() {
		//popup not use history to avoid the problem that the dialog cannot be closed and may be redirected to other page
		$("div[data-role='popup']").popup({
			history : false
		});
	}
});

//init login and read cookie
function init_login() {
	if ($.cookie("PathGeo")) {
		var email = app.userInfo.email = $.cookie("PathGeo").email,
			oauth = app.userInfo.oauth = $.cookie("PathGeo").oauth;

		//get user account info
		getAccountInfo(email);

		//google anlytics tracking event
		_gaq.push(['_trackEvent', 'Account', 'Login', email]);
	} else {
		//$("#dialog_login").popup("open");
		var interval = setInterval(function() {
			if ($("#dialog_login-popup").css("top") != "-99999px") {
				clearInterval(interval);
			} else {
				$("#dialog_login").popup("open");
			}
		}, 500);
	}
}

//init openlayers
function init_map() {
	app.map = L.map("div_map", {
		center : app.initCenterLatLng,
		zoom : app.initCenterZoom,
		layers : [app.basemaps["Light Gray Background Map"]],
		attributionControl : true,
		trackResize : true
	});

	//move the location of zoomcontrol to the bottom right
	app.map.zoomControl.setPosition("bottomright");

	//layers control
	app.controls.toc = L.control.layers(app.basemaps).setPosition("topright");

	//map gallery control
	$.each(app.controls, function(k, v) {
		//toc is hidden in the map
		if (k == "toc") {
			app.map.addControl(v);
		} else {
			app.map.addControl(new v());
		}
	});

	//change leaflet attribution
	$(".leaflet-control-attribution a:first-child").attr("href", "http://www.pathgeo.com").html("PathGeo");
	//$(".leaflet-control-attribution").append(" and <a href='http://www.maxmind.com/en/javascript'>GeoIP2 JavaScript from MaxMind</a>")
	$(".leaflet-control-attribution").append(" & Icon from <a href='http://medialoot.com/item/free-vector-map-location-pins/' target='_blank'>MediaLoot</a>")
	app.map.on("baselayerchange", function(e) {
		$(".leaflet-control-attribution a:first-child").attr("href", "http://www.pathgeo.com").html("PathGeo");
	})
	//open popup event
	app.map.on({
		'popupopen' : function(e) {
			//if the popup source is zipcode layer
			//			if($(e.popup._content).hasClass('zipcodePopup')){
			//				$(".leaflet-tile-pane").css({opacity:0.3, "z-index":6});
			//			}
		},
		'popupclose' : function(e) {
			//if the popup source is zipcode layer
			//			if($(e.popup._content).hasClass('zipcodePopup')){
			//				$(".leaflet-tile-pane").css({opacity:1, "z-index":2});
			//			}
		},
		'baselayerchange' : function(e) {
			var name = e.layer.options.title;
			if (name && name != "" && app.userInfo.email && app.userInfo.email != '') {
				_gaq.push(['_trackEvent', 'BaseMap', name, app.userInfo.email]);
			}
		}
	});
}

//init UI
function init_UI() {

	//content height
	$("#content").height($(window).height() - $("#header").height());

	//show main menu
	//if directly show the main menu while initlizing the webpage, the main menu will be immediately disppeared in Chrome (noraml in the Firefo).
	//JQM said this is the bug from webkit(Goolge chrome) https://github.com/jquery/jquery-mobile/issues/5775
	setTimeout(function() {
		//$("#dialog_uploadData").popup("open");
	}, 1000);

	//adjust infoPanel height
	$(".infoPanel").css({
		height : $("#content").height() - 20,
		width : $("#content").width() * 0.375
	});

	//when window resize
	$(window).resize(function() {
		$("#content").height($(window).height() - $("#header").height());
		$(".infoPanel").css({
			height : $("#content").height() - 20,
			width : $("#content").width() * 0.375
		});
		//resize dataTable height
		$(".dataTables_scrollBody").css({
			height : app.css.dataTable_height()
		})
	})
	//slider
	$('#slider').nivoSlider({
		effect : "fade"
	});

	//mapPopupWidget
	$(".mapPopupWidget").on({
		mouseover : function() {

		},
		mouseleave : function() {
			$(".mapPopupWidget").hide();
		}
	})

	//when mouse click on otherplace, hide dataTable_menu
	$(document).mouseup(function(e) {
		var $container = $(".dataTable_menu, #dataTable_chartControlMenu, .mapPopupWidget, #userPopupMenu");
		if (!$container.is(e.target) && $container.has(e.target).length === 0) {
			$container.hide();
		}
	});

	//businessActions selection change
	$("#businessActions_type").change(function() {
		showBusinessAction(this.value);
	});

	//add close button in the infoPanel
	$(".infoPanel").append("<a id='closeInfoPanel' href='#' data-role='button' data-theme='a' data-icon='delete' data-iconpos='notext'  style='position:absolute; right:-10px; top:-6px;z-index:500;' onclick='closeInfoPanel()'>Close</a>")
	$(".infoPanel #closeInfoPanel").buttonMarkup("refresh");

	//click event for mapPopupWidget geoJsonLayer
	$("#mapPopup_geoJsonLayer .mapPopupWidget_content ul li").click(function() {
		var $img = $(this).find("img"), img_src = $img.attr("src"), width = $img.attr("markerWidth"), height = $img.attr("markerHeight");

		changeMarkerIcon(img_src, width, height);
	});

	//click event for userMenuContent
	$("#userMenu_button ul li").click(function() {
		var $this = $(this), target = $this.attr("target"), $target = $("#" + target);

		//add active class on the click button
		$this.addClass("userMenu_buttonActive").siblings().removeClass("userMenu_buttonActive");

		$(".userMenuContent").hide();
		$target.show();
	});



	//Keep track of currently uploaded file
	var currentFileName = '';

	//This is necessary to prevent being redirected when uploading data...
	$('#uploadData_form').on('submit', function(e) {
		if (e.preventDefault)
			e.preventDefault();
		return false;
	});

	//Submits form when user selects a file to upload
	//The reponse is a list of column names, which are used to populate the drop-down menu
	$("#uploadData_input").change(function() {
		$("#uploadData_error").html('');
		$("#uploadData_confirm, #uploadData_error, #geocoding_loading").hide();
		$("#uploadData_description, #uploadData_loading").show();

		//if no file is selected
		if ($(this).val() == '') {
			$("#uploadData_loading").hide();
			return;
		}

		$("#uploadData_form").ajaxSubmit({
			dataType : 'json',
			success : function(tableInfo) {
				//if user's credit is not enough, a error msg will return back.
				if (tableInfo && tableInfo.status && tableInfo.status == 'error') {
					$("#uploadData_description, #uploadData_loading, #uploadData_confirm ul").hide();
					$("#uploadData_confirm").show();

					//style the error msg
					var html = "";
					$.each(tableInfo.msg.split("<br>"), function(i, msg) {
						if (i == 0) {
							html += "<h3>" + msg + "</h3>"
						} else {
							html += msg + "<p></p>";
						}
					})
					$("#uploadData_error").html(html).show();
					return;
				}

				var rowCount = tableInfo.rowCount;

				//check rowCount and calculate credit
				calculateCredit(rowCount);

				//remove old options
				var $fieldset = $("#uploadData_field");
				//$("#uploadData_geocodingFields").html("");

				//var columns = tableInfo.columns;
				var columns = tableInfo.jsonCols, html_suggested = "", html_others = "";
				currentFileName = tableInfo.fileName;

				//set new options according to the returned value names
				for (var indx = 0; indx < columns.length; indx++) {
					var column = columns[indx].name;

					if (columns[indx].suggested) {
						html_suggested += '<input type="checkbox" name="' + column + '" id="' + column + '" checked ><label for="' + column + '">' + column + "   <span style='color: red;'>[Suggested field: " + columns[indx].suggested + "]</span></label>";
					} else {
						html_others += '<input type="checkbox" name="' + column + '" id="' + column + '"><label for="' + column + '">' + column + "</label>";
					}
				}
				var html = "<fieldset data-role='controlgroup' data-mini='true'><legend>Select geocoding columns:</legend>" + html_suggested + html_others + "</fieldset>";
				$fieldset.html(html).trigger('create')

				//check default checked value
				var candidates = ["x", "y", "lat", "lon", "latitude", "longitude", "geo", "coordinates", "coordinate"];
				$fieldset.find("input:checked").each(function() {
					if ($.inArray(this.id, candidates) != -1) {
						calculateCredit(rowCount, true);
					} else {
						calculateCredit(rowCount);
					}
				})
				//chkeckbox click event
				$fieldset.find("input[type='checkbox']").click(function() {
					calculateCredit(rowCount);
					$fieldset.find("input:checked").each(function() {
						if ($.inArray(this.id, candidates) != -1) {
							calculateCredit(rowCount, true);
						}
					})
				})

				$("#uploadData_description, #uploadData_loading").hide();
				$("#uploadData_confirm").show();

			},
			error : function(error) {
				console.log(error.responseText);
			}
		});

	});

	//Submits upload file form and captures the response
	//$('#uploadData_form').submit( function() {
	$('#submit_button').click(function() {
		//var geoColumnVal = $("#uploadData_geocodingField").val();
		var geoColumns = $.map($("#uploadData_field input:checked"), function(item) {
			return item.id;
		});
		var checked = $("#uploadData_agreementCheck").prop("checked");

		if (!checked) {
			alert("You must agree to the PathGeo agreement before your data is geocoded.");
			return;
		}

		//show geocoding loading icon
		$("#geocoding_loading").show();

		//process time
		var startTime = Date.now();

		$.ajax({
			dataType : 'json',
			url : "python/retrieveAndGeocode.py",
			data : {
				fileName : currentFileName,
				geoColumns : geoColumns,
				username : app.userInfo.email,
				oauth : app.userInfo.oauth
			},
			success : function(featureCollection) {
				//console.log(featureCollection.columns);
				//error handler
				if (featureCollection && featureCollection.status && featureCollections.status == 'error') {
					console.log(featureCollection.msg)
					return;
				}

				//end time and track ProcessTime event
				var endTime = Date.now(), processTime = Math.round((endTime - startTime) / 1000);
				if (app.userInfo.city && app.userInfo.country) {
					_gaq.push(['_trackEvent', 'ProcessTime', app.userInfo.country, app.userInfo.city, processTime]);
				}

				//track data event
				var filePath = $("#uploadData_input").val(), fileNames = filePath.split("."), extName = fileNames[fileNames.length - 1];
				if (extName && extName != '') {
					_gaq.push(['_trackEvent', 'Data', "Format-" + extName, app.userInfo.email]);
				}

				//close dialog_menu
				$("#dialog_uploadData").popup('close');

				if (!featureCollection || featureCollection.features.length <= 0) {
					alert("No rows could be geocoded.  Please make sure you have selected the correct location column.");
					return;
				}

				if (app.geocodingResult.geoJsonLayer) {
					app.map.removeLayer(app.geocodingResult.geoJsonLayer);
				}
				
				app.geocodingResult = {
					type : "GEOJSON",
					json : featureCollection,
					srs : "EPSG:4326",
					title : currentFileName,
					keywords : ["testing"],
					column : {
						statistics : ""
					},
					downloadLink : (featureCollection["URL_xls"] && featureCollection["URL_xls"] != "") ? featureCollection["URL_xls"] : null,
					dataID : featureCollection.dataID,
					hasGeomask : (featureCollection.features[0].geomasked_geometry) ? true : false
				};

				showTable(app.geocodingResult);
				//showSumup(featureCollection)

				//update user account info
				updateAccountInfo(app.userInfo.email);

				$("#geocoding_loading").hide();

			},
			error : function(error) {
				console.log("Error:");
				console.log(error.responseText);
			}
		});

	});
	$("#layer_selector").hide();
}

//calculate credit
function calculateCredit(rowCount, isLatLon) {
	var credit = app.userInfo.credit, neededCredit = (isLatLon) ? Math.round(rowCount / 10) : rowCount, balance = credit - neededCredit, msg = null;

	//default value
	$("#uploadData_controls").show();
	$("#submit_button").val("Map Your Data (All records)");

	//check credit, if credit==0 > hide main tools
	if (credit == 0) {
		$("#uploadData_controls").hide();
	}

	//check balance
	if (balance < 0) {
		var geocodeCount = (isLatLon) ? credit * 10 : credit;
		balance = "<font style='color:#FF0000; font-weight:bold;'>" + balance + "</font>";
		msg = 'Only top ' + geocodeCount + ' will be geocoded!<br>Or buy some credits to geocode all records.';
		$("#submit_button").val("Map Your Data (Only top " + geocodeCount + " records)")
	}

	//show
	$("#uploadData_yourCredit").html(credit);
	$("#uploadData_rowCount").html(rowCount);
	$("#uploadData_neededCredit").html(neededCredit);
	$("#uploadData_balance").html(balance);
	$("#uploadData_balanceMsg").html(msg);
}

function showSumup(geojson) {
	//add properties in the select_sumup
	var html = "<option value='none'>Please choose..</option>"
	$.each(geojson.features[0].properties, function(k, property) {
		if (!isNaN(property)) {
			html += "<option value='" + k + "'>" + k + "</option>"
		}
	});

	//show dialog_sumup
	$("#sumup_select").html(html).selectmenu("refresh");
	setTimeout(function() {
		$("#dialog_sumup").popup('open');
	}, 200);
}

//resize map
function resizeMap(css_map, css_dataPanel) {
	$("#div_map").animate(css_map, 500, function() {
		app.map.invalidateSize(false);

		$("#dataPanel").css(css_dataPanel);

		//resize dataTable height
		$(".dataTables_scrollBody").css({
			height : app.css.dataTable_height()
		})
	});
}

//sum up
function sumup(skip) {
	var value = $("#sumup_select").val();
	app.geocodingResult.column.statistics = "";

	if (value != 'none' && skip != true) {
		app.geocodingResult.column.statistics = value;
	}

	showTable(app.geocodingResult);

	$('.ui-dialog').dialog('close');
	//For some reason, the dialog closes very slowly,
	//so need to delay resetting these components until it is closed
	setTimeout(function() {
		$("#uploadData_description").show();
		$("#uploadData_confirm, #uploadData_controls").hide();
		$("#dialog_sumup").popup('close');

		//clear checkbox
		$("#uploadData_agreementCheck").attr('checked', false).checkboxradio("refresh");

		//clear file selected
		$("#uploadData_input").val('');
		//not sure this works with IE or Opera
		$("#geocoding_loading").hide();
	}, 100);
}

//change markerIcon
function changeMarkerIcon(img_src, width, height) {
	var icon = new L.icon({
		iconUrl : img_src,
		iconSize : [width, height], //[12.5, 21],
		iconAnchor : [width / 2, height / 2]// [6.25, 10.5]
	});

	var iconHover = new L.icon({
		iconUrl : (function() {
			
			if(img_src.split("bullet").length>1){
				return "images/1374590745_bullet-red.png"
			}else{
				return "images/marker/Magenta/5.png"
				//return "images/1374595382_marker_rounded_red.png"
			}
		})(),
		iconSize : [width, height], //[12.5, 21],
		iconAnchor : [width / 2, height / 2]// [6.25, 10.5]
	});

	$.each(app.geocodingResult.geoJsonLayer._layers, function(k, marker) {
		marker.setIcon(icon);
		marker.options.iconDefault = icon;
		marker.options.iconHover = iconHover;
	})
	
	//hide hightlight marker
	if(app.highlightMarker){
		app.highlightMarker.setIcon(iconHover)
	}
}

//load geojson
function showLayer(obj, options) {
	//options
	if (!options) {
		options = {}
	}
	options.isShow = ( typeof options.isShow === 'undefined') ? false : options.isShow;
	options.zoomToExtent = ( typeof options.zoomToExtent === 'undefined') ? true : options.zoomToExtent;

	//show title
	if (obj.title) {
		$("#lbl_dataName").html(obj.title);
	}

	//feature count
	obj.featureCount = 0;

	//layers
	obj.layers = [];


	//show layer
	switch(obj.type) {
		case "GEOJSON":

			//show geojson
			//need to be prior than the main part, otherwise this function will not be triggered in Firefox
			function showGeojson(object) {
				parseGeojson(object);
				addLayer(object);

				//make geojsonLayer as the default layer > change the background-color of the map gallery icon
				$('.leaflet-control-mapGallery ul li[layer="geoJsonLayer"]').css('background-color', "#5B92C0");

				//hide loadData dialog
				$("#dialog_uploadData").popup("close");
			}

			//parse geojson
			function parseGeojson(obj) {
				//clear layers
				clearLayers();

				var layers = [], zipcodes = {}, statisticsColumn = obj.column.statistics || null, totalSum = 0;

				if (statisticsColumn && statisticsColumn != '') {
					totalSum = obj.dataTable.statisticsColumn[statisticsColumn].sum;
				}

				//marker layer
				obj.geoJsonLayer = new L.geoJson(obj.json, {
					onEachFeature : function(feature, layer) {
						var html = pathgeo.util.objectToHtml(feature.properties, ["_featureID", "_rowID"]);

						//highlight keyword
						html = pathgeo.util.highlightKeyword(obj.keywords, html);

						//info window
						layer.bindPopup(html, {
							maxWidth : 500,
							maxHeight : 300
						});

						//based on _featureID to insert layer into layers
						//That means it is the geocoding layer
						if (feature.properties._featureID >= 0) {
							var id = feature.properties["_featureID"];
							layers[id] = layer;

							//if feature contains zipcode field, then calculate information in the feature attribute, e.g. how many users in the zip code, the sum of sales
							if (feature.properties[app.zipcodeFieldName]) {
								var code = feature.properties[app.zipcodeFieldName], columnValue = parseFloat(feature.properties[statisticsColumn]);

								if (zipcodes[code]) {
									var properties = zipcodes[code].feature.properties;
									properties["extra-ids"].push(id);
									properties["extra-count"] += 1;
									properties["extra-" + statisticsColumn + "_sum"] += columnValue;
								} else {
									//assign zipcode layer in the demographic layer to the zipcodes array
									if (app.layers.demographicData && app.layers.demographicData.zipcodes[code]) {
										var zipcodeLayer = app.layers.demographicData.zipcodes[code], properties = zipcodeLayer.feature.properties;

										properties["extra-ids"] = [id];
										properties["extra-count"] = 1;
										properties["extra-" + statisticsColumn + "_sum"] = columnValue;

										zipcodes[code] = zipcodeLayer;
									}
								}
							}
						}

						//event
						layer.on({
							mouseover : function(e) {
								showLocalInfo(e.target.feature.properties._featureID, {
									scrollToRow : true,
									zoomToCenter : false,
									showPopup : false
								});
							},
							mouseout : function(e) {
								//e.target.setIcon(e.target.options.iconDefault)
								//app.map.closePopup();
								//app.map.removeLayer(app.highlightMarker);
							},
							click : function(e) {
								//show local info
								showLocalInfo(e.target.feature.properties._featureID, {
									scrollToRow : true,
									zoomToCenter : false
								});
							},
							dragend : function(e) {
								//console.log(e)
								//console.log(e.target.getLatLng());
							},
							drag : function(e) {
								//console.log(e);
								//console.log(e.target.getLatLng());
							}
						})
					},

					//style
					style : {},

					//pointToLayer to change layers' icon
					pointToLayer : function(feature, latlng) {
						//geomask
						if (app.geomask && feature["geomasked_geometry"]) {
							coords = feature["geomasked_geometry"].coordinates;
							latlng = new L.LatLng(coords[1], coords[0]);
						}

						var width = 16, height = 21.6;

						var icon = new L.icon({
							iconUrl : "images/marker/blue/5.png", //"images/1374596320_marker_rounded_light_blue.png",//"images/1374590792_bullet-black.png", //
							iconSize : [width, height], //[12.5, 21],
							iconAnchor : [width / 2, height / 2]// [6.25, 10.5]
						});

						var iconHover = new L.icon({
							iconUrl : "images/marker/Magenta/5.png", //"images/1374590745_bullet-red.png", //
							iconSize : [width, height], //[26, 26],
							iconAnchor : [width / 2, height / 2] //[13, 13]
						})
						return new L.marker(latlng, {
							icon : icon,
							iconHover : iconHover,
							iconDefault : icon,
							draggable : true
						})
					},

					//filter
					filter : function(feature) {
						var coordinates = feature.geometry.coordinates;

						//filter out the lat and lng = 0,0  or -1,-1
						if ((coordinates[0] != 0 && coordinates[1] != 0) && (coordinates[0] != -1 && coordinates[1] != -1)) {
							return true;
						} else {
							return false;
						}
					}
				});
				obj.geoJsonLayer.layers = layers;

				//zipcodes
				//sort based on the count of customers('extra-count')
				var array_zipcodes = $.map(zipcodes, function(v, k) {
					return v
				});
				array_zipcodes.sort(function(a, b) {
					return b.feature.properties["extra-count"] - a.feature.properties["extra-count"]
				})
				//give rank of the count of customers
				$.each(array_zipcodes, function(i, layer) {
					layer.feature.properties["extra-count-rank"] = i + 1;
				});

				if (statisticsColumn && statisticsColumn != '') {
					array_zipcodes.sort(function(a, b) {
						return b.feature.properties["extra-" + statisticsColumn + "_sum"] - a.feature.properties["extra-" + statisticsColumn + "_sum"]
					})
					//give rank of the count of customers
					$.each(array_zipcodes, function(i, layer) {
						layer.feature.properties["extra-" + statisticsColumn + "_sum-rank"] = i + 1
					});
				}

				$.each(zipcodes, function(i, zipcodeLayer) {
					var properties = zipcodeLayer.feature.properties;

					//bind popup on the zipcode layer
					//						zipcodeLayer.bindPopup(
					//							"<div class='zipcodePopup'><h3>Your customers in Zipcode: " + properties["ZIP"] + "</h3>"+
					//							"<ul class='objToHtml'>"+
					//							"<li><b>Total Customers: </b>" + properties["extra-count"] + "</li>"+
					//							"<li><b>Total "+ statisticsColumn +": </b>" + parseFloat(properties["extra-"+statisticsColumn+"_sum"]).toFixed(2) + " (" + parseFloat(properties["extra-"+statisticsColumn+"_sum"] / totalColumnValue).toFixed(4)*100 + "%)</li>"+
					//							"<li><div id='zipcodeChart'></div></li>"+
					//							"</ul>"+
					//							"<a href='#' onclick=\"showDemographicData('" + properties["ZIP"] +"');\" style='cursor:pointer;'>See more about the zipcode area.....</a></div>"
					//						);
					zipcodeLayer.on('click', function(e) {
						showBusinessAction('top_users')
						//showZipcodeChart("zipcodeChart", properties["ZIP"], properties["extra-" + statisticsColumn + "_sum"], totalColumnValue);
					});
				});

				obj.zipcodeLayer = zipcodes;

				//add geojsonlayer to toc
				app.controls.toc.addOverlay(obj.geoJsonLayer, "Marker Map");

				//markercluster layer
				obj.markerClusterLayer = pathgeo.layer.markerCluster(obj.json, {
					onEachFeature : function(feature, layer) {
						var props = feature.properties;
						//									var popupText = '';
						//
						//									for (var prop in props) {
						//										var fieldName = prop.charAt(0).toUpperCase() + prop.slice(1);
						//
						//										if (fieldName.toLowerCase() != "loc") {
						//											popupText += "<b>" + fieldName + "</b>: " + feature.properties[prop] + "<br>";
						//										}
						//									}
						//
						//									layer.bindPopup(popupText, { maxWidth: 500, maxHeight: 300 } );

						//event
						layer.on({
							mouseover : function(e) {

							},
							click : function(e) {
								//show local info
								showLocalInfo(e.target.feature.properties._featureID, {
									scrollToRow : true,
									zoomToCenter : false
								});
							}
						});
					},

					//pointToLayer
					pointToLayer : function(feature, latlng) {
						var icon = new L.icon({
							iconUrl : "images/1368754654_stock_draw-circle.png",
							iconSize : [12, 12], //[12.5, 21],
							iconAnchor : [6, 6]// [6.25, 10.5]
						});
						return new L.marker(latlng, {
							icon : icon
						})
					}
				}, {
					//clusterclick event
					clusterclick : function(e) {
						if (!e.layer._popup) {
							var properties = pathgeo.util.readClusterFeatureProperies(e.layer, []);
							var html = "<div class='popup'>There are <b>" + e.layer._childCount + "</b> twitters:<p></p><ul>";
							$.each(properties, function(i, property) {
								html += "<li><img src='images/1359925009_twitter_02.png' width=20px />&nbsp; &nbsp; <b>" + property[obj.fieldName.username] + "</b>: " + property[obj.fieldName.text] + "</li>";
							});
							html += "</ul></div>";
							html = html.replace(/undefined/g, "Tweet");

							//highlight keyword
							html = pathgeo.util.highlightKeyword(obj.keywords, html);

							e.layer.bindPopup(html, {
								maxWidth : 500,
								maxHeight : 300
							}).openPopup();
						} else {
							e.layer.openPopup();
						}
					}
				});
				app.controls.toc.addOverlay(obj.markerClusterLayer, "Cluster Map");

				//heatmap
				//heatmap
				var zoomLevel = app.map.getBoundsZoom(obj.geoJsonLayer.getBounds());
				var getRadius = function(i) {
					var radius = 6.25 * Math.pow(2, (17 - zoomLevel + i));
					radius = (radius >= 5000) ? 5000 : radius;
					radius = (radius >= 50) ? radius : 50;
					return radius;
				};
				//app.controls.toc.removeLayer(obj.heatMapLayer);
				obj.heatMapLayer = pathgeo.layer.heatMap(obj.json, getRadius(0), {
					opacity : 0.55
				});
				app.controls.toc.addOverlay(obj.heatMapLayer, "Heat Map");

				//set up heatmap slider
				$("#heatmap_slider").attr({
					'min' : 50,
					'max' : 3050,
					'step' : (3050 - 50) / 50,
					'value' : getRadius(0)
				}).on("slidestop", function(e) {
					var radius = e.currentTarget.value;
					var geocodingResult = app.geocodingResult;
					//remove existing heatmap
					if (geocodingResult.heatMapLayer._map) {
						app.map.removeLayer(geocodingResult.heatMapLayer);
					}
					app.controls.toc.removeLayer(geocodingResult.heatMapLayer);

					geocodingResult.heatMapLayer = pathgeo.layer.heatMap(geocodingResult.json, radius, {
						opacity : 0.55
					});
					geocodingResult.heatMapLayer.addTo(app.map);
					app.controls.toc.addOverlay(geocodingResult.heatMapLayer, "Heat Map");
				}).keypress(function(e) {
					//disable any actions
					return false;
				}).slider('refresh');
				$("#heatmap_radius .ui-input-text").html("Change Hot Spot's Radius (unit: Feet)");

				//showLayerNames
				//if this is the first time to load layers, the showLayerNames will be emplty.
				//so the default layer is geoJsonLayer
				if (obj.showLayerNames.length == 0) {
					obj.showLayerNames.push("geoJsonLayer");
				};
				$.each(obj.showLayerNames, function(i, name) {
					obj.layers.push(obj[name]);
				})
			}//end parseGeojson

			//main part
			if (!obj.json) {
				$.getJSON(obj.url, function(json) {
					//if json is an array of features
					obj.json = ( json instanceof Array) ? {
						type : "FeatureCollection",
						features : json
					} : json;
					showGeojson(obj);
				});
			} else {
				showGeojson(obj);
			}

			break;
		case "WMS":
			//default param
			if (obj.param && obj.param.layers) {
				obj.param.format = obj.param.format || 'image/png';
				obj.param.transparent = obj.param.transparent || true

				obj.layers.push(L.tileLayer.wms(obj.url, obj.param));

				//events
				obj.layers[0].on("load", function(e) {
					console.log("loaded");
				});

				//obj.layer.setOpacity(0.75).addTo(app.map).bringToFront();
				addLayer(obj);
				app.controls.toc.addOverlay(obj.layers[0], obj.name);
			}
			break;
	}

	//add layer
	function addLayer(obj) {
		if (options.isShow) {
			$.each(obj.layers, function(i, layer) {
				layer.addTo(app.map);
				app.showLayers.push(layer);
			})
			if (options.zoomToExtent) {
				app.map.fitBounds(obj.geoJsonLayer.getBounds());
			}

			//callback function when all features are shown on the map
			if (options.callback) {
				options.callback();
			}
		}

		//close dialog
		//$("#div_dialog").dialog("destroy");
		$("#img_loading").hide();

		//show mapGallery button
		$(".leaflet-control-mapGallery").show();

		$("#mapPopup_geoJsonLayer").show();
	}

}

//switch layer
function switchVisualization(types) {
	//remove all shown layers on the map
	removeLayers();

	var layer;
	$.each(types, function(i, type) {
		switch(type) {
			case "MARKERCLUSTER":
				layer = app.geocodingResult.markerClusterLayer.addTo(app.map);
				break;
			case "HEATMAP":
				layer = app.geocodingResult.heatMapLayer.addTo(app.map);
				break;
			case "GEOJSON":
				layer = app.geocodingResult.geoJsonLayer.addTo(app.map);
				break;
		}
		app.showLayers.push(layer);

		//google anlytics tracking event
		_gaq.push(['_trackEvent', 'Visualization', type, app.userInfo.email]);
	});

}

//remove all layers on the map
function removeLayers() {

	if (app.showLayers.length > 0) {
		$.each(app.showLayers, function(i, layer) {
			//if toc contains the layer
			if (app.controls.toc._layers[layer._leaflet_id]) {
				app.controls.toc.removeLayer(layer);
			}
			//remove layer from the map
			app.map.removeLayer(layer);
		});
		app.showLayers = [];
	}
}



//clear all default layers
function clearLayers(){
	var obj=app.geocodingResult;
	
	obj.showLayerNames=[];
	
	//remove layers
	var layerNames = ["geoJsonLayer", "markerClusterLayer", "heatMapLayer"];
	$.each(layerNames, function(i, layerName) {
		var layer = obj[layerName];
		console.log(layer)
		if (layer) {
			//if layer._map has map object, that means the layer is shown on the map
			if (layer._map) {
				obj.showLayerNames.push(layerName);
				app.map.removeLayer(layer);
			}
			app.controls.toc.removeLayer(layer);
		}
	});
}



//switch basemap
function switchBaseLayer(layer) {
	if (app.map.hasLayer(layer)) {
		app.map.removeLayer(layer)
	} else {
		layer.addTo(app.map);
	}
}

//show pivot table
//This first populates the table, then draws the geojson features
function showTable(obj, options) {
	//options
	if (!options) {
		options = {}
	}
	options.callback = options.callback || null

	//hide dataPanel_intro
	$("#dataPanel_intro").hide();

	//clear zipcodelayer if any
	if (app.layers.selectedZipcodeLayer && app.map.hasLayer(app.layers.selectedZipcodeLayer)) {
		app.map.removeLayer(app.layers.selectedZipcodeLayer);
		app.layers.selectedZipcodeLayer.clearLayers();
	}
	
	//remove highlighamrker
	if(app.highlightMarker){
		app.map.removeLayer(app.highlightMarker);
	}
	
	if (!obj.json) {
		$.getJSON(obj.url, function(json) {
			//if json is an array of features
			obj.json = ( json instanceof Array) ? {
				type : "FeatureCollection",
				features : json
			} : json;
			createTable(obj);
		});
	} else {
		createTable(obj);
	}

	//create table and chart
	function createTable(obj) {
		//convert geojson properties to array
		if (!obj.dataTable) {
			obj.dataTable = pathgeo.util.geojsonPropertiesToArray(obj.json, {
				statisticsColumn : obj.column.statistics
			});
		}

		var dataTable = obj.dataTable;
		
		//hide columns
		var hiddenColumns = ["Coordinates"];
		$.each(dataTable.columns_dataTable, function(i, column) {
			$.each(hiddenColumns, function(j, columnName) {
				if (columnName == column.sTitle) {
					column.bVisible = false;
					column.bSearchable = false
				}
			});
		});

		//if app.dataTable already exists, clear html in the .dataTable_na nad #dataTableControl to avoid duplicate nav and control toolboxes
		if (app.dataTable) {
			app.dataTable.fnDestroy();
			//if there is a exiting dataTable, we need to destroy first. Otherwise, the dataTable will read the previvous one to make errors.
			$(".dataTable_nav, #dataTable_control, #dataTable").html("");
		}

		//init app.dataTable
		app.dataTable = $('#dataTable').dataTable({
			"bDestroy" : true, //destroy current object if one exists
			"aaData" : dataTable.datas, //data
			"aoColumns" : dataTable.columns_dataTable, //column
			"bJQueryUI" : false,
			"bAutoWidth" : true,
			"bPaginate" : false,
			"sPaginationType" : "two_button", //"full_numbers",    //page number
			"sScrollY" : app.css.dataTable_height(),
			"sScrollX" : "100%",
			//"bDeferRender": true,
			"oLanguage" : {
				"sSearch" : ""
			},
			"iDisplayLength" : 1000,
			"sDom" : '<"dataTable_toolbar"<"dataTable_nav"><"dataTable_tools"if><"dataTable_menu"<"infobox_triangle"><"infobox">>><"dataTable_table"rtS<>>', //DOM
			"fnInitComplete" : function(oSettings, json) {
				$("#" + oSettings.sTableId + "_filter input")
				//.val("Filter data results by keyword")
				.attr({
					"title" : "Filter data results by keyword",
					"placeholder" : "Filter data results by keyword"
				}).prop("type", "search").textinput();

				//need to wait a few time to adjust the column size
				setTimeout(function() {
					//backup orginal json to defaultJSON
					if (!obj.defaultJSON) {
						obj.defaultJSON = obj.json;
					}

					//ajust column width
					app.dataTable.fnAdjustColumnSizing();

					//get all tr
					app.$tr = $(".dataTable tr");

					//draw layers on the map
					showLayer(obj, {
						isShow : true,
						callback : options.callback
					});

					//re-draw Chart
					showDataTableChart(obj.json);

					//show show/hide table button
					$("#showhideTable").show();

					//enforce adjusting the position of table header. Sometime the location will be to the end of the table
					$(".dataTables_scrollHeadInner table").css({
						top : "0px"
					})

					//resize map to show the dataTable
					resizeMap({height : "75%"}, {height : "25%"});
					
				}, 50);

			},
			"fnRowCallback" : function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
				//only give the attr "_featureID" into each tr at the first time
				if ($(nRow).attr("_featureID") == undefined) {
					$(nRow).attr({
						"_featureID" : iDisplayIndexFull,
						"_rowID" : iDisplayIndexFull
					});

					var properties = obj.json.features[iDisplayIndexFull].properties;
					properties["_featureID"] = iDisplayIndexFull;
					properties["_rowID"] = iDisplayIndexFull;
				}
			},
			fnDrawCallback : function(oSettings) {

				//dataTable info
				var $info=$("#dataTable_info"), infoHtml=$info.html(), splits=infoHtml.split("(filtered");
				if(splits.length>0 && splits[1]){
					if(splits[0].split('<br>').length==1){
						infoHtml=splits[0]+"<br>(filtered"+splits[1];
						$info.html(infoHtml).css({"margin-top":"2px"})
					}
				}else{
					$info.css({"margin-top":"13px"})
				}


				//only works while filter input box is focused!!
				if ($(".dataTables_filter input").is(":focus")) {
					//console.log('filter refresh map');

					//get filter data,
					var me = this, 
						features = obj.defaultJSON.features, geojson = {
							type : "FeatureCollection",
							features : []
						}, feature, 
						$selectedData = me.$('tr', {"filter" : "applied"});

					//remove demographic data
					if (app.layers.demographicData) {
						app.map.removeLayer(app.layers.demographicData);
					}

					//reset table style
					var $tr = $("#dataTable tr");
					$.each(app.css["dataTable_highlightRow"], function(k, v) {
						$tr.css(k, "");
					});
					

					//to avoid refresh too frequently to mark high CPU usage
					setTimeout(function() {
						if (me.$('tr', {"filter" : "applied"}).length == $selectedData.length) {
							
							//read selected layers
							var zipcodes = {}, zipcode = '', filterRowIDs = [];
							
				
							me.$('tr', {"filter" : "applied"}).each(function(i, tr) {
								feature = features[this._DT_RowIndex];
								feature.properties["_rowID"] = i;
								geojson.features.push(feature);

								//push row id into filterRowIDs for downloading selected rows in the server side
								filterRowIDs.push(this._DT_RowIndex);

								//save zipcode
								zipcode = feature.properties[app.zipcodeFieldName];
								if (zipcode) {
									if (zipcodes[zipcode]) {
										zipcodes[zipcode] += 1;
									} else {
										zipcodes[zipcode] = 1;
									}
								}
							});

							//save filterRowID into app.geocodingResult
							obj.filterRowID = filterRowIDs.join(",");
							obj.filterTerm = $(".dataTables_filter input").val();
							

							//convert zipcodes object to array
							zipcodes = $.map(zipcodes, function(v, k) {
								return k
							});

							//overwrite app.geocodingResult.json and showlayer
							if (geojson.features.length > 0) {
								obj.json = geojson;
								showLayer(obj, {
									isShow : true
								});

								//re-draw Chart
								showDataTableChart(obj.json);

								if (zipcodes.length > 0) {
									//if users cancel the keywords, or didnot do any filter, then hide zipcode layer
									if (me.$('tr', {
										"filter" : "applied"
									}).length == features.length) {
										if (app.layers.selectedZipcodeLayer && app.map.hasLayer(app.layers.selectedZipcodeLayer)) {
											app.map.removeLayer(app.layers.selectedZipcodeLayer);
											app.layers.selectedZipcodeLayer.clearLayers();
										}
									} else {
										//highlightZipcode(zipcodes);
									}

								}
							}
						}
					}, 500)
				}

			}//end drawCallback
		});
		// end init dataTable

		//set all columns in to app.dataTable. Should have another way to get columns
		app.dataTable.columns = dataTable.columns;

		//add dataTable tools and click event
		var html = "<ul>" +
		//"<li><img src='images/1365859519_cog.png' title='setting'/></li>"+
		((obj.downloadLink) ? "<li><img src='images/1365858910_download.png' title='download'/><span>Download</span></li>" : "") +
		//"<li><img src='images/1365858910_download.png' title='download selected data'/><span>Download Selected Data</span></li>" +
		//"<li><img src='images/1365858892_print.png' title='print'/><span>Print</span></li>" +
		"<li><img src='images/1365859564_3x3_grid_2.png' title='show / hide columns'/><span>Show/hide Columns</span></li>" + ((obj.hasGeomask) ? "<li><img src='images/1376481601_Security.png' title='geomask'/><span>GeoMask</span></li>" : "") + "<li><img src='images/1375655879_br_up.png' title='More Table'/><span>More Table</span></li>" +
		//"<li><img src='images/1365860260_chart_bar.png' title='demographic data'/></li>"+
		//"<li><img src='images/1365978110_gallery2.png' title='map gallery'/></li>" +
		//"<li><img src='images/1365872733_sq_br_down.png' title='maximum map'/></li>"+
		"</ul>";
		$(".dataTable_tools").append(html).find("ul li").click(function() {
			var $this = $(this), $img = $this.find("img"), $span = $this.find("span"), title = $img.attr('title');

			//download excel url
			switch (title) {
				case "download":
					//disabled selected and geomask
					$("#downloadType_all_geomask, #downloadType_selected, #downloadType_selected_geomask").checkboxradio('disable');
				
					//check if geomask
					if(app.geomask){
						$("#downloadType_all_geomask").checkboxradio('enable');
					}
				
					//check if user filter some data
					if (app.geocodingResult.filterRowID && app.geocodingResult.filterTerm) {
						$("#downloadType_selected").checkboxradio('enable');
						
						if(app.geomask){
							$("#downloadType_selected_geomask").checkboxradio('enable');
						}
					}
					$("#dialog_download").popup('open');
					break;
				case "print":
					//window.open("print.html", "Map Time", "width=800, height=500, status=no, toolbar=no, fullscreen=yes, channelmode=yes, location=no, menubar=no, titlebar=no")
					print();
					break;
				case "show / hide columns":
					//show content in the infobox
					showInfobox(title, {
						left : $(this).offset().left,
						top : $(this).offset().top - 25
					}, this);
					break;
				case "More Table":
					$img.attr({
						'title' : 'Less Table',
						'src' : 'images/1375655890_br_down.png'
					});
					$span.html("Less Table");
					resizeMap({
						height : "47.5%"
					}, {
						height : "52.5%"
					});
					break;
				case "Less Table":
					$img.attr({
						'title' : 'More Table',
						'src' : 'images/1375655879_br_up.png'
					});
					$span.html("More Table");

					resizeMap({
						height : "75%"
					}, {
						height : "25%"
					});
					break;
				case "geomask":
					$("#dialog_geomask").popup('open');
					break;
			}

			//google anlytics tracking event
			_gaq.push(['_trackEvent', 'Tools_dataTable', title, app.userInfo.email]);
		});

		//dataTable nav bar
		$(".dataTable_nav").html($("#dataTable_nav").html())

		//copy dataTable toolbar html to dataTable_control
		$("#dataTable_control").html($(".dataTable_toolbar"));

		//click on rows
		$("#dataTable tr:not([role='row'])").on({
			click : function() {
				showLocalInfo($(this).context._DT_RowIndex, {
					scrollToRow : false,
					zoomToCenter : true
				});
			},
			mouseover : function() {
			}//showLocalInfo($(this).context._DT_RowIndex, {scrollToRow: false,zoomToCenter: true});}
		});

		//draw Chart
		//add values to the select X and Y
		var html = ""
		$.each(dataTable.columns, function(i, columnName) {
			html += "<option>" + columnName + "</option>";
		});

		//add events
		var onchange = function() {
			//show chart
			showDataTableChart(obj.json);
		}//end onchange event
		//give the html and onchange event to the selects and trigger change event
		$("#dataTable_chart #select_x").append(html).change(onchange).val("name").change();
		$("#dataTable_chart #select_y").append(html).change(onchange).val(app.geocodingResult.column.statistics).change();
		$(".dataTable_chartType").click(onchange);

		//show dataTable Panel
		showInfoPanel("dataPanel", $("#menuToolbox ul li:first-child")[0])

	}//end createTable

}

//show info box while user click on dataTable tools
function showInfobox(type, css, dom) {
	var $dom = $(dom);
	var html = type + "<br><ul>";
	switch(type) {
		case "show / hide columns":
			//get all columns name from table
			$.each(app.dataTable.columns, function(i, columnName) {
				//check if the columnName is visible in the dataTable
				var isShow = ($(".dataTable th:contains('" + columnName + "')").length > 0) ? 'checked' : '';
				html += "<li><input type='checkbox' id=" + i + " " + isShow + " onclick='app.dataTable.fnSetColumnVis(this.id, this.checked); ColVis.fnRebuild(app.dataTable);' />&nbsp; &nbsp; " + columnName + "</li>";
			});
			break;
		case "demographic data":
			//get all columns name from table
			$.each(app.demographicData, function(k, v) {
				html += "<li><input type='radio' name='demographic' value=" + k + " onclick='if(this.checked){app.layers.demographicData.redrawStyle(this.value); app.layers.demographicData.addTo(app.map);}' />&nbsp; &nbsp; " + v + "</li>";
			});
			break;
		case "map gallery":
			var mapGalleries = [{
				label : "marker map",
				value : "GEOJSON",
				layerName : "geoJsonLayer"
			}, {
				label : "cluster map",
				value : "MARKERCLUSTER",
				layerName : "markerClusterLayer"
			}, {
				label : "heat map",
				value : "HEATMAP",
				layerName : "heatMapLayer"
			}];

			$.each(mapGalleries, function(i, gallery) {
				html += "<li><input type='radio' name='mapGallery' value='" + gallery.value + "' " + ((app.geocodingResult[gallery.layerName]._map) ? "checked=checked" : "") + " onclick='if(this.checked){switchVisualization([this.value]);}' />&nbsp; &nbsp; " + gallery.label + "</li>";
			});
			break;
		case "canned report":
			var reports = ["demographic data report", "social media report"];
			$.each(reports, function(i, report) {
				html += "<li><input type='radio' name='mapGallery' value='" + report + "' " + " onclick='' />&nbsp; &nbsp; " + report + "</li>";
			});
			break;
		case "print":
			window.print();
			return;
			break;

	}
	html += "</ul>";

	$(".dataTable_menu .infobox").html(html);
	$(".dataTable_menu").css(css).show();
}

//show local info
function showLocalInfo(fid, options) {
	var layer = app.geocodingResult.geoJsonLayer.layers[fid];

	if (layer) {
		var feature = layer.feature, zipcode = feature.properties[app.zipcodeFieldName];

		//options
		if (!options) {
			options = {}
		}
		options.scrollToRow = options.scrollToRow || false;
		options.zoomToCenter = options.zoomToCenter || false;
		options.showPopup = options.showPopup || false;

		//show dataTable panel
		//showInfoPanel("dataPanel", $("#menuToolbox li[title='Your Uploaded Data']")[0]);

		//close popup
		app.map.closePopup();

		//scroll to the selected row
		if (options.scrollToRow) {
			var rid = feature.properties["_rowID"];
			app.dataTable.fnSettings().oScroller.fnScrollToRow(rid, false);
		}

		//zoom to the layer, shift lng a little bit to east
		if (options.zoomToCenter) {
			var latlng = layer._latlng;
			app.map.setView(new L.LatLng(latlng.lat, latlng.lng - 0.0025), 14)
		}

		//open popup
		if (options.showPopup) {
			layer.openPopup();
		}

		//highlight the tr in the dataTable
		$.each(app.css["dataTable_highlightRow"], function(k, v) {
			app.$tr.css(k, "");
		});
		app.$tr.closest("[_featureID=" + fid + "]").css(app.css["dataTable_highlightRow"]);

		//show highlight marker
		app.highlightMarker.setIcon(layer.options.iconHover).setLatLng(layer.getLatLng()).addTo(app.map);

		//layer.setIcon(layer.options.iconHover);

		//trigger businessActions type to directly show the first option and draw its google chart
		$("#businessActions_type").attr("zipcode", zipcode)

		//highlight the zipcode boundary and show demographic data
		//highlightZipcode([zipcode]);

		//show legend
		var defaultType = $("#demographic_type div[data-role='collapsible'] h3").attr("value");
		//$(".leaflet-control-legend").html(app.layers.demographicData.getLegend(defaultType)).show();
	} else {
		alert("The coordinates (-1, -1) is not correct. Please select other data. ");
		return;
	}

	//select options for social media
	//$select_media
	//	var location=app.geojsonReader.read(feature.geometry);
	//	var locationX = location.coordinate.x;
	//	var locationY = location.coordinate.y;
	//	//document.getElementById("lng").value = locationY;
	//	//document.getElementById("lat").value = locationX;
	//	$("#lng").val(locationY);
	//	$("#lat").val(locationX);
	//	var $select_media=$("#localInfo_socialMedia");
	//$select_media.html("<br/>Lat: <input type='text' id=lat value=" + locationX + "> <br/>Long: <input type='text' id=lng value=" + locationY + "> <br/>Keyword: <input type='text' id='keyword' value='shoes'><br><button type='button' onclick='callPython()'>Search</button>");

	//using jsts jts topology suite to find out the polygon the point is within
	//	var point=app.geojsonReader.read(feature.geometry);
	//	var polygon, withinLayer;
	//
	//	if(app.layers.demographicData){
	//		$.each(app.layers.demographicData._layers, function(k,layer){
	//			polygon=app.geojsonReader.read(layer.feature.geometry);
	//			if(point.within(polygon)){
	//				withinLayer=layer;
	//				return false; //break the loop
	//			}
	//		});
	//
	//		if(withinLayer){
	//			// $select.change(function(){
	//				// console.log(withinLayer.feature.properties[this.value]);
	//			// });
	//		}
	//	}

}

//highlight zipcode area and show zipcodelayer on the map
function highlightZipcode(zipcodes, options) {
	//show zipcodePanel
	$("#zipcodePanel").show();

	//options
	if (!options) {
		options = {}
	}
	options.zoomToBounds = options.zoomToBounds || false;

	var zipcodeLayer = app.layers.selectedZipcodeLayer;
	if (zipcodeLayer && app.map.hasLayer(zipcodeLayer)) {
		app.map.removeLayer(zipcodeLayer);
		zipcodeLayer.clearLayers();
	}
	zipcodeLayer = new L.featureGroup();
	$.each(zipcodes, function(i, zipcode) {
		var layer = app.geocodingResult.zipcodeLayer[zipcode];
		zipcodeLayer.addLayer(layer);

		if (zipcodes.length == 1) {
			var properties = layer.feature.properties, customerCount = properties["extra-count"], customerRank = properties["extra-count-rank"], columnName = app.geocodingResult.column.statistics, statisticsSum = properties["extra-" + columnName + "_sum"] || null, statisticsRank = properties["extra-" + columnName + "_sum-rank"] || null, totalStatistics = (columnName) ? app.geocodingResult.dataTable.statisticsColumn[columnName].sum : null;

			//show zipcode number
			$("#zipcodePanel h1").html("zipcode: " + zipcodes[0]);
			$("#zipcodePanel img").click(function() {
				showBusinessAction('top_users');
			});
			$("#zipcode_summary").html("Total Customers: " + customerCount + " <font class='rank'>Rank #" + customerRank + "</font>");

			if (statisticsSum && totalStatistics && statisticsRank) {
				$("#zipcode_summary").append("<p>" + "Total " + columnName + ": " + parseFloat(statisticsSum).toFixed(2) + " (" + parseFloat((statisticsSum / totalStatistics) * 100).toFixed(2) + "%) <font class='rank'>Rank#" + statisticsRank + "</font>");
			}
		}
	});
	zipcodeLayer.addTo(app.map).bringToBack();
	app.layers.selectedZipcodeLayer = zipcodeLayer;

	//zoom to bounds
	if (options.zoomToBounds) {
		app.map.fitBounds(zipcodeLayer.getBounds());
	}
}

//business action
function showBusinessAction(type) {
	var zipcodeLayer = app.geocodingResult.zipcodeLayer, selectedZipcode = $("#businessActions_type").attr("zipcode"), dataLength = app.geocodingResult.json.features.length;
	dataArray = [], sort = [{
		column : 1,
		desc : true
	}],
	//draw chart
	chartOptions = {
		googleChartWrapperOptions : {
			chartType : "BarChart",
			containerId : "businessActions_result",
			view : {
				columns : [0, 1]
			},
			options : {
				width : $("#businessActions_select").width(),
				height : $("#businessActions_select").height() - 50,
				title : "",
				titleX : "",
				titleY : "",
				legend : "none", //{position: 'top'},
				chartArea : {
					width : '65%',
					height : '85%',
					top : 10
				},
				fontSize : 11,
				isStacked : true,
				series : {
					0 : {
						color : '#5B92C0',
						visibleInLegend : true
					}
				},
				vAxes : {
					0 : {
						titleTextStyle : {
							color : "#222222"
						},
						textStyle : {
							color : "#222222"
						}
					}
				},
				hAxes : {
					0 : {
						titleTextStyle : {
							color : "#222222"
						},
						textStyle : {
							color : "#222222"
						}
					}
				},
				backgroundColor : {
					fill : 'transparent'
				},
				tooltip : {
					isHtml : true
				},
				is3D : true
			}
		},
		callback : null,
		callback_mouseover : null,
		callback_mouseout : null,
		callback_select : function(e) {
			var zipcode = e.data.getValue(e.row, 0);
			showDemographicData(zipcode);
		}
	};

	switch(type) {
		case "top_users":
			dataArray = new google.visualization.DataTable();
			dataArray.addColumn('string', "zipcodes");
			dataArray.addColumn('number', "customers");
			dataArray.addColumn({
				type : 'string',
				role : 'tooltip',
				'p' : {
					'html' : true
				}
			});
			dataArray.addColumn('number', "highlight");
			dataArray.addColumn({
				type : 'string',
				role : 'tooltip',
				'p' : {
					'html' : true
				}
			});
			dataArray.addColumn('number', "originalCustomers");
			// the original customer number for sorting. But this value will be devided by total number (dataLength) for better presentation

			var highlight = 0, count = 0, tooltip = "", originalCount = 0;
			$.each(zipcodeLayer, function(k, v) {
				originalCount = v.feature.properties["extra-count"];
				highlight = 0;
				count = originalCount;

				if (k == selectedZipcode) {
					highlight = originalCount;
					count = 0;
					//in order to highlight this zipcode bar, the customers number should be set as 0 to show the highlight bar.
				}

				tooltip = "<div id='chartTooltip'><b>Zipcode: </b>" + k + "<br><b>Customers: </b>" + originalCount + " (" + (((originalCount / dataLength).toFixed(4)) * 100) + "%)</div>";
				dataArray.addRow([k, count, tooltip, highlight, tooltip, originalCount / dataLength]);

				//show zipcode layer
				//v.addTo(app.map);
			});

			sort = [{
				column : 5,
				desc : true
			}]//according column 5 (orginalCustomers) to sort whole datasets.

			//chartOptions
			chartOptions.googleChartWrapperOptions.options.series[1] = {
				color : '#ED3D86',
				visibleInLegend : false
			};
			//set bar color=pink for highlight
			chartOptions.googleChartWrapperOptions.options.series[2] = {
				color : 'transparent',
				visibleInLegend : false
			};
			//set bar color=transparent for originalCustomers
			chartOptions.googleChartWrapperOptions.options.titleX = "The number of customers";
			chartOptions.googleChartWrapperOptions.options.titleY = "Zip Codes"
			break;
		case "top_sales":
			var columnName = app.geocodingResult.column.statistics;
			dataArray = [["zipcodes", "sum_" + columnName + ""]];
			$.each(zipcodeLayer, function(k, v) {
				dataArray.push([parseInt(k), v.feature.properties["extra-" + columnName + "_sum"]]);
			});
			chartOptions.googleChartWrapperOptions.options.titleX = "The sum of " + columnName;
			chartOptions.googleChartWrapperOptions.options.titleY = "Zip Codes"
			break;
	}

	//draw google chart
	pathgeo.service.drawGoogleChart(dataArray, [chartOptions], null, null, {
		sort : sort
	});
	//sort, but the sequence of the chart data will be different with the geojson

	//show businessAction dialog
	$("#dialog_businessAction").popup('open');

}

//show demographic Data
function showDemographicData(zipcode) {
	var html_listview = "", html_collapsible = "", properties = app.layers.demographicData.zipcodes[zipcode].feature.properties;

	//show localinfor panel
	//showInfoPanel("localInfoPanel", $("#menuToolbox li[title='Find the Best Business Actions']")[0]);

	//set zipcode attribute in the select_businessAction
	$("#businessActions_type").attr('zipcode', zipcode).change();

	//header
	$("#businessActions_detailTitle").text(properties["NAME"]);

	//highlight zipcode
	highlightZipcode([zipcode], {
		zoomToBounds : true
	});

	//CONTENT
	var html_higher = "<div data-role='collapsible' data-collapsed='false' data-theme='b' data-content-theme='d' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u' data-iconpos='right'>" + "<h4>Higher than the average</h4><ul data-role='listview' data-divider-theme='d'>";
	var html_lower = "<div data-role='collapsible'  data-theme='b' data-content-theme='d' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u' data-iconpos='right'>" + "<h4>Lower than the average</h4><ul data-role='listview' data-divider-theme='d'>";
	$.each(properties, function(k, prop) {
		if (k.split("extra-").length == 1) {// only show origianl properties without extra properties
			//list view
			if (k == 'ZIP' || k == 'NAME' || k == 'STABB' || k == 'AREA' || k == 'id1') {
				if (k == 'ZIP' || k == 'NAME') {
					html_listview += "<li><h4>" + k + "<p>" + prop + "</p></h4></li>";
				}
			} else {
				//					html_collapsible+="<div data-role='collapsible' data-theme='c' data-content-theme='d' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u' data-iconpos='right'>" +
				//					  				 	"<h4 value='" + k + "'>"+ app.demographicData[k] + "<p>" + prop + "</p></h4>"+
				//									 	"<div id='demographicChart_" + k + "' class='demographicChart'></div>" +
				//									  "</div>";

				//classify demographic data to advantage (value >= average of CA) and disadvantage (value< average)
				if (prop >= app.properties_average[k]) {
					html_higher += "<li><a href=# value='" + k + "'><img src='images/1369780713_navigation-up_red.png'><h2>" + app.demographicData[k] + "</h2><p><label>" + prop + "</label> > " + app.properties_average[k] + "</p></a></li>";
				} else {
					html_lower += "<li><a href=# value='" + k + "'><img src='images/1369780924_navigation-down_green.png'><h2>" + app.demographicData[k] + "</h2><p><label>" + prop + "</label> < " + app.properties_average[k] + "</p></a></li>";
				}
			}
			//html+="<li><a href='#'><img src='images/1368477544_FootballPlayer_Male_Dark.png'><p>" + k + "</p><h2>" + prop + "</h2></a></li>";
		}
	});

	//html for collapsible layout
	html_higher += "</ul></div>";
	html_lower += "</ul></div>";
	html_collapsible = html_higher + html_lower;
	//html_collapsible+="</div>";

	//add some properties in the zipcode layer
	var zipcodeLayerProperties = app.geocodingResult.zipcodeLayer[zipcode].feature.properties;
	html_listview += "<li><h4>Total Customers<p>" + zipcodeLayerProperties['extra-count'] + "</p></h4></li>" + "<li><h4>Total " + app.geocodingResult.column.statistics + "<p>" + zipcodeLayerProperties['extra-' + app.geocodingResult.column.statistics + '_sum'] + "</p></h4></li>" + "<ul>";

	//$("#businessActions_detailContent_listview").html(html_listview).listview('refresh');
	//$("#businessActions_detailContent_collapsible").html(html_collapsible).trigger('create');

	//expand events
	$('#businessActions_detailContent_collapsible div.ui-btn-inner a').on('click', function(e, ui) {
		//show demographic layer on the map
		if (app.layers.demographicData) {
			var demographic = app.layers.demographicData, type = $(this).attr('value');

			//highlight the zipcode boundary
			demographic.redrawStyle(type, function(f) {
				var defaultStyle = demographic.options.styles(f, type);

				if (f.properties["ZIP"] == zipcode) {
					defaultStyle.width = 4;
					defaultStyle.color = "#666";
					defaultStyle.dashArray = '';
				}

				console.log(defaultStyle)
				return defaultStyle;
			})

			demographic.addTo(app.map);

			//change legend
			$(".leaflet-control-legend").html(demographic.getLegend(type));
		}
	})

	$('#businessActions_detailContent_collapsible div.ui-collapsible h4').on('click', function(e, ui) {
		//do only when expand
		if (!$(this).hasClass('ui-collapsible-heading-collapsed')) {
			var type = $(this).attr('value'), domID = 'demographicChart_' + type;

			//showDemographicChart(type, zipcode, domID);
		}
	});

	//trigger dataTable to filter the zipcode
	//app.dataTable.fnFilter(zipcode);

	//show the detail of business actions
	//$(".businessActions_tabs").hide();
	//$("#businessActions_detail").show();

	//close dialog_businessAction
	$("#dialog_businessAction").popup('close');

}

//show demographic data chart
function showDemographicChart(type, zipcode, domID) {
	var chartData = [["type", "value"]];
	chartData.push([String(zipcode), app.properties[zipcode][type]]);
	chartData.push(['CA Average', app.properties_average[type]]);

	var chartOptions = {
		googleChartWrapperOptions : {
			chartType : "ColumnChart",
			containerId : domID,
			view : {
				columns : [0, 1]
			},
			options : {
				width : $("#" + domID).width(),
				height : $("#" + domID).height(),
				title : "",
				titleX : "Type",
				titleY : "Value",
				legend : "none",
				//				vAxes:{0:{titleTextStyle:{color:"#ffffff"}, textStyle:{color:"#ffffff"}}},
				//				hAxes:{0:{titleTextStyle:{color: "#ffffff"},textStyle:{color: "#ffffff"}}},
				backgroundColor : {
					fill : 'transparent'
				}
			}
		},
		callback : null,
		callback_mouseover : null,
		callback_mouseout : null,
		callback_select : function(obj) {
			console.log(obj)
		}
	};

	//drawChart
	pathgeo.service.drawGoogleChart(chartData, [chartOptions], null, null);
}

//show chart in the dataTable
function showDataTableChart(geojson) {
	var x = $("#dataTable_chart #select_x").val(), y = $("#dataTable_chart #select_y").val(), type = $(".dataTable_chartType:checked").val();

	if (!x || !y) {
		alert("Please select the x and y axis first");
		return;
	}

	if (x == 'none' || y == 'none') {
		return;
	}

	//draw chart
	var chartOptions = {
		googleChartWrapperOptions : {
			chartType : type,
			containerId : "dataTable_chartContent",
			view : {
				columns : [0, 1]
			},
			options : {
				width : $(".infoPanel").width() - 20,
				height : geojson.features.length * 30,
				title : "",
				titleX : x,
				titleY : y,
				legend : {
					position : 'top'
				},
				chartArea : {
					width : '',
					height : '90%',
					top : 20
				},
				fontSize : 11,
				vAxes : {
					0 : {
						titleTextStyle : {
							color : "#ffffff"
						},
						textStyle : {
							color : "#ffffff"
						}
					}
				},
				hAxes : {
					0 : {
						titleTextStyle : {
							color : "#ffffff"
						},
						textStyle : {
							color : "#ffffff"
						}
					}
				},
				backgroundColor : {
					fill : 'transparent'
				}
			}
		},
		callback : null,
		callback_mouseover : function(obj) {
			showLocalInfo(obj.value.properties._featureID, {
				scrollToRow : true,
				zoomToCenter : true,
				showPopup : true
			})
		},
		callback_mouseout : null,
		callback_select : function(obj) {
			showLocalInfo(obj.value.properties._featureID, {
				scrollToRow : true,
				zoomToCenter : true,
				showPopup : true
			})
		}
	};
	//pathgeo.service.drawGoogleChart(geojson, [chartOptions], [x, y], null, {sort:[{column: 1}]}); //sort, but the sequence of the chart data will be different with the geojson
	pathgeo.service.drawGoogleChart(geojson, [chartOptions], [x, y], null);

}

//show chart in the localInfo
function showLocalInfoChart(data, containerId) {
	var chartOptions = {
		googleChartWrapperOptions : {
			chartType : "ColumnChart",
			//containerId: "localInfo_chart",
			containerId : containerId,
			view : {
				columns : [0, 1]
			},
			options : {
				width : 300,
				height : 200,
				title : "",
				titleX : "",
				titleY : "",
				legend : "",
				vAxes : {
					0 : {
						titleTextStyle : {
							color : "#ffffff"
						},
						textStyle : {
							color : "#ffffff"
						}
					}
				},
				hAxes : {
					0 : {
						titleTextStyle : {
							color : "#ffffff"
						},
						textStyle : {
							color : "#ffffff"
						}
					}
				},
				backgroundColor : {
					fill : 'transparent'
				}
			}
		},
		callback : null,
		callback_mouseover : null,
		callback_mouseout : null,
		callback_select : function(obj) {
			console.log(obj)
		}
	};
	pathgeo.service.drawGoogleChart(data, [chartOptions], null, null);
}

//show zipcode chart
//when user click on the zipcode layer on the map
function showZipcodeChart(domID, zipcode, value, totalValue) {
	var chartOptions = {
		googleChartWrapperOptions : {
			chartType : "PieChart",
			containerId : domID,
			view : {
				columns : [0, 1]
			},
			options : {
				width : 300,
				height : 200,
				title : "",
				titleX : "",
				titleY : "",
				legend : "",
				backgroundColor : {
					fill : 'transparent'
				}
			}
		},
		callback : null,
		callback_mouseover : null,
		callback_mouseout : null,
		callback_select : null
	};

	var data = [["zipcode", "value"], [zipcode, value], ["others", totalValue - value]];

	setTimeout(function() {
		pathgeo.service.drawGoogleChart(data, [chartOptions], null, null);
	}, 10);
}

//search business Intelligent
function searchBusinessIntelligent(geoname) {
	console.log(geoname);
}

//show demo
function showDemo(demoType) {
	var obj = null;

	//show loading image
	$("#uploadData_loading").show();

	// //clear all layers
	// if (app.geocodingResult.layers) {
		// var layerNames = ["geoJsonLayer", "markerClusterLayer", "heatMapLayer"];
// 
		// $.each(layerNames, function(i, layerName) {
			// var layer = app.geocodingResult[layerName];
			// if (layer) {
				// //if layer._map has map object, that means the layer is shown in the map
				// if (layer._map) {
					// app.map.removeLayer(layer);
// 
					// //restore the default background color for the button of map gallery
					// $(".leaflet-control-mapGallery ul li[layer='" + layerName + "']").css('background-color', '');
				// }
				// app.controls.toc.removeLayer(layer);
			// }
		// });
	// }

	switch(demoType) {
		case "SAN FRANCISCO":
			obj = {
				url : 'db/demo-SanFrancisco.json',
				title : '[DEMO] San Francisco shoes customer',
				column : {
					statistics : "sales"
				},
				keywords : []
			}
			break;
		case "SAN DIEGO":
			obj = {
				url : 'db/demo-SDcrime.json',
				title : '[DEMO] San Diego Crime data',
				column : {
					statistics : "type"
				},
				downloadLink : './geocoded_files/incidents-2013-small.csv',
				keywords : [],
				dataID : "1375413042"
			}
			break;
		case "SD-NAVAJO":
			obj = {
				url : 'db/demo-SD-Navajo-201207-09.json',
				title : 'San Diego Navajo Crime rate (2012/07~09)',
				column : {
					statistics : "type"
				},
				downloadLink : './geocoded_files/2012-crime-navajo-three-month-7-9.xls',
				keywords : [],
				dataID : "1376671999"
			}
			break;
		case "SD-PACIFIC-BEACH":
			obj = {
				url : 'db/demo-SD-PacificBeach-201207-09.json',
				title : 'San Diego Pacific Beach Crime rate (2012/07~09)',
				column : {
					statistics : "type"
				},
				downloadLink : './geocoded_files/2012-crime-pacific-beach-three-month-7-9.xls',
				keywords : [],
				dataID : "1376673065"
			}
			break;
	}

	if (obj) {
		$.getJSON(obj.url, function(json) {
			obj.geojson = json;
			obj.type = 'GEOJSON';
			obj.hasGeomask = (json.features[0].geomasked_geometry) ? true : false

			app.geocodingResult = obj;

			//close dialog_uploadData and stop loading img
			$("#uploadData_loading").hide();
			$("#dialog_uploadData").popup("close");

			//showSumup(json);
			showTable(app.geocodingResult, {
				callback : function() {
					//setTimeout(showTutorial, 1000);
				}
			});
		});
	}

	//google anlytics and track event
	_gaq.push(['_trackEvent', 'Data', "Sample-" + demoType, app.userInfo.email]);
}

//show infoPanel
function showInfoPanel(domID, obj) {
	//change obj's background color
	$("#menuToolbox ul li").css("background", "");
	$(obj).css('background', "rgba(255,255,255,0.3)")

	//hide other infoPanels
	$(".infoPanel").hide();

	//show infoPanel
	$("#" + domID).show();

	//resize map
	var width = ($("#content").width() - $(".infoPanel").width() - $("#menuToolbox").width() - 20) / $("#content").width() * 100;
	//$("#div_map").css({width:width+"%"});
	app.map.invalidateSize(false);
}

//close infoPanel
function closeInfoPanel() {
	//cancel obj's background color
	$("#menuToolbox ul li").css("background", "");

	$(".infoPanel").hide();

	//resize map
	$("#div_map").css({
		width : '100%'
	});
	app.map.invalidateSize(false);
}

function showDialog(dom_id) {
	$("#" + dom_id).popup("open");
}

//log out
function logout() {
	//rewite login button
	$("#header_login").attr("href", "#dialog_login").off('click')//disable click event
	// .click(function(){
	// //$("#header_login").attr("href", "#dialog_login");
	// })
	.find(".ui-btn-text").html("Log in");

	//clear cookies
	$.removeCookie('PathGeo', {
		path : '/'
	});

	//refresh webpage
	location.reload();

	//	//hide uploda data  button
	//	$("#header a[href='#dialog_uploadData'], #userPopupMenu").hide();
	//
	//	//close popup
	//	$("#dialog_userMenu").popup('close');
	//	$("#dialog_logout").popup('close');
}

//after login
function afterLogin(email) {
	//close login dialog
	$('#dialog_login').popup('close');

	//rewite login button
	$("#header_login").attr("href", "#").click(function() {
		//$("#header_login").attr("href", "#dialog_userMenu");

		//show user popup menu
		$userPopupMenu = $("#userPopupMenu")
		if ($userPopupMenu.is(":visible")) {
			$("#userPopupMenu").hide()
		} else {
			$("#userPopupMenu").show()
		}
	}).find(".ui-btn-text").html("Account");

	//show upload data and tutorial button
	$("#header a[href='#dialog_uploadData'], #header_tutorial").show();

	//write username into uploadData form
	$("#uploadData_username").attr("value", email)
	$("#uploadData_oauth").attr("value", app.userInfo.oauth)

	setTimeout(function() {
		$("#dialog_uploadData").popup("open");
	}, 500);
}

//get Account info
function getAccountInfo(email, update) {
	$.ajax({
		url : "common/ws/queryAccount.py",
		data : {
			email : email,
			oauth : app.userInfo.oauth
		},
		dataType : "json",
		success : function(json) {
			if (json && json.status && json.status == 'ok' && json.account) {
				writeAccountInfo(json.account, update)
			}
		},
		error : function(e) {
			console.log("[ERROR]getAccountInfo: " + e.responseText);
		}
	});
}

//write account info
function writeAccountInfo(account, update) {
	//load account info
	$.each(account, function(k, v) {
		if ( k in app.userInfo) {
			app.userInfo[k] = v
		}
	})
	//after login
	if (!update) {
		afterLogin(app.userInfo.email);

		//set up account management iframe
		$("#userMenu_iframe").attr("src", 'common/accountManagement.html?email=' + app.userInfo.email + "&oauth=" + app.userInfo.oauth)
	}

	//refresh account info
	refreshAccountInfo();
}

//update account info
function updateAccountInfo(email) {
	getAccountInfo(email, true);
}

//refreshAccountInfo
function refreshAccountInfo() {
	//write user info into userPopupMenu
	var obj = {
		"userPopupMenu_username" : app.userInfo.email,
		"userPopupMenu_credit" : "Credit: " + app.userInfo.credit,
		"userPopupMenu_accountType" : app.userInfo.accountType.toUpperCase()
	}
	$.each(obj, function(k, v) {
		$("#" + k).html(v);
	})
}

//showOauth
function showOauth(provider) {
	//close login dialog
	$("#dialog_login").popup('close');

	if (provider == "google" || provider == 'facebook') {
		app.oauthWindow = window.open("ws/oauth.py?provider=" + provider, provider, "width=800,height=600,left=50,top=50,toolbar=1,status=1")
		//$("#oauth_iframe").attr("src",)
	}

}

//print the map
function print() {
	var html = '<html><head>' + '<link rel="stylesheet"  href="js/leaflet/leaflet.css" />' + '<link rel="stylesheet"  href="css/main.css" />' + '<link rel="stylesheet"  href="css/jquery.dataTables.css" />' + '<style type="text/css">.leaflet-top {display:none;} .leaflet-right {display:none;} #showhideTable {display:none;} } </style>' + '</head>' + '<body style="background:#ffffff;">' + $("#div_map")[0].innerHTML + '</body>' + '</html>';

	//create a window
	var WindowObject = window.open("", "MapTime", "width=800,height=600,top=0,left=0,toolbar=yes,scrollbars=yes,status=yes,resizable=yes");
	WindowObject.document.writeln(html);
	WindowObject.document.close();
	WindowObject.focus();
	WindowObject.print();

}

//show profile
function showProfile(tab) {
	if (!tab) {
		tab = 'account'
	}

	//redirect url
	$("#userMenu_iframe").attr("src", "common/accountManagement.html?email=" + app.userInfo.email + "&oauth=" + app.userInfo.oauth + "&tab=" + tab);
	$("#dialog_userMenu").popup("open");
}

//get client ip and location
function getClientGeo() {
	//get user's city
	geoip2.city(function(jsonSuccess) {
		app.userInfo.city = jsonSuccess.city.names["en"];
		app.userInfo.country = jsonSuccess.country["iso_code"];
	}, function(jsonError) {
		console.log("[ERROR]getClientGeo: " + jsonError.code + "=" + jsonError.error)
	})
}

//filter upload Data
function download() {
	var downloadType = $("#dialog_download input[name=\"downloadType\"]:checked").val(),
		hasGeomask=(downloadType.split("geomask").length>1)?true:false;

	if(downloadType=='all'){
		window.open(app.geocodingResult.downloadLink);
		$("#dialog_download").popup("close");
		return
	}else{
		var filterRowID=null, filterTerm=null,
			obj = app.geocodingResult;
		
		if (obj.filterRowID && obj.filterTerm && obj.filterTerm!='' && downloadType!='all+geomask') {
			filterRowID=obj.filterRowID;
			filterTerm=obj.filterTerm;
		}
		
		//show loading image
		$("#download_loading").show();
		
		
		//get link url
		$.ajax({
			url: "python/filterUploadData.py", 
			data:{
				username: app.userInfo.email,
				oauth:app.userInfo.oauth,
				table:app.geocodingResult.dataID,
				rows:filterRowID,
				term:filterTerm,
				geomask:hasGeomask
			},
			dataType:"json",
			type:"POST",
			success: function(json){
				if (json && json.URL_xls && json.URL_xls != '') {
					window.open(json.URL_xls)
					
					//hide download image
					//show loading image
					$("#download_loading").hide();
					$("#dialog_download").popup("close");
				}
			},
			error: function(e){
				console.log("[ERROR] download: " + e.responseText);
			}
		});
	}
	

	
}

//oath callback
function oauth_callback(accountInfo) {
	//close window
	app.oauthWindow.close();
	
	//save cookie
	$.cookie("PathGeo", {'email': accountInfo.email, 'oauth': accountInfo.oauth}, { expires: 7, path: '/' });
	
	writeAccountInfo(accountInfo);
}

//read tutorial
function readTutorial() {
	//get Tutorial json
	$.getJSON('db/tutorial.json', function(json) {
		app.tutorial = json;
		app.introJS = introJs("#pageMap");
		app.introJS.setOptions({
			steps : json
		}).onchange(function(target) {
			//console.log(target)
		}).oncomplete(function() {
			console.log('tutorial complete')
		});
	});
}

//show Tutorial
function showTutorial() {
	if (app.dataTable) {
		app.introJS.start();
	} else {
		//showDemo('SAN DIEGO');
		alert("Please upload data first or check out our sample data!");
	}
}

//geomask
function geomask() {
	var geomaskType = $("#dialog_geomask input[name='geomaskType']:checked").val();

	app.geomask = false;

	if (geomaskType == 'geomask') {
		app.geomask = true;
	}

	showLayer(app.geocodingResult, {
		isShow : true,
		zoomToExtent : false
	})
}
