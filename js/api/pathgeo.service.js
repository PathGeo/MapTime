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
	 * @param {Object} type      
	 * @param {Object} options
	 * @return {Object} 
	 */
	demographicData:function(options){
		var me=this;
				
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
		options.color=options.color || {
				"HC01_VC04":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC20":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC21":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC23":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC28":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC74":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC85":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC86":function(d) {return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC112":function(d){return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC113":function(d){return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';},
				"HC01_VC115":function(d){return d > 94913  ? '#800026' : d > 81354   ? '#BD0026' : d > 67795   ? '#E31A1C' : d > 54236   ? '#FC4E2A' : d > 40677    ? '#FD8D3C' : d > 27118    ? '#FEB24C' : d >  13559    ? '#FED976' : '#FFEDA0';}
		};
		options.styles=options.styles || function(feature, type){
			if(!type){type=options.type}
			return {
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.6,
				fillColor: options.color[type](feature.properties[type])
			}
		}
		
		
		//url
		this.url="db/CA_ACS11.json"
		
		
		
		//load data
		$.getJSON(this.url, function(json){
			me.json=json;
			
			//create leaflet geojson layer
			me.geojsonLayer=new L.GeoJSON(json, {
				onEachFeature: function(jsonFeature, layer){
					//popup html
					layer.bindPopup(options.popupHTML(jsonFeature),{maxWidth:options.popupMaxWidth, maxHeight:options.popupMaxHeight});
					
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
				
				//style
				style: options.featureStyle,
				
				//customize styles
				styles: options.styles
			});
			
			
			
			//add customize function to redraw layers' style
			me.geojsonLayer.redrawStyle=function(type, style){
				var me=this;
				
				if(!style){
					style=function(feature){
						return me.options.styles(feature, type)
					}
				}
				this.options.style=style;
				this.setStyle(style);
			}
			
			
			//callback
			if(options.callback){options.callback(me.geojsonLayer)}
			
			
		});
				
	}
	
	
}
