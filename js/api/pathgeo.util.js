if(!window.pathgeo){window.pathgeo={}}

pathgeo.util={
	/**
	 * convert javascript object to html
	 * @param {Object} obj
	 * @return {String} html string
	 */
	objectToHtml: function(obj){
		if(!obj){console.log("[ERROR]pathgeo.util.objectToHtml: obj is null!");return;}
		
		var html="<ul class='objToHtml'>";
		for(var k in obj){
			html+="<li><b>"+k+"</b>: " + obj[k] + "</li>";
		}
		html+="</ul>";
		
		return html;
	},
	
	
	
	/** 
	 *  highlight keyword
	 */
	highlightKeyword: function(keywords, html){
		//highlight keyword
		var rgxp,rep1;
		$.each(keywords, function(j,keyword){
			rgxp = new RegExp(keyword, 'ig');
			repl = '<span class="highlightKeyword">' + keyword + '</span>';
			html = html.replace(rgxp, repl);
		});
		return html;
	},
	
	
	
	/**
	 * read all features properies in the cluster
	 */
	readClusterFeatureProperies: function(clusterObj,properties){
		if(clusterObj._markers.length>0){
			$.each(clusterObj._markers, function(i,marker){
				properties.push(marker.feature.properties);
			});
		}
		
		if(clusterObj._childClusters.length>0){
			$.each(clusterObj._childClusters, function(i,cluster){
				properties.concat(pathgeo.util.readClusterFeatureProperies(cluster, properties));
			});
		}
		return properties;
	},
	
	
	/**
	 * parse geojsonProperties to Array
	 * @param {GEOJSON} geojson can be featureColleciton or a feature
	 * @return {Object} containing {columns: an array of titles, datas: an array of properties}
	 */
	geojsonPropertiesToArray: function(geojson){
		if(!geojson){console.log("[ERROR] pathgeo.util.geoJsonPropertiesToArray: no geojson");return;}
		
		var obj={
			columns:[],
			datas:[]
		}
		
		//geojson is featureCollection
		if(geojson.type.toUpperCase()=='FEATURECOLLECTION'){
			$.each(geojson.features, function(i, feature){
				//get columns
				if(i==0){
					var temp=parseFeature(feature, true);
					obj.columns=temp.columns;
					obj.datas.push(temp.datas);
				}else{
					obj.datas.push(parseFeature(feature, false).datas)
				}
			});
		}
		
		
		//geojson is a feature
		if(geojson.type.toUpperCase()=='FEATURE'){
			var temp=parseFeature(geojson, true);
			obj.columns=temp.columns;
			obj.datas.push(temp.datas);
		}
		
		return obj;
		
		
		//parse Feature
		function parseFeature(feature, needColumns){
			var columns=[], datas=[];
			$.each(feature.properties, function(k,v){
				if(needColumns){columns.push({"sTitle": k})}
				datas.push(v);
			});
			
			//add coordinates
			if(feature.geometry.type=="Point"){
				if(needColumns)(columns.push({"sTitle": "Coordinates"}));
				var lat=feature.geometry.coordinates[1].toFixed(3),
					lng=feature.geometry.coordinates[0].toFixed(3)
				
				datas.push(lng+", "+lat);
			}
			
			return {columns:columns, datas:datas}
		}
	}
	
		
}
