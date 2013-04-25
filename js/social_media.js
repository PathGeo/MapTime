var curLayer;
//Work in Progrss... social media viewing
function callPython(){
	
	var keywordTemp = document.getElementById("socialMedia_keyword").value;
	var keywordArray = keywordTemp.split(" ");
	keyword = keywordArray[0];
	for(i=1; i<keywordArray.length; i++){
		keyword =  keyword + "+" + keywordArray[i];
	}
	
	var lat = document.getElementById("lat").value;
	var lng = document.getElementById("lng").value;
	
	console.log(lng);
	
	//Search Flickr
	$.ajax({
		type: "POST",
		url: "photo_search.py",
		data: {kwd:keyword, lat:lng, lng:lat},
		beforeSend: function(xhr){
			if (xhr.overrideMimeType){
				xhr.overrideMimeType("application/json");
			}
		}
	}).success(function( contact ) {
		//var contact = JSON.parse(msg);
		//console.log(contact);
		
		//var count = contact.photos.photo.length;
		
		//var social_media = {
			//type: "FeatureCollection",
			//features: []
		//};
		
		//for(i=0; i<count; i++){
			//social_media.features.push({
			//social_media({
				//"type": "Feature",
				//"properties": {"Title": contact.photos.photo[i].title, "Lat": contact.photos.photo[i].latitude, "Lng": contact.photos.photo[i].longitude, "Img": "<div style='height: 200px'><img src='http://farm" + (contact.photos.photo[i].farm)  + ".staticflickr.com/" + (contact.photos.photo[i].server) + "/" + (contact.photos.photo[i].id) + "_" + (contact.photos.photo[i].secret) + "_s.jpg' alt='image here...'>", "Description": contact.photos.photo[i].description._content},
				//"geometry": {"type": "Point", "coordinates": [contact.photos.photo[i].longitude, contact.photos.photo[i].latitude]}
			//});
		//}
		
		setDataMedia(contact);
		app.map.fitBounds(curLayer.getBounds());

	});
}

function getClusterLayerMedia(gjData) {
	var clusterLayer = new L.MarkerClusterGroup({ 
		spiderfyOnMaxZoom: false, 
		showCoverageOnHover: true, 
		zoomToBoundsOnClick: false,
		iconCreateFunction: function(cluster) {
			//return new L.DivIcon({ html: cluster.getChildCount(), className: 'mycluster', iconSize: new L.Point() });
			var amount = cluster.getChildCount();
			if (amount >=10){
				var icon = "<img border='0' src='images/photoIcon_large.png'>";
			}
			else if (amount >=5){
				var icon = "<img border='0' src='images/photoIcon_medium.png'>";
			}
			else{
				var icon = "<img border='0' src='images/photoIcon_small.png'>";
			}
	
			return new L.DivIcon({ html: icon, className: 'mycluster' });
		}
	});
	
	
	clusterLayer.on('clusterclick', function (e) {
		if(!e.layer._popup) {
			//Use tables to align everything???
			var properties = pathgeo.util.readClusterFeatureProperies(e.layer, []);
			var html = "<div class='popup'><p style='font-weight: 900;'>There are " + e.layer._childCount + " addresses:</p><ul>";
			$.each(properties, function(i, property){
				html += "<li><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.Title + "</span><br><div class='extras' style='margin-bottom: 10px;'>" + property.Img + "<br><br>" + property.Description + "</div></li>";
			});
			html+="</ul></div>";
						
			e.layer.bindPopup(html,{maxWidth:500, maxHeight:300}).openPopup();
			
		} else {
			e.layer.openPopup();
		}
		$(".iconExpand").click(function(e) { 
			var element = $(this);
		
			element.siblings(".extras").toggle();  
			
			if (element.hasClass("ui-icon-circle-plus")) {
				element.removeClass("ui-icon-circle-plus");
				element.addClass("ui-icon-circle-minus");
			} else {
				element.removeClass("ui-icon-circle-minus");
				element.addClass("ui-icon-circle-plus");
			}
		});
	});
	
	
	clusterLayer.addLayer(getPointLayerMedia(gjData));
	
	return clusterLayer;
}


//Excpects an array of geoJson features
function getPointLayerMedia(gjData) { 
	var pointLayer = new L.geoJson([], {
		onEachFeature: function (feature, layer) {
			var props = feature.properties;
			var html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Title + "</span><br><div class='extras' style='display: block;'> " + props.Img + "<br><br>" + props.Description + "</li></ul></div>";
			layer.bindPopup(html);
		}, 	pointToLayer: function (feature, latlng) {
			var icon = L.icon({ 
				iconUrl: "images/photoIcon.png",
				popupAnchor: [16, 2],
			});

			marker = L.marker(latlng, {icon: icon});
			return marker; 
		}  
	});
	
	for (var indx in gjData) {
		pointLayer.addData(gjData[indx]);
	}
	
	return pointLayer;
}

function getHeatmapLayerMedia(gjData) {
	var heatmapLayer = new L.TileLayer.heatMap({ 
		radius: 40,
		opacity: 0.75,
		gradient: {
			0.45: "rgb(0,0,255)",
			0.65: "rgb(0,255,255)",
			0.85: "rgb(0,255,0)",
			0.98: "yellow",
			1.0: "rgb(255,0,0)"
		}
	});
	
	var heatmapData = [];
	
	for (var indx in gjData.features) {
		heatmapData.push( { lat: gjData.features[indx].geometry.coordinates[1], lon: gjData.features[indx].geometry.coordinates[0], value: 1 } );
	}
	
	heatmapLayer.addData(heatmapData);
	return heatmapLayer;
}

function switchLayersMedia(newLayerName) { 
	
	if (curLayer && app.map.hasLayer(curLayer)) app.map.removeLayer(curLayer);
	
	if (newLayerName == "heatmap") {
		curLayer = getHeatmapLayerMedia(curData);
		app.map.addLayer(curLayer);
	} else if (newLayerName == "point") { 
		curLayer = getPointLayerMedia(curData);
		app.map.addLayer(curLayer);
	} else if (newLayerName == "cluster") { 
		curLayer = getClusterLayerMedia(curData);
		app.map.addLayer(curLayer);
	}
	else if (newLayerName == "census") {
		enableCensusLayer();
		$(".legend").show();
		curLayer = getPointLayerMedia(curData);
		app.map.addLayer(curLayer);
	}
}

function setDataMedia(data) {
	curData = data;
	$(".features").removeClass("selected").addClass("selectable");
	switchLayersMedia("cluster");
	$("#point").toggleClass("selected selectable");
}