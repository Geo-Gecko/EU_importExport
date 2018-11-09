;
(function (d3, $, queue, window) {
	'use strict';
	// https://www.humanitarianresponse.info/en/operations/afghanistan/cvwg-3w
	// https://public.tableau.com/profile/geo.gecko#!/vizhome/Districtpolygon/v1?publish=yes
	'use strict';
	String.prototype.replaceAll = function (search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};
	String.prototype.capitalize = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
	// function capitalizeFirstLetter(string) {
	//   return string.charAt(0).toUpperCase() + string.slice(1);
	// }
	var dataset;
	var myFormat = d3.format(',');
	queue()
	// .defer(d3.json, "./UgandaDistricts.geojson")//CNTRY_NAME
		.defer(d3.json, "./data/euCountries.geojson")
		.defer(d3.csv, "./data/mapValues.csv")
		.defer(d3.csv, "./data/EU_ImportExport.csv")
		.await(ready);





	var whichPage = "imports";
	var global = {};
	global.selectedDistrict = []; // name
	global.selectedSector = []; // ID
	global.selectedAgency = []; // ID
	global.selectedUn = []; // Type UN
	global.selectedIp = []; // Type IP
	global.selectedOp = []; // Type OP
	global.selectedDonor = []; // Type Donor
	global.selectedActorType = []; // Type Actor
	global.districtCount;
	global.parishCount;
	global.sectorCount;
	global.agencyCount;
	global.donorCount;
	global.actorTypeCount;
	global.beneficiaryCount;
	global.unCount;
	global.ipCount;
	global.opCount;
	global.currentEvent;
	// global.needRefreshDistrict;


	function refreshCounts() {
		d3.select("#district-count").text(global.districtCount);
		d3.select("#sector-count").text(global.sectorCount);
		d3.select("#agency-count").text(global.agencyCount);
		d3.select("#beneficiary-count").text(global.beneficiaryCount);
		d3.select("#agencyUN-count").text(global.unCount);
		d3.select("#agencyIP-count").text(global.ipCount);
		d3.select("#agencyOP-count").text(global.opCount);
		global.selectedDistrict = [];
		global.selectedSector = [];
		global.selectedAgency = [];
		global.beneficiaryCount = [];
		global.selectedUn = [];
		global.selectedIp = [];
		global.selectedOp = [];

		d3.selectAll(".d3-active").classed('d3-active', false);
		d3.select("#district-list").selectAll("p").style("background", "transparent");
		d3.select("#sector-list").selectAll("p").style("background", "transparent");
		d3.select("#actor-type-list").selectAll("p").style("background", "transparent");
		d3.select("#agency-list").selectAll("p").style("background", "transparent");
		d3.select("#donor-list").selectAll("p").style("background", "transparent");


		d3.select("#partner-list-count").text(0);
		d3.select("#sector-list-count").text(0);
		d3.select("#parish-list-count").text(0);
		d3.select("#donor-list-count").text(0);
		d3.select("#actor-type-list-count").text(0);
		d3.select("#partner-header-total").text(global.agencyCount);
		d3.select("#sector-header-total").text(global.sectorCount);
		d3.select("#parish-header-total").text(global.parishCount);
		d3.select("#donor-header-total").text(global.donorCount);
		d3.select("#actor-type-header-total").text(global.actorTypeCount);

	}

	function addLegend(domain, color, title) {
		var N = 4;
		var step = Math.round((domain[1] - domain[0]) / N);
		var array = [domain[0] + Math.round(step - step / 2), domain[0] + Math.round(step * 2 - step / 2), domain[0] + Math.round(step * 3 - step / 2), domain[0] + Math.round(step * 4 - step / 2)];
		var arrayLabel = [myFormat(domain[0]).toString() + " - " + (myFormat(domain[0] + step)).toString(), (myFormat(domain[0] + step + 1)).toString() + " - " + (myFormat(domain[0] + step * 2)).toString(), (myFormat(domain[0] + step * 2 + 1)).toString() + " - " + (myFormat(domain[0] + step * 3)).toString(), (myFormat(domain[0] + step * 3 + 1)).toString() + " - " + myFormat(domain[1]).toString()];

		d3.select("#legend").selectAll("svg").remove();
		var legend = d3.selectAll('.c3-legend-item');
		var legendSvg = d3.select('#legend')
		.append('svg')
		//		.attr('width', "auto")
		.attr('height', 150);
		legend.each(function () {
			svg.node().appendChild(this);
		});

		var legendX = 0;
		var legendDY = 20;
		legendSvg.selectAll('.legend-rect')
			.data(array)
			.enter()
			.append('rect')
			.attr('class', 'legend-rect')
			.attr("x", legendX)
			.attr("y", function (d, i) {
			return (i + 1) * legendDY;
		})
			.attr("width", 20)
			.attr("height", 20)
			.style("stroke", "black")
			.style("stroke-width", 0)
			.style("fill", function (d) {
			return color(d);
		});
		//the data objects are the fill colors

		legendSvg.selectAll('.legend-text')
			.data(array)
			.enter()
			.append('text')
			.attr('class', 'legend-text')
			.attr("x", legendX + 25)
			.attr("y", function (d, i) {
			return (i) * legendDY + 25;
		})
			.attr("dy", "0.8em") //place text one line *below* the x,y point
			.text(function (d, i) {
			return arrayLabel[i];
		});

		legendSvg.selectAll('.legend-title')
			.data([title])
			.enter()
			.append('text')
			.attr('class', 'legend-title')
			.attr("x", legendX)
			.attr("y", 0)
			.attr("dy", "0.8em") //place text one line *below* the x,y point
			.text(function (d, i) {
			return d;
		});

	}

	function ready(error, ugandaGeoJson, sector, relationship) {
		//standard for if data is missing, the map shouldnt start.
		if (error) {
			throw error;
		};

		$(".custom-list-header").click(function () {
			$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
			$(this).siblings(".custom-list").toggleClass('collapsed');
			$(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
		});

		// Collapses all the boxes apart from subCounty
		$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
		$("#agency-list.custom-list").removeClass('collapsed');

		//need join all data
		var nameAbbKays = d3.keys(relationship[0]);
		var sectorKays = d3.keys(sector[0]);

		dataset = relationship.map(function (d) {
			var i;	
			for (i = 0; i < sector.length; i++) {
				if (sector[i].Countries === d.Countries) {
					sectorKays.map(function (k) {
						d[k] = sector[i][k];
					});
					break;
				}
			}
			return d;
		});

		var districtList = d3.nest().key(function (d) {
			return d.typeOfExport;
		}).sortKeys(d3.ascending).entries(sector);

		var sectorList = d3.nest().key(function (d) {
			return d.Export;
		}).sortKeys(d3.ascending).entries(sector);

		var agencyList = d3.nest().key(function (d) {
			return d.Import;
		}).sortKeys(d3.ascending).entries(sector);


		var donorList = d3.nest().key(function (d) {
			return d.typeOfImport;
		}).sortKeys(d3.ascending).entries(sector);

		var actorTypeList = d3.nest().key(function (d) {
			if(d.Org_Category !== "") {
				return d.Org_Category;
			}
		}).sortKeys(d3.ascending).entries(relationship);


		// Get the modal
		var modal = document.getElementById('myModal');

		// Get the <span> element that closes the modal
		var span = document.getElementsByClassName("close")[0];

		// When the user clicks on <span> (x), close the modal
		span.onclick = function() {
			modal.style.display = "none";
		}

		// When the user clicks anywhere outside of the modal, close it
		window.onclick = function(event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		}

		$('.modal-content').resizable({
			alsoResize: ".modal-dialog",
			minHeight: 150
		});
		$('.modal-content').draggable();

		$('#myModal').on('show.bs.modal', function () {
			$(this).find('.modal-body').css({
				'max-height':'100%'
			});
		});



		global.districtCount = districtList.length;
		global.parishCount = ugandaGeoJson.features.length;
		global.sectorCount = sectorList.length;
		global.agencyCount = agencyList.length;
		global.donorCount = donorList.length;
		global.actorTypeCount = actorTypeList.length;

		d3.select("#partner-header-total").text(global.agencyCount);
		d3.select("#sector-header-total").text(global.sectorCount);
		d3.select("#parish-header-total").text(global.parishCount);
		d3.select("#donor-header-total").text(global.donorCount);
		d3.select("#actor-type-header-total").text(global.actorTypeCount);

		refreshCounts();
		updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);



		var h = (window.innerHeight ||
				 document.documentElement.clientHeight ||
				 document.body.clientHeight);
		if (h > 540) {
			d3.select(".list-container").style("height", h + "px");
			d3.select("#d3-map-wrapper").style("height", h + "px");
		}
		var w = (window.innerWidth ||
				 document.documentElement.clientWidth ||
				 document.body.clientWidth);
		d3.select(".list-container").style("height", h - 0 + "px")

		var map = new L.Map("d3-map-container", {
			center: [53.03, 5.85],
			zoom: 4,
			zoomControl: true
		});
		
		var legend = L.control({
					position:'topleft'
				});//.addTo(map);
		
		legend.onAdd = function(map){
			var div = L.DomUtil.create('div', 'myclass');
			div.innerHTML= "<div id='legend'></div>";
			return div;
		}
		legend.addTo(map);


		var logo = L.control({position: 'bottomright'});
		logo.onAdd = function(map){
			var div = L.DomUtil.create('div', 'myclass');
			div.innerHTML= "<img style='right: 0; width: 12em' src='css/EU_1.png' alt='EU - UG'>";
			return div;
		}
		logo.addTo(map);

		var flags = L.control({position: 'bottomleft'});
		flags.onAdd = function(map){
			var div = L.DomUtil.create('div', 'myclass');
			div.innerHTML= "";
			return div;
		}
		flags.addTo(map);

		var title = L.control({position: 'topright'});
		title.onAdd = function(map) {
			this._div = L.DomUtil.create('div', 'ctl title');
			this.update();
			return this._div;
		};
		title.update = function(props) {
			this._div.innerHTML = "Uganda <br> Trade";
		};
//		title.addTo(map);

		var _3w_attrib = 'Created by <a href="http://www.geogecko.com">Geo Gecko</a> and © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Powered by <a href="https://d3js.org/">d3</a>';
		var basemap = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});

		basemap.addTo(map);
		var sidebar = L.control.sidebar('sidebar-left').addTo(map);

		sidebar.open("home");


		var ugandaPath;
		var domain = [+Infinity, -Infinity];
		var opacity = 0.3;
		var wrapper = d3.select("#d3-map-wrapper");
		var width = wrapper.node().offsetWidth || 960;
		var height = wrapper.node().offsetHeight || 480;
		var color = d3.scale.linear().domain(domain) //http://bl.ocks.org/jfreyre/b1882159636cc9e1283a
		.interpolate(d3.interpolateHcl)
		.range([d3.rgb("#a7c0f2"), d3.rgb('#003399')]); //#f597aa #a02842
		var tooltip = d3.select(map.getPanes().overlayPane)
		.append("div")
		.attr("class", "d3-tooltip d3-hide");
		var datasetNest = d3.nest().key(function (d) {
			return d.Countries;
		}).entries(dataset);


		var countries = [];
		var countriesOverlay = L.d3SvgOverlay(function (sel, proj) {
			var projection = proj.pathFromGeojson.projection;
			var path = d3.geo.path().projection(projection);

			ugandaPath = sel.selectAll('.district').data(countries);
			ugandaPath.enter()
				.append('path')
				.attr('d', proj.pathFromGeojson)
				.attr("z-index", "600")
				.attr("style", "pointer-events:all!important")
				.style("cursor", "pointer")
				.style("stroke", "#000")
				.each(function (d) {
				d.properties.centroid = projection(d3.geo.centroid(d));
				datasetNest.map(function (c) {
					if (c.key === d.properties.CNTRY_NAME) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						var sumOfExports = 0;
						var sumOfImports = 0;
						d.properties._agencyList = d3.nest().key(function (a) {
							sumOfExports = parseFloat(a["Exports from Uganda 2014"])+parseFloat(a["Exports from Uganda 2015"])+parseFloat(a["Exports from Uganda 2016"])+parseFloat(a["Exports from Uganda 2017"])
							sumOfImports = parseFloat(a["Imports into Uganda 2014"])+parseFloat(a["Imports into Uganda 2015"])+parseFloat(a["Imports into Uganda 2016"])+parseFloat(a["Imports into Uganda 2017"])
							return;
						}).entries(c.values);


						d.properties["Imports into Uganda 2014"] = parseFloat(c.values[0]["Imports into Uganda 2014"]);
						d.properties["Imports into Uganda 2015"] = parseFloat(c.values[0]["Imports into Uganda 2015"]);
						d.properties["Imports into Uganda 2016"] = parseFloat(c.values[0]["Imports into Uganda 2016"]);
						d.properties["Imports into Uganda 2017"] = parseFloat(c.values[0]["Imports into Uganda 2017"]);
						d.properties["Exports from Uganda 2014"] = parseFloat(c.values[0]["Exports from Uganda 2014"]);
						d.properties["Exports from Uganda 2015"] = parseFloat(c.values[0]["Exports from Uganda 2015"]);
						d.properties["Exports from Uganda 2016"] = parseFloat(c.values[0]["Exports from Uganda 2016"]);
						d.properties["Exports from Uganda 2017"] = parseFloat(c.values[0]["Exports from Uganda 2017"]);

						d.properties._sumOfExports = sumOfExports;
						d.properties._sumOfImports = sumOfImports;

						domain[0] = sumOfImports < domain[0] ? sumOfImports :
						domain[
							0];
						domain[1] = sumOfImports > domain[1] ? sumOfImports :
						domain[
							1];
						color.domain(domain);
					}
				});
			})
				.on("click", function (d) {
				var svg = d3.select(this.parentNode.parentNode.parentNode);
				var mouse = d3.mouse(svg.node()).map(function (d) {
					return parseInt(d);
				});
				var str = "<tr><span type='button' class='close' onclick='$(this).parent().hide();'>X</span></tr>" +
					"<th><br/></th><tr><th>District:</th> <th style='right: 0;'><b>" + d.properties.CNTRY_NAME + "</b></th></tr>"+
					"<th><br/></th><br/><tr><th style='left: 50%;'><b>Trade Value 2014 - 2017</b></th></tr>";
				if (d.properties._sectorList && d.properties._agencyList) {

					var agencyListAbb = d3.values(d.properties._agencyList).map(function (d) {
						return d.values.map(function (v) {
							return v.Abbreviation;
						});
					});

					var tooltipList = "";
					var i = 0;
					while (i < agencyListAbb.length) {
						tooltipList = tooltipList + ("<p>" + agencyListAbb[i][0] + "</p>");
						i++
					}

					str = str + "<br><tr><th>UG Imports:</th> <th><b>" + myFormat(d.properties._sumOfImports) + " Euros</b></th></tr>" +
						"<br><tr><th>UG Exports:</th> <th><b>" + myFormat(d.properties._sumOfExports) + " Euros</b></th></tr></div>";
				}
				tooltip.html(str);

				var box = tooltip.node().getBoundingClientRect() || {
					height: 0
				};


				tooltip
					.classed("d3-hide", false)
					.attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1] < height / 2 ? mouse[1] : mouse[
					1] - box.height) + "px; min-width: 200px; max-width: 400px; max-height: 300px; overflow-y: auto;");
				tooltip
					.on("mouseover", function () {
					tooltip.classed("d3-hide", false);
				})
					.on("mouseout", function () {
					tooltip.classed("d3-hide", true);
				});
			})
				.style("fill", function (d) {
				return d.properties._sumOfExports ? color(d.properties._sumOfExports) : "#00000000"; //#3CB371
			})
				.attr("class", function (d) {
				return "district district-" + d.properties.CNTRY_NAME.replaceAll('[ ]', "_");
			});


			ugandaPath.attr('stroke-width', 1 / proj.scale)
				.each(function (d) {
				d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
				datasetNest.map(function (c) {
					if (c.key === d.properties.CNTRY_NAME) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						d.properties._agencyList = d3.nest().key(function (a) {
							return a.Organisation;
						}).entries(c.values);
						domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
						domain[
							0];
						domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
						domain[
							1];
						color.domain(domain);
					}
				});
			})
				.style("fill", function (d) {
				return d.properties._sumOfExports ? color(d.properties._sumOfExports) : "#00000000"; //#3CB371
			})
				.attr("class", function (d) {
				return "district district-" + d.properties.CNTRY_NAME.replaceAll('[ ]', "_");
			});
			ugandaPath.exit().remove();
		});


		countries = ugandaGeoJson.features;
		countriesOverlay.addTo(map);

		addLegend(domain, color, "UG imports 2014 - 2017");


		var imports = d3.select("#homeTab");
		var exports = d3.select("#profileTab");

		imports.on('click', function(){
			whichPage = "exports";
			refreshCounts();
			domain = [+Infinity, -Infinity];
			ugandaPath.each(function (d) {
				datasetNest.map(function (c) {
					if (c.key === d.properties.CNTRY_NAME) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						var sumOfExports = 0;
						var sumOfImports = 0;
						d.properties._agencyList = d3.nest().key(function (a) {
							sumOfExports = parseFloat(a["Exports from Uganda 2014"])+parseFloat(a["Exports from Uganda 2015"])+parseFloat(a["Exports from Uganda 2016"])+parseFloat(a["Exports from Uganda 2017"])
							sumOfImports = parseFloat(a["Imports into Uganda 2014"])+parseFloat(a["Imports into Uganda 2015"])+parseFloat(a["Imports into Uganda 2016"])+parseFloat(a["Imports into Uganda 2017"])
							return;
						}).entries(c.values);


						d.properties["Imports into Uganda 2014"] = parseFloat(c.values[0]["Imports into Uganda 2014"]);
						d.properties["Imports into Uganda 2015"] = parseFloat(c.values[0]["Imports into Uganda 2015"]);
						d.properties["Imports into Uganda 2016"] = parseFloat(c.values[0]["Imports into Uganda 2016"]);
						d.properties["Imports into Uganda 2017"] = parseFloat(c.values[0]["Imports into Uganda 2017"]);
						d.properties["Exports from Uganda 2014"] = parseFloat(c.values[0]["Exports from Uganda 2014"]);
						d.properties["Exports from Uganda 2015"] = parseFloat(c.values[0]["Exports from Uganda 2015"]);
						d.properties["Exports from Uganda 2016"] = parseFloat(c.values[0]["Exports from Uganda 2016"]);
						d.properties["Exports from Uganda 2017"] = parseFloat(c.values[0]["Exports from Uganda 2017"]);

						d.properties._sumOfExports = sumOfExports;
						d.properties._sumOfImports = sumOfImports;

						domain[0] = sumOfImports < domain[0] ? sumOfImports :
						domain[
							0];
						domain[1] = sumOfImports > domain[1] ? sumOfImports :
						domain[
							1];
						color.domain(domain);
					}
				});
			})
				.style("fill", function (d) {
				return d.properties._sumOfImports ? color(d.properties._sumOfImports) : "#00000000"; //#3CB371
			});

			addLegend(domain, color, "UG imports 2014 - 2017");
		})


		exports.on('click', function(){
			whichPage = "imports";
			refreshCounts();
			domain = [+Infinity, -Infinity];
			ugandaPath.each(function (d) {
				datasetNest.map(function (c) {
					if (c.key === d.properties.CNTRY_NAME) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						var sumOfExports = 0;
						var sumOfImports = 0;
						d.properties._agencyList = d3.nest().key(function (a) {
							sumOfExports = parseFloat(a["Exports from Uganda 2014"])+parseFloat(a["Exports from Uganda 2015"])+parseFloat(a["Exports from Uganda 2016"])+parseFloat(a["Exports from Uganda 2017"])
							sumOfImports = parseFloat(a["Imports into Uganda 2014"])+parseFloat(a["Imports into Uganda 2015"])+parseFloat(a["Imports into Uganda 2016"])+parseFloat(a["Imports into Uganda 2017"])
							return;
						}).entries(c.values);


						d.properties["Imports into Uganda 2014"] = parseFloat(c.values[0]["Imports into Uganda 2014"]);
						d.properties["Imports into Uganda 2015"] = parseFloat(c.values[0]["Imports into Uganda 2015"]);
						d.properties["Imports into Uganda 2016"] = parseFloat(c.values[0]["Imports into Uganda 2016"]);
						d.properties["Imports into Uganda 2017"] = parseFloat(c.values[0]["Imports into Uganda 2017"]);
						d.properties["Exports from Uganda 2014"] = parseFloat(c.values[0]["Exports from Uganda 2014"]);
						d.properties["Exports from Uganda 2015"] = parseFloat(c.values[0]["Exports from Uganda 2015"]);
						d.properties["Exports from Uganda 2016"] = parseFloat(c.values[0]["Exports from Uganda 2016"]);
						d.properties["Exports from Uganda 2017"] = parseFloat(c.values[0]["Exports from Uganda 2017"]);

						d.properties._sumOfExports = sumOfExports;
						d.properties._sumOfImports = sumOfImports;

						domain[0] = sumOfExports < domain[0] ? sumOfExports :
						domain[
							0];
						domain[1] = sumOfExports > domain[1] ? sumOfExports :
						domain[
							1];
						color.domain(domain);

					}
				});
			})
				.style("fill", function (d) {
				return d.properties._sumOfExports ? color(d.properties._sumOfExports) : "#00000000"; //#3CB371
			});
			addLegend(domain, color, "UG exports 2014 - 2017");
			console.log(domain);
		})


		function onlyUniqueObject(data) {
			data = data.filter(function (d, index, self) {
				return self.findIndex(function (t) {
					return t.key === d.key;
				}) === index;
			});
			return data;
		}

		function filterSelectedItem(item, c, needRemove) {
			if (needRemove) {
				global[item] = global[item].filter(function (a) {
					return a !== c;
				});
			} else {
				global[item].push(c);
			}
			global[item] = onlyUniqueObject(global[item]); //global[item].filter(onlyUnique);;
		}




		function myFilter(c, flag, needRemove) {
			if (flag === "district") {
				filterSelectedItem("selectedDistrict", c, needRemove);
			}
			if (flag === "sector") {
				filterSelectedItem("selectedSector", c, needRemove);
			}
			if (flag === "agency") {
				filterSelectedItem("selectedAgency", c, needRemove);
			}
			if (flag === "unAgency") {
				filterSelectedItem("selectedUn", c, needRemove);
			}
			if (flag === "ipAgency") {
				filterSelectedItem("selectedIp", c, needRemove);
			}
			if (flag === "opAgency") {
				filterSelectedItem("selectedOp", c, needRemove);
			}
			if (flag === "donor") {
				filterSelectedItem("selectedDonor", c, needRemove);
			}
			if (flag === "actor-type") {
				filterSelectedItem("selectedActorType", c, needRemove);
			}


			var datasetSelected = [];
			var whichdatasetSelected = [];

			var selectedCountry = [];
			var selectedVariable = [];



			var selectedDataset = relationship.filter(function (d) {
				var isDistrict = false; //global.selectedDistrict ? global.selectedDistrict.key === d.District : true;
				if (global.selectedDistrict.length > 0) {
					global.selectedDistrict.map(function (c) {
						if (c.values[0].Countries === d.Countries) {
							isDistrict = true;
							datasetSelected.push(c.key);
							whichdatasetSelected.push("Countries");
						}
					});
				} else {
					isDistrict = true;
				}

				// var isSector = global.selectedSector ? global.selectedSector.values[0].Sector_ID === d.Sector_ID : true;
				var isSector = false;
				if (global.selectedSector.length > 0) {
					global.selectedSector.map(function (c) {
						if (c.values[0].Export === d.Export) {
							isSector = true;
							datasetSelected.push(c.key);
							whichdatasetSelected.push(c.key);
						}
					});
				} else {
					isAgency = true;
				}
				var isAgency = false;
				if (global.selectedAgency.length > 0) {
					global.selectedAgency.map(function (c) {
						if (c.values[0].Import === d.Import) {
							isAgency = true;
							datasetSelected.push(c.key);
							whichdatasetSelected.push(c.key);
						}
					});
				} else {
					isAgency = true;
				}

				var isDonor = false;
				if (global.selectedDonor.length > 0) {
					global.selectedDonor.map(function (c) {
						if (c.values[0].Countries === d.Countries) {
							isDonor = true;
							datasetSelected.push(c.key);
							whichdatasetSelected.push("Countries");
						}
					});
				} else {
					isDonor = true;
				}

				var isActorType = false;
				if (global.selectedActorType.length > 0) {
					global.selectedActorType.map(function (c) {
						if (c.values[0].Org_Category === d.Org_Category) {
							isActorType = true;
						}
					});
				} else {
					isActorType = true;
				}

				return isDistrict && isSector && isAgency && isDonor && isActorType;
			});


			var selected = [whichdatasetSelected].concat([datasetSelected]);

			selectedVariable = selected[0].filter(function (d) {

				if (d !== "Countries") {
					return d;
				}
			});


			domain = [+Infinity, -Infinity];


			if (selectedVariable.length > 0) {
				ugandaPath.each(function (d) {
					relationship.map(function(c){
						if(c.Countries === d.properties.CNTRY_NAME) {
							var sum = 0;
							for (var i = 0; i < selectedVariable.length; i++){
								sum += parseFloat(d.properties[selectedVariable[i]]);
							}
							d.properties._currentSum = sum;
							domain[0] = sum < domain[0] ? sum :
							domain[
								0];
							domain[1] = sum > domain[1] ? sum :
							domain[
								1];
							color.domain(domain);
						}
					})
				}).style("fill", function (d) {
					return d.properties._currentSum ? color(d.properties._currentSum) : "#00000000"; //#3CB371
				});
			}
			var list = "";
			var i = 0;
			while(i<selectedVariable.length){
				list = list + selectedVariable[i].substr(selectedVariable[i].length - 4) + " | ";
				i++
			}

			var title = "UG " + whichPage + " " + list;

			addLegend(domain, color, title);

			var districtList = null;
			if (flag !== "district") {
				districtList = d3.nest().key(function (d) {
					return d.Countries;
				}).sortKeys(d3.ascending).entries(dataset);
			}

			var sectorList = null;
			if (flag !== "sector") {
				sectorList = d3.nest().key(function (d) {
					return d.Export;
				}).sortKeys(d3.ascending).entries(dataset);
			}

			var agencyList = null;
			if (flag !== "agency") {
				agencyList = d3.nest().key(function (d) {
					return d.Import;
				}).sortKeys(d3.ascending).entries(dataset);
			}
			var donorList = null;
			if (flag !== "donor") {
				donorList = d3.nest().key(function (d) {
					return d.Countries;
				}).sortKeys(d3.ascending).entries(dataset);
			}
			var actorTypeList = null;
			if (flag !== "actor-type") {
				actorTypeList = d3.nest().key(function (d) {
					if(d.Org_Category !== "") {
						return d.Org_Category;
					}
				}).sortKeys(d3.ascending).entries(selectedDataset);
			}

			// global.selectedDistrict = districtList;
			updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);

			if (flag === "district") {
				d3.select("#district-count").text(global.selectedDistrict.length);
				d3.select("#parish-list-count").text(global.selectedDistrict.length);
			} else {
				// global.selectedDistrict = districtList;
				d3.select("#district-count").text(districtList.length);
				d3.select("#parish-list-count").text(global.selectedDistrict.length);
				d3.select("#parish-header-total").text(districtList.length);
			}
			if (flag === "sector") {
				d3.select("#sector-count").text(global.selectedSector.length);
				d3.select("#sector-list-count").text(global.selectedSector.length);
			} else {
				d3.select("#sector-count").text(sectorList.length);
				d3.select("#sector-list-count").text(global.selectedSector.length);
				d3.select("#sector-header-total").text(sectorList.length);
				//				d3.select("#sector-list-count").text(sectorList.length);
			}
			if (flag === "agency") {
				d3.select("#agency-count").text(global.selectedAgency.length);
				d3.select("#partner-list-count").text(global.selectedAgency.length);
			} else {
				d3.select("#agency-count").text(agencyList.length);
				d3.select("#partner-header-total").text(agencyList.length);
				d3.select("#partner-list-count").text(global.selectedAgency.length);
			}
			if (flag === "donor") {
				d3.select("#donor-count").text(global.selectedDonor.length);
				d3.select("#donor-list-count").text(global.selectedDonor.length);
			} else {
				d3.select("#donor-count").text(donorList.length);
				d3.select("#donor-header-total").text(donorList.length);
				d3.select("#donor-list-count").text(global.selectedDonor.length);
			}
			if (flag === "actor-type") {
				d3.select("#actor-type-count").text(global.selectedActorType.length);
				d3.select("#actor-type-list-count").text(global.selectedActorType.length);
			} else {
				d3.select("#actor-type-count").text(actorTypeList.length);
				d3.select("#actor-type-header-total").text(actorTypeList.length);
				d3.select("#actor-type-list-count").text(global.selectedActorType.length);
			}



		}



		function updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset) {
			//			if (global.currentEvent !== "district") {
			//				districtList.map(function (a) {
			//					d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
			//					d3.select(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
			//				});
			//			}

			if (districtList) {
				d3.select("#district-count").text(districtList.length);
				var _districtList = d3.select("#district-list").selectAll("p")
				.data(districtList);
				_districtList.enter().append("p")	
					.text(function (d) {
					return d.District;
				})
					.on("click", function (c) {
					d3.selectAll(".labels").style("opacity", opacity);
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#003399");
					global.currentEvent = "district";
					myFilter(c, global.currentEvent, needRemove);

					global.selectedDistrict.map(function (a) {
						d3.selectAll(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
					});
					if(global.selectedDistrict.length === 0){
						refreshMap();}
				});
				_districtList
					.attr("class", function (d) {
					return "district-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_districtList.exit().remove();
			}

			if (sectorList) {
				d3.select("#sector-count").text(sectorList.length);
				var _sectorList = d3.select("#sector-list").selectAll("p")
				.data(sectorList);
				_sectorList.enter().append("p")
					.attr("class", function(d){
					return d.key.replace(/\s/g,'');
				})
					.text(function (d) {
					return d.key;
				})
				// .style("background", "transparent")
					.on("click", function (c) {
					// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
					// d3.select(this).style("background", "#8cc4d3");
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :"#003399");
					global.currentEvent = "sector";
					myFilter(c, global.currentEvent, needRemove);
					// myFilterBySector(c, needRemove);
					if(global.selectedSector.length === 0){
						ugandaPath.each(function (d) {
							datasetNest.map(function (c) {
								if (c.key === d.properties.CNTRY_NAME) {
									d.properties._sectorList = d3.nest().key(function (a) {
										return a.Sector;
									}).entries(c.values);
									var sumOfExports = 0;
									var sumOfImports = 0;
									d.properties._agencyList = d3.nest().key(function (a) {
										sumOfExports = parseFloat(a["Exports from Uganda 2014"])+parseFloat(a["Exports from Uganda 2015"])+parseFloat(a["Exports from Uganda 2016"])+parseFloat(a["Exports from Uganda 2017"])
										sumOfImports = parseFloat(a["Imports into Uganda 2014"])+parseFloat(a["Imports into Uganda 2015"])+parseFloat(a["Imports into Uganda 2016"])+parseFloat(a["Imports into Uganda 2017"])
										return;
									}).entries(c.values);


									d.properties["Imports into Uganda 2014"] = parseFloat(c.values[0]["Imports into Uganda 2014"]);
									d.properties["Imports into Uganda 2015"] = parseFloat(c.values[0]["Imports into Uganda 2015"]);
									d.properties["Imports into Uganda 2016"] = parseFloat(c.values[0]["Imports into Uganda 2016"]);
									d.properties["Imports into Uganda 2017"] = parseFloat(c.values[0]["Imports into Uganda 2017"]);
									d.properties["Exports from Uganda 2014"] = parseFloat(c.values[0]["Exports from Uganda 2014"]);
									d.properties["Exports from Uganda 2015"] = parseFloat(c.values[0]["Exports from Uganda 2015"]);
									d.properties["Exports from Uganda 2016"] = parseFloat(c.values[0]["Exports from Uganda 2016"]);
									d.properties["Exports from Uganda 2017"] = parseFloat(c.values[0]["Exports from Uganda 2017"]);

									d.properties._sumOfExports = sumOfExports;
									d.properties._sumOfImports = sumOfImports;

									domain[0] = sumOfExports < domain[0] ? sumOfExports :
									domain[
										0];
									domain[1] = sumOfExports > domain[1] ? sumOfExports :
									domain[
										1];
									color.domain(domain);
								}
							});
						})
							.style("fill", function (d) {
							return d.properties._sumOfExports ? color(d.properties._sumOfExports) : "#00000000"; //#3CB371
						});
						addLegend(domain, color, "UG exports 2014 - 2017");
					}
				});
				_sectorList //.transition().duration(duration)
					.attr("class", function(d){
					return d.key.replace(/\s/g,'');
				})
					.text(function (d) {
					return d.key;
				});
				_sectorList.exit().remove();
			}

			if (agencyList) {
				d3.select("#agency-count").text(agencyList.length);
				var _agencyList = d3.select("#agency-list").selectAll("p")
				.data(agencyList);
				_agencyList.enter().append("p")
				// .style("background", "transparent")
					.on("click", function (c) {

					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#003399");
					// myFilterByAgency(c, needRemove);
					global.currentEvent = "agency"
					myFilter(c, global.currentEvent, needRemove);
					if(global.selectedAgency.length === 0){
						ugandaPath.each(function (d) {
							datasetNest.map(function (c) {
								if (c.key === d.properties.CNTRY_NAME) {
									d.properties._sectorList = d3.nest().key(function (a) {
										return a.Sector;
									}).entries(c.values);
									var sumOfExports = 0;
									var sumOfImports = 0;
									d.properties._agencyList = d3.nest().key(function (a) {
										sumOfExports = parseFloat(a["Exports from Uganda 2014"])+parseFloat(a["Exports from Uganda 2015"])+parseFloat(a["Exports from Uganda 2016"])+parseFloat(a["Exports from Uganda 2017"])
										sumOfImports = parseFloat(a["Imports into Uganda 2014"])+parseFloat(a["Imports into Uganda 2015"])+parseFloat(a["Imports into Uganda 2016"])+parseFloat(a["Imports into Uganda 2017"])
										return;
									}).entries(c.values);


									d.properties["Imports into Uganda 2014"] = parseFloat(c.values[0]["Imports into Uganda 2014"]);
									d.properties["Imports into Uganda 2015"] = parseFloat(c.values[0]["Imports into Uganda 2015"]);
									d.properties["Imports into Uganda 2016"] = parseFloat(c.values[0]["Imports into Uganda 2016"]);
									d.properties["Imports into Uganda 2017"] = parseFloat(c.values[0]["Imports into Uganda 2017"]);
									d.properties["Exports from Uganda 2014"] = parseFloat(c.values[0]["Exports from Uganda 2014"]);
									d.properties["Exports from Uganda 2015"] = parseFloat(c.values[0]["Exports from Uganda 2015"]);
									d.properties["Exports from Uganda 2016"] = parseFloat(c.values[0]["Exports from Uganda 2016"]);
									d.properties["Exports from Uganda 2017"] = parseFloat(c.values[0]["Exports from Uganda 2017"]);

									d.properties._sumOfExports = sumOfExports;
									d.properties._sumOfImports = sumOfImports;

									domain[0] = sumOfImports < domain[0] ? sumOfImports :
									domain[
										0];
									domain[1] = sumOfImports > domain[1] ? sumOfImports :
									domain[
										1];
									color.domain(domain);
								}
							});
						})
							.style("fill", function (d) {
							return d.properties._sumOfImports ? color(d.properties._sumOfImports) : "#00000000"; //#3CB371
						});

						addLegend(domain, color, "UG imports 2014 - 2017");
					}


				});
				_agencyList
					.html(function(d) {
					return "<a>" + d.key + "</a>"
				})
				_agencyList.exit().remove();
			}

			if (donorList) {
				d3.select("#donor-count").text(donorList.length);
				var _donorList = d3.select("#donor-list").selectAll("p")
				.data(donorList);
				_donorList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
					.on("click", function (c) {
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :"#003399");
					// myFilterByAgency(c, needRemove);
					global.currentEvent = "donor"
					myFilter(c, global.currentEvent, needRemove);
					if(global.selectedDonor.length === 0){
						refreshMap();}
				});
				_donorList
					.text(function (d) {
					return d.key;
				});
				_donorList.exit().remove();
			}

			if (actorTypeList) {
				d3.select("#actor-type-count").text(actorTypeList.length);
				var _actorTypeList = d3.select("#actor-type-list").selectAll("p")
				.data(actorTypeList);
				_actorTypeList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				// .style("background", "transparent")
					.on("click", function (c) {
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :"#003399");
					// myFilterByAgency(c, needRemove);
					global.currentEvent = "actor-type"
					myFilter(c, global.currentEvent, needRemove);
					if(global.selectedActorType.length === 0){
						refreshMap();}
				});
				_actorTypeList
					.text(function (d) {
					return d.key;
				});
				_actorTypeList.exit().remove();
			}

		}

		window.addEventListener("resize", function () {
			var wrapper = d3.select("#d3-map-wrapper");
			var width = wrapper.node().offsetWidth || 960;
			var height = wrapper.node().offsetHeight || 480;
			if (width) {
				d3.select("#d3-map-wrapper").select("svg")
					.attr("viewBox", "0 0 " + width + " " + height)
					.attr("width", width)
					.attr("height", height);
			}
		});
	} // ready



})(d3, $, queue, window);